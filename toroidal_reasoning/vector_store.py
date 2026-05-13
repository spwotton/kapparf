"""
Lightweight numpy-based vector store — replaces ChromaDB (broken on 3.14)
=========================================================================
JSON Lines persistence, cosine similarity, Base-53 indexed.
No external DB dependency. Grep-friendly storage format.
"""

from __future__ import annotations

import json
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

import numpy as np

from toroidal_reasoning.constants import base53_checksum


# ═══════════════════════════════════════════════════════════════════════════════
# EMBEDDING VIA LITELLM (falls back to TF-IDF-like hashing)
# ═══════════════════════════════════════════════════════════════════════════════

_EMBED_DIM = 384  # Default dimension for hash embeddings


def _hash_embed(text: str, dim: int = _EMBED_DIM) -> np.ndarray:
    """
    Deterministic hash-based embedding (no LLM call needed).
    Uses character n-gram hashing projected onto a unit sphere.
    Not as good as real embeddings but works offline with zero deps.
    """
    vec = np.zeros(dim, dtype=np.float32)
    text_lower = text.lower()

    # Character trigram hashing
    for i in range(len(text_lower) - 2):
        trigram = text_lower[i : i + 3]
        h = hash(trigram) % dim
        vec[h] += 1.0

    # Word unigram hashing (separate hash space via offset)
    words = text_lower.split()
    for w in words:
        h = hash(w) % dim
        vec[h] += 2.0  # Words are weighted more than trigrams

    # L2 normalize to unit sphere
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm

    return vec


def embed_text(text: str, model: str | None = None) -> np.ndarray:
    """
    Embed text using LiteLLM's embedding API if available,
    falling back to hash-based embedding.
    """
    if model:
        try:
            import litellm
            resp = litellm.embedding(model=model, input=[text])
            return np.array(resp.data[0]["embedding"], dtype=np.float32)
        except Exception:
            pass

    return _hash_embed(text)


# ═══════════════════════════════════════════════════════════════════════════════
# VECTOR STORE
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class VectorDoc:
    """A stored document with its embedding and metadata."""
    id: str
    text: str
    embedding: np.ndarray
    metadata: dict[str, Any] = field(default_factory=dict)
    timestamp: float = 0.0


class VectorStore:
    """
    Lightweight vector store persisted as JSON Lines + .npy arrays.
    Thread-safe for reads, single-writer for writes.
    """

    def __init__(self, store_dir: str | Path = ".vectors"):
        self.store_dir = Path(store_dir)
        self.store_dir.mkdir(parents=True, exist_ok=True)
        self._docs_path = self.store_dir / "docs.jsonl"
        self._vecs_path = self.store_dir / "vectors.npy"
        self._ids: list[str] = []
        self._texts: list[str] = []
        self._metadatas: list[dict[str, Any]] = []
        self._embeddings: np.ndarray | None = None
        self._load()

    def _load(self):
        """Load existing store from disk."""
        if self._docs_path.exists():
            with open(self._docs_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line:
                        continue
                    doc = json.loads(line)
                    self._ids.append(doc["id"])
                    self._texts.append(doc["text"])
                    self._metadatas.append(doc.get("metadata", {}))

        if self._vecs_path.exists() and self._ids:
            self._embeddings = np.load(self._vecs_path)
            # Trim if out of sync
            if len(self._embeddings) > len(self._ids):
                self._embeddings = self._embeddings[: len(self._ids)]
        else:
            self._embeddings = None

    def _save(self):
        """Persist to disk."""
        with open(self._docs_path, "w", encoding="utf-8") as f:
            for i, doc_id in enumerate(self._ids):
                record = {
                    "id": doc_id,
                    "text": self._texts[i],
                    "metadata": self._metadatas[i],
                }
                f.write(json.dumps(record, ensure_ascii=False) + "\n")

        if self._embeddings is not None:
            np.save(self._vecs_path, self._embeddings)

    def add(
        self,
        text: str,
        metadata: dict[str, Any] | None = None,
        doc_id: str | None = None,
        embed_model: str | None = None,
    ) -> str:
        """Add a document to the store. Returns its ID."""
        if doc_id is None:
            doc_id = base53_checksum(text + str(time.time()))

        # Skip duplicates by ID
        if doc_id in self._ids:
            return doc_id

        embedding = embed_text(text, model=embed_model)

        self._ids.append(doc_id)
        self._texts.append(text)
        self._metadatas.append(metadata or {})

        if self._embeddings is None:
            self._embeddings = embedding.reshape(1, -1)
        else:
            # Ensure dimension compatibility
            if embedding.shape[0] != self._embeddings.shape[1]:
                # Re-embed to match stored dimension
                embedding = _hash_embed(text, dim=self._embeddings.shape[1])
            self._embeddings = np.vstack([self._embeddings, embedding.reshape(1, -1)])

        self._save()
        return doc_id

    def add_batch(
        self,
        texts: list[str],
        metadatas: list[dict[str, Any]] | None = None,
        embed_model: str | None = None,
    ) -> list[str]:
        """Add multiple documents. Returns list of IDs."""
        if metadatas is None:
            metadatas = [{}] * len(texts)

        ids = []
        for text, meta in zip(texts, metadatas):
            doc_id = self.add(text, metadata=meta, embed_model=embed_model)
            ids.append(doc_id)
        return ids

    def search(
        self,
        query: str,
        top_k: int = 5,
        embed_model: str | None = None,
        metadata_filter: dict[str, Any] | None = None,
    ) -> list[dict[str, Any]]:
        """
        Cosine similarity search. Returns top-k results with scores.
        """
        if not self._ids or self._embeddings is None:
            return []

        q_emb = embed_text(query, model=embed_model)

        # Ensure dimension compatibility
        if q_emb.shape[0] != self._embeddings.shape[1]:
            q_emb = _hash_embed(query, dim=self._embeddings.shape[1])

        # Cosine similarity
        norms = np.linalg.norm(self._embeddings, axis=1, keepdims=True)
        norms = np.where(norms == 0, 1, norms)  # avoid div-by-zero
        normed = self._embeddings / norms

        q_norm = np.linalg.norm(q_emb)
        if q_norm > 0:
            q_emb = q_emb / q_norm

        scores = normed @ q_emb

        # Metadata filter
        mask = np.ones(len(self._ids), dtype=bool)
        if metadata_filter:
            for i, meta in enumerate(self._metadatas):
                for k, v in metadata_filter.items():
                    if meta.get(k) != v:
                        mask[i] = False

        scores[~mask] = -1.0
        top_indices = np.argsort(scores)[::-1][:top_k]

        results = []
        for idx in top_indices:
            if scores[idx] < 0:
                continue
            results.append({
                "id": self._ids[idx],
                "text": self._texts[idx],
                "score": float(scores[idx]),
                "metadata": self._metadatas[idx],
            })

        return results

    def count(self) -> int:
        return len(self._ids)

    def delete(self, doc_id: str) -> bool:
        """Delete a document by ID."""
        if doc_id not in self._ids:
            return False
        idx = self._ids.index(doc_id)
        self._ids.pop(idx)
        self._texts.pop(idx)
        self._metadatas.pop(idx)
        if self._embeddings is not None:
            self._embeddings = np.delete(self._embeddings, idx, axis=0)
            if len(self._embeddings) == 0:
                self._embeddings = None
        self._save()
        return True

    def clear(self):
        """Nuke the store."""
        self._ids.clear()
        self._texts.clear()
        self._metadatas.clear()
        self._embeddings = None
        if self._docs_path.exists():
            self._docs_path.unlink()
        if self._vecs_path.exists():
            self._vecs_path.unlink()

    def stats(self) -> dict[str, Any]:
        """Store statistics."""
        return {
            "total_docs": len(self._ids),
            "embed_dim": self._embeddings.shape[1] if self._embeddings is not None else 0,
            "store_dir": str(self.store_dir),
            "docs_file_kb": round(self._docs_path.stat().st_size / 1024, 1) if self._docs_path.exists() else 0,
            "vecs_file_kb": round(self._vecs_path.stat().st_size / 1024, 1) if self._vecs_path.exists() else 0,
        }
