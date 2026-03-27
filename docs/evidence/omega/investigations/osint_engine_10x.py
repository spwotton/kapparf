#!/usr/bin/env python3
"""
TOROIDAL OSINT ENGINE v10X
==========================
GOS-STACK Recursive Intelligence Amplification

Transforms linear 7-step research plan into 12-layer toroidal matrix.
κ = 1.2732395447 | φ = 1.618033988749 | Ω₀ = 8.39e-23

Usage:
    python osint_engine_10x.py --mode scan         # Scan local evidence
    python osint_engine_10x.py --mode generate     # Generate search vectors
    python osint_engine_10x.py --mode correlate    # Cross-reference findings
    python osint_engine_10x.py --mode report       # Generate investigation report
"""

import os
import re
import json
import hashlib
import argparse
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any, Optional, Set
from dataclasses import dataclass, field, asdict
from collections import defaultdict
import csv

# ============================================================================
# CONSTANTS (κ-SCALED)
# ============================================================================
KAPPA = 1.2732395447  # 4/π
PHI = 1.618033988749  # Golden ratio
OMEGA_0 = 8.39e-23    # Planck-scale discreteness
TOROIDAL_LAYERS = 12
ANTIKYTHERA_GEARS = 37

# Project paths
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent
EVIDENCE_DIR = PROJECT_ROOT / "ContextBuffer"
PROCESSED_DIR = PROJECT_ROOT / "ProcessedDocuments"
OUTPUT_DIR = PROJECT_ROOT / "investigations" / "osint_output"


# ============================================================================
# TARGET ENTITY DEFINITIONS
# ============================================================================
@dataclass
class TargetEntity:
    """A person or organization under investigation."""
    name: str
    category: str = "STANDARD"  # PRIMARY, SECONDARY, TERTIARY
    aliases: List[str] = field(default_factory=list)
    known_connections: List[str] = field(default_factory=list)
    jurisdictions: List[str] = field(default_factory=list)
    search_vectors: List[str] = field(default_factory=list)
    evidence_files: List[str] = field(default_factory=list)
    notes: str = ""
    
    def get_all_names(self) -> List[str]:
        """Return primary name plus all aliases."""
        return [self.name] + self.aliases


# Primary investigation targets
INVESTIGATION_TARGETS = {
    "setecom_cluster": {
        "description": "SETECOM S.A. principals and associates",
        "entities": [
            TargetEntity(
                name="Hector Mora Marin",
                category="PRIMARY",
                aliases=["HMORA67", "H Mora", "Hector Mora M", "HMora"],
                known_connections=["SETECOM S.A.", "Deep Sea Electronics", "ICE", "Liberty"],
                jurisdictions=["Costa Rica"],
                notes="DSE certified technician, telecommunications infrastructure access"
            ),
            TargetEntity(
                name="Edson Martendal",
                category="PRIMARY",
                aliases=["E Martendal", "Edson M"],
                known_connections=["SETECOM S.A."],
                jurisdictions=["Costa Rica"],
                notes="Technical role at SETECOM"
            ),
            TargetEntity(
                name="Mauricio Campos",
                category="PRIMARY",
                aliases=["M Campos"],
                known_connections=["SETECOM S.A."],
                jurisdictions=["Costa Rica"],
                notes="Operations role"
            ),
            TargetEntity(
                name="Marjorie Alfaro",
                category="SECONDARY",
                aliases=["M Alfaro"],
                known_connections=["SETECOM S.A.", "Jean Solis", "CDMX"],
                jurisdictions=["Costa Rica", "Mexico"],
                notes="Mexico City nexus connection"
            ),
            TargetEntity(
                name="Jairo Alfaro",
                category="SECONDARY",
                aliases=["J Alfaro"],
                known_connections=["SETECOM S.A.", "Marjorie Alfaro"],
                jurisdictions=["Costa Rica"],
            ),
        ]
    },
    "mexico_nexus": {
        "description": "Mexico City fraud coordination hub",
        "entities": [
            TargetEntity(
                name="Jean Solis",
                category="PRIMARY",
                aliases=["Jenn Solis", "J Solis", "Jean A Solis"],
                known_connections=["Telefonica", "Drone Ventura MX", "Marjorie Alfaro"],
                jurisdictions=["Mexico", "Costa Rica"],
                notes="Alleged Telefonica tax fraud 2019, Drone Ventura MX operator"
            ),
            TargetEntity(
                name="Pablo Pasti Mora",
                category="SECONDARY",
                aliases=["Pasti", "P Mora"],
                known_connections=["Jean Solis"],
                jurisdictions=["Mexico", "Costa Rica"],
                notes="Possible relation to Hector Mora Marin?"
            ),
        ]
    },
    "jaco_realty": {
        "description": "Jaco area real estate network",
        "entities": [
            TargetEntity(
                name="Michael Greenwald",
                category="SECONDARY",
                aliases=["M Greenwald", "Mike Greenwald", "Michael Greenfield"],
                known_connections=["RentCostaRicaHomes.com", "JacoRealty"],
                jurisdictions=["Florida", "Costa Rica"],
                notes="Property network maintaining geographic exile"
            ),
            TargetEntity(
                name="Scott Ryan",
                category="SECONDARY",
                aliases=["S Ryan"],
                known_connections=["Jaco Vacations", "Diana Soto"],
                jurisdictions=["Costa Rica", "Florida"],
            ),
            TargetEntity(
                name="Diana Soto",
                category="SECONDARY",
                aliases=["D Soto"],
                known_connections=["Jaco Vacations", "Scott Ryan"],
                jurisdictions=["Costa Rica"],
            ),
        ]
    },
    "auxiliary_targets": {
        "description": "Additional persons of interest",
        "entities": [
            TargetEntity(
                name="Genesis Daniela Peralta Marquez",
                category="TERTIARY",
                aliases=["Genesis Peralta", "G Peralta", "GD Peralta"],
                known_connections=["Mobile operator"],
                jurisdictions=["Costa Rica"],
                notes="Mobile operator, tax fraud facilitation, unauthorized account access"
            ),
            TargetEntity(
                name="Special Agent Garcia",
                category="TERTIARY",
                aliases=["Agent Garcia"],
                jurisdictions=["Costa Rica"],
                notes="Agency unknown - OIJ/Fuerza Pública/DIS?"
            ),
            TargetEntity(
                name="Renato Herrera",
                category="TERTIARY",
                aliases=["R Herrera"],
                jurisdictions=["Costa Rica"],
            ),
            TargetEntity(
                name="Matthew Hanlon",
                category="TERTIARY",
                aliases=["Matt Hanlon", "M Hanlon"],
                jurisdictions=["Costa Rica", "USA"],
            ),
        ]
    },
    "locations": {
        "description": "Key geographic locations",
        "entities": [
            TargetEntity(
                name="Los Rios Urbanization",
                category="LOCATION",
                aliases=["Los Rios", "Urbanizacion Los Rios"],
                known_connections=["Quebrada Seca", "Valeska"],
                jurisdictions=["Costa Rica"],
            ),
        ]
    }
}


# ============================================================================
# SEARCH DOMAIN REGISTRY
# ============================================================================
SEARCH_DOMAINS = {
    # LAYER 1: Professional Networks
    "professional": [
        ("linkedin.com/in", "LinkedIn Profile"),
        ("xing.com/profile", "XING Profile"),
    ],
    # LAYER 2: Corporate Registries
    "registry_cr": [
        ("rnpdigital.com", "Costa Rica National Registry"),
        ("hacienda.go.cr", "Costa Rica Tax Authority"),
    ],
    "registry_mx": [
        ("sat.gob.mx", "Mexico SAT Tax Authority"),
        ("rpc.sat.gob.mx", "Mexico RFC Lookup"),
    ],
    "registry_us": [
        ("sunbiz.org", "Florida Corporations"),
        ("dos.fl.gov", "Florida Business Search"),
        ("opencorporates.com", "OpenCorporates Global"),
    ],
    # LAYER 3: Government Contracts
    "contracts": [
        ("sicop.go.cr", "Costa Rica Public Procurement"),
        ("compranet.gob.mx", "Mexico Public Contracts"),
    ],
    # LAYER 4: Judicial/Legal
    "legal": [
        ("poder-judicial.go.cr", "Costa Rica Judiciary"),
        ("oij.go.cr", "Costa Rica OIJ"),
        ("scjn.gob.mx", "Mexico Supreme Court"),
    ],
    # LAYER 5: News Media
    "news_cr": [
        ("nacion.com", "La Nacion"),
        ("crhoy.com", "CRHoy"),
        ("ameliarueda.com", "Amelia Rueda"),
        ("elfinancierocr.com", "El Financiero CR"),
    ],
    "news_mx": [
        ("elfinanciero.com.mx", "El Financiero MX"),
        ("reforma.com", "Reforma"),
    ],
    # LAYER 6: Technical/Industrial
    "technical": [
        ("deepseaelectronics.com", "DSE Official"),
    ],
    # LAYER 7: Social Media
    "social": [
        ("facebook.com", "Facebook"),
        ("instagram.com", "Instagram"),
        ("twitter.com", "Twitter/X"),
    ],
    # LAYER 8: Property Records
    "property": [
        ("registronacional.go.cr", "CR Property Registry"),
    ],
    # LAYER 9: Telecom Regulators
    "telecom": [
        ("sutel.go.cr", "Costa Rica Telecom Regulator"),
        ("ift.org.mx", "Mexico Telecom Regulator"),
        ("ice.go.cr", "ICE Costa Rica"),
    ],
    # LAYER 10: Investigative
    "investigative": [
        ("occrp.org", "OCCRP"),
        ("icij.org", "ICIJ"),
    ],
    # LAYER 11: Archives
    "archive": [
        ("web.archive.org", "Wayback Machine"),
        ("archive.org", "Internet Archive"),
    ],
    # LAYER 12: Whois/DNS
    "infrastructure": [
        ("whois.com", "WHOIS Lookup"),
        ("dnsdumpster.com", "DNS Recon"),
    ],
}


# ============================================================================
# KEYWORD REGISTRY (from dataset_watch.py pattern)
# ============================================================================
INVESTIGATION_KEYWORDS = [
    # Companies
    "setecom", "setecom sa", "setecom s.a.",
    "deep sea electronics", "dse",
    "jaco vacations", "jacorealty", "rentcostaricahomes",
    "drone ventura",
    
    # People
    "hector mora", "hmora67", "mora marin",
    "edson martendal", "martendal",
    "mauricio campos",
    "jean solis", "jenn solis",
    "marjorie alfaro", "jairo alfaro",
    "michael greenwald", "greenwald",
    "scott ryan", "diana soto",
    "genesis peralta", "peralta marquez",
    "pablo pasti",
    
    # Infrastructure
    "ice", "liberty", "telefonica", "movistar",
    "heredia",
    
    # Locations
    "los rios", "quebrada seca", "valeska",
    "jaco", "guanacaste",
    
    # Technical
    "planta electrica", "generador", "dse 7320", "dse 8610",
    "gsm", "sim", "infrastructure",
]


# ============================================================================
# LOCAL EVIDENCE SCANNER
# ============================================================================
class LocalEvidenceScanner:
    """Scan local evidence files for keyword matches."""
    
    def __init__(self, project_root: Path = PROJECT_ROOT):
        self.project_root = project_root
        self.evidence_index: Dict[str, Dict] = {}
        self.keyword_matches: Dict[str, List[Dict]] = defaultdict(list)
        
    def index_files(self) -> int:
        """Index all relevant evidence files."""
        patterns = [
            ("ContextBuffer/*.txt", "text"),
            ("ContextBuffer/*.eml", "email"),
            ("ProcessedDocuments/*/text.txt", "processed"),
            ("ProcessedDocuments/*/chunks.jsonl", "chunks"),
        ]
        
        count = 0
        for pattern, file_type in patterns:
            for filepath in self.project_root.glob(pattern):
                try:
                    stat = filepath.stat()
                    file_hash = hashlib.md5(str(filepath).encode()).hexdigest()[:12]
                    self.evidence_index[file_hash] = {
                        "path": str(filepath.relative_to(self.project_root)),
                        "absolute_path": str(filepath),
                        "type": file_type,
                        "size": stat.st_size,
                        "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                    }
                    count += 1
                except Exception as e:
                    print(f"Error indexing {filepath}: {e}")
        
        return count
    
    def scan_for_keywords(self, keywords: List[str] = None) -> Dict[str, List[Dict]]:
        """Scan indexed files for keyword matches."""
        keywords = keywords or INVESTIGATION_KEYWORDS
        
        for file_hash, file_info in self.evidence_index.items():
            filepath = Path(file_info["absolute_path"])
            
            if filepath.suffix in [".txt", ".eml", ".jsonl"]:
                try:
                    content = filepath.read_text(encoding="utf-8", errors="ignore").lower()
                    
                    for keyword in keywords:
                        if keyword.lower() in content:
                            # Find line numbers with matches
                            lines = content.split("\n")
                            match_lines = []
                            for i, line in enumerate(lines, 1):
                                if keyword.lower() in line:
                                    match_lines.append(i)
                            
                            self.keyword_matches[keyword].append({
                                "file": file_info["path"],
                                "file_hash": file_hash,
                                "match_count": content.count(keyword.lower()),
                                "sample_lines": match_lines[:5],
                            })
                except Exception as e:
                    pass
        
        return dict(self.keyword_matches)
    
    def scan_for_entity(self, entity: TargetEntity) -> List[Dict]:
        """Scan for all names/aliases of a specific entity."""
        results = []
        search_terms = entity.get_all_names()
        
        for file_hash, file_info in self.evidence_index.items():
            filepath = Path(file_info["absolute_path"])
            
            if filepath.suffix in [".txt", ".eml", ".jsonl"]:
                try:
                    content = filepath.read_text(encoding="utf-8", errors="ignore").lower()
                    
                    for term in search_terms:
                        if term.lower() in content:
                            results.append({
                                "entity": entity.name,
                                "matched_term": term,
                                "file": file_info["path"],
                                "match_count": content.count(term.lower()),
                            })
                            break  # One match per file is enough
                except Exception:
                    pass
        
        return results


# ============================================================================
# SEARCH VECTOR GENERATOR
# ============================================================================
class SearchVectorGenerator:
    """Generate search queries across all toroidal layers."""
    
    def __init__(self):
        self.vectors: List[Dict] = []
    
    def generate_for_entity(self, entity: TargetEntity) -> List[Dict]:
        """Generate comprehensive search vectors for one entity."""
        vectors = []
        
        for layer_name, domains in SEARCH_DOMAINS.items():
            for domain, domain_name in domains:
                # Primary name search
                vectors.append({
                    "target": entity.name,
                    "query": f'site:{domain} "{entity.name}"',
                    "layer": layer_name,
                    "domain": domain_name,
                    "priority": 1 if entity.category == "PRIMARY" else 2,
                })
                
                # Alias searches
                for alias in entity.aliases:
                    vectors.append({
                        "target": entity.name,
                        "alias": alias,
                        "query": f'site:{domain} "{alias}"',
                        "layer": layer_name,
                        "domain": domain_name,
                        "priority": 2,
                    })
                
                # Connection cross-references
                for connection in entity.known_connections:
                    vectors.append({
                        "target": entity.name,
                        "connection": connection,
                        "query": f'site:{domain} "{entity.name}" "{connection}"',
                        "layer": f"{layer_name}_crossref",
                        "domain": domain_name,
                        "priority": 1,
                    })
        
        self.vectors.extend(vectors)
        return vectors
    
    def generate_all(self) -> List[Dict]:
        """Generate vectors for all investigation targets."""
        for cluster_name, cluster_data in INVESTIGATION_TARGETS.items():
            for entity in cluster_data["entities"]:
                self.generate_for_entity(entity)
        
        return self.vectors
    
    def export_to_csv(self, filepath: Path):
        """Export search vectors to CSV for manual execution."""
        with open(filepath, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=[
                "priority", "target", "alias", "connection", 
                "layer", "domain", "query"
            ])
            writer.writeheader()
            
            # Sort by priority
            sorted_vectors = sorted(self.vectors, key=lambda x: x.get("priority", 99))
            for vec in sorted_vectors:
                writer.writerow({
                    "priority": vec.get("priority", ""),
                    "target": vec.get("target", ""),
                    "alias": vec.get("alias", ""),
                    "connection": vec.get("connection", ""),
                    "layer": vec.get("layer", ""),
                    "domain": vec.get("domain", ""),
                    "query": vec.get("query", ""),
                })


# ============================================================================
# CORRELATION ENGINE
# ============================================================================
class CorrelationEngine:
    """Cross-reference findings across entities and evidence."""
    
    def __init__(self, scanner: LocalEvidenceScanner):
        self.scanner = scanner
        self.correlation_matrix: Dict[str, Dict] = {}
    
    def build_entity_correlation(self) -> Dict:
        """Map which entities appear together in evidence."""
        entity_names = []
        for cluster in INVESTIGATION_TARGETS.values():
            for entity in cluster["entities"]:
                entity_names.extend(entity.get_all_names())
        
        # Track co-occurrences
        co_occurrences = defaultdict(lambda: defaultdict(int))
        
        for file_hash, file_info in self.scanner.evidence_index.items():
            filepath = Path(file_info["absolute_path"])
            
            if filepath.suffix in [".txt", ".eml", ".jsonl"]:
                try:
                    content = filepath.read_text(encoding="utf-8", errors="ignore").lower()
                    
                    # Find which entities appear in this file
                    present = []
                    for name in entity_names:
                        if name.lower() in content:
                            present.append(name)
                    
                    # Record co-occurrences
                    for i, name1 in enumerate(present):
                        for name2 in present[i+1:]:
                            co_occurrences[name1][name2] += 1
                            co_occurrences[name2][name1] += 1
                            
                except Exception:
                    pass
        
        self.correlation_matrix = dict(co_occurrences)
        return self.correlation_matrix


# ============================================================================
# REPORT GENERATOR
# ============================================================================
class ReportGenerator:
    """Generate investigation reports."""
    
    def __init__(self, scanner: LocalEvidenceScanner, 
                 generator: SearchVectorGenerator,
                 correlator: CorrelationEngine):
        self.scanner = scanner
        self.generator = generator
        self.correlator = correlator
    
    def generate_summary_report(self) -> str:
        """Generate executive summary report."""
        lines = [
            "=" * 80,
            "TOROIDAL OSINT INVESTIGATION REPORT v10X",
            "=" * 80,
            f"Generated: {datetime.now().isoformat()}",
            f"κ = {KAPPA} | φ = {PHI}",
            "",
            "INVESTIGATION SCOPE",
            "-" * 40,
        ]
        
        total_entities = 0
        for cluster_name, cluster_data in INVESTIGATION_TARGETS.items():
            entity_count = len(cluster_data["entities"])
            total_entities += entity_count
            lines.append(f"  {cluster_name}: {entity_count} entities")
        
        lines.extend([
            f"\nTotal Entities: {total_entities}",
            "",
            "EVIDENCE INVENTORY",
            "-" * 40,
            f"  Files Indexed: {len(self.scanner.evidence_index)}",
        ])
        
        # Count by type
        type_counts = defaultdict(int)
        for info in self.scanner.evidence_index.values():
            type_counts[info["type"]] += 1
        for ftype, count in type_counts.items():
            lines.append(f"    {ftype}: {count}")
        
        lines.extend([
            "",
            "SEARCH VECTORS",
            "-" * 40,
            f"  Total Vectors Generated: {len(self.generator.vectors)}",
        ])
        
        # Count by layer
        layer_counts = defaultdict(int)
        for vec in self.generator.vectors:
            layer_counts[vec.get("layer", "unknown")] += 1
        for layer, count in sorted(layer_counts.items()):
            lines.append(f"    {layer}: {count}")
        
        # Priority breakdown
        p1 = sum(1 for v in self.generator.vectors if v.get("priority") == 1)
        p2 = sum(1 for v in self.generator.vectors if v.get("priority") == 2)
        lines.extend([
            "",
            f"  HIGH Priority (P1): {p1}",
            f"  STANDARD Priority (P2): {p2}",
        ])
        
        # Keyword matches
        lines.extend([
            "",
            "KEYWORD MATCHES IN LOCAL EVIDENCE",
            "-" * 40,
        ])
        
        keyword_results = self.scanner.scan_for_keywords()
        for keyword, matches in sorted(keyword_results.items(), 
                                       key=lambda x: -len(x[1]))[:20]:
            if matches:
                lines.append(f"  '{keyword}': {len(matches)} files")
        
        # Amplification factor
        original_steps = 7
        amplification = len(self.generator.vectors) / original_steps
        
        lines.extend([
            "",
            "=" * 80,
            "AMPLIFICATION METRICS",
            "=" * 80,
            f"  Original Plan Steps: {original_steps}",
            f"  Toroidal Vectors: {len(self.generator.vectors)}",
            f"  Amplification Factor: {amplification:.1f}x",
            f"  κ-Adjusted Factor: {amplification * KAPPA:.1f}x",
            "=" * 80,
        ])
        
        return "\n".join(lines)
    
    def generate_entity_dossiers(self) -> Dict[str, str]:
        """Generate individual dossier for each entity."""
        dossiers = {}
        
        for cluster_name, cluster_data in INVESTIGATION_TARGETS.items():
            for entity in cluster_data["entities"]:
                lines = [
                    "=" * 60,
                    f"SUBJECT DOSSIER: {entity.name.upper()}",
                    "=" * 60,
                    f"Category: {entity.category}",
                    f"Cluster: {cluster_name}",
                    "",
                    "ALIASES",
                    "-" * 30,
                ]
                
                for alias in entity.aliases:
                    lines.append(f"  • {alias}")
                if not entity.aliases:
                    lines.append("  (none)")
                
                lines.extend([
                    "",
                    "KNOWN CONNECTIONS",
                    "-" * 30,
                ])
                for conn in entity.known_connections:
                    lines.append(f"  • {conn}")
                if not entity.known_connections:
                    lines.append("  (none)")
                
                lines.extend([
                    "",
                    "JURISDICTIONS",
                    "-" * 30,
                ])
                for j in entity.jurisdictions:
                    lines.append(f"  • {j}")
                
                if entity.notes:
                    lines.extend([
                        "",
                        "NOTES",
                        "-" * 30,
                        f"  {entity.notes}",
                    ])
                
                # Evidence matches
                matches = self.scanner.scan_for_entity(entity)
                lines.extend([
                    "",
                    "LOCAL EVIDENCE MATCHES",
                    "-" * 30,
                ])
                if matches:
                    for match in matches[:10]:
                        lines.append(f"  [{match['match_count']}x] {match['file']}")
                else:
                    lines.append("  (no matches in local evidence)")
                
                # Search vectors for this entity
                entity_vectors = [v for v in self.generator.vectors 
                                  if v.get("target") == entity.name]
                lines.extend([
                    "",
                    f"SEARCH VECTORS: {len(entity_vectors)}",
                    "-" * 30,
                ])
                for vec in entity_vectors[:5]:
                    lines.append(f"  [{vec.get('layer')}] {vec.get('query')}")
                if len(entity_vectors) > 5:
                    lines.append(f"  ... and {len(entity_vectors) - 5} more")
                
                lines.append("")
                dossiers[entity.name] = "\n".join(lines)
        
        return dossiers


# ============================================================================
# MAIN CLI
# ============================================================================
def main():
    parser = argparse.ArgumentParser(
        description="TOROIDAL OSINT ENGINE v10X - GOS-STACK Recursive Intelligence"
    )
    parser.add_argument(
        "--mode", 
        choices=["scan", "generate", "correlate", "report", "all"],
        default="all",
        help="Operation mode"
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=OUTPUT_DIR,
        help="Output directory for results"
    )
    
    args = parser.parse_args()
    
    # Ensure output directory exists
    args.output_dir.mkdir(parents=True, exist_ok=True)
    
    print("=" * 60)
    print("🌀 TOROIDAL OSINT ENGINE v10X")
    print(f"   κ = {KAPPA:.6f} | φ = {PHI:.6f}")
    print("=" * 60)
    print()
    
    # Initialize components
    scanner = LocalEvidenceScanner(PROJECT_ROOT)
    generator = SearchVectorGenerator()
    
    if args.mode in ["scan", "all"]:
        print("📂 Indexing local evidence files...")
        count = scanner.index_files()
        print(f"   Indexed {count} files")
        
        # Save index
        index_path = args.output_dir / "evidence_index.json"
        with open(index_path, "w") as f:
            json.dump(scanner.evidence_index, f, indent=2)
        print(f"   Saved to {index_path}")
        print()
        
        # Keyword scan
        print("🔍 Scanning for investigation keywords...")
        matches = scanner.scan_for_keywords()
        match_count = sum(len(v) for v in matches.values())
        print(f"   Found {match_count} matches across {len(matches)} keywords")
        
        matches_path = args.output_dir / "keyword_matches.json"
        with open(matches_path, "w") as f:
            json.dump(matches, f, indent=2)
        print(f"   Saved to {matches_path}")
        print()
    
    if args.mode in ["generate", "all"]:
        print("🔗 Generating search vectors...")
        vectors = generator.generate_all()
        print(f"   Generated {len(vectors)} search vectors")
        
        # Save as JSON
        vectors_json = args.output_dir / "search_vectors.json"
        with open(vectors_json, "w") as f:
            json.dump(vectors, f, indent=2)
        print(f"   Saved JSON to {vectors_json}")
        
        # Save as CSV for easy import
        vectors_csv = args.output_dir / "search_vectors.csv"
        generator.export_to_csv(vectors_csv)
        print(f"   Saved CSV to {vectors_csv}")
        print()
    
    if args.mode in ["correlate", "all"]:
        print("🔄 Building correlation matrix...")
        correlator = CorrelationEngine(scanner)
        correlations = correlator.build_entity_correlation()
        
        corr_path = args.output_dir / "correlations.json"
        with open(corr_path, "w") as f:
            json.dump(correlations, f, indent=2)
        print(f"   Saved to {corr_path}")
        print()
    else:
        correlator = CorrelationEngine(scanner)
    
    if args.mode in ["report", "all"]:
        print("📋 Generating investigation report...")
        reporter = ReportGenerator(scanner, generator, correlator)
        
        # Summary report
        summary = reporter.generate_summary_report()
        summary_path = args.output_dir / "INVESTIGATION_SUMMARY.txt"
        with open(summary_path, "w", encoding="utf-8") as f:
            f.write(summary)
        print(f"   Summary saved to {summary_path}")
        
        # Entity dossiers
        dossiers = reporter.generate_entity_dossiers()
        dossiers_dir = args.output_dir / "dossiers"
        dossiers_dir.mkdir(exist_ok=True)
        
        for name, content in dossiers.items():
            safe_name = re.sub(r'[^\w\s-]', '', name).replace(' ', '_')
            dossier_path = dossiers_dir / f"{safe_name}.txt"
            with open(dossier_path, "w", encoding="utf-8") as f:
                f.write(content)
        
        print(f"   {len(dossiers)} dossiers saved to {dossiers_dir}")
        print()
        
        # Print summary to console
        print(summary)
    
    print()
    print("=" * 60)
    print("✅ TOROIDAL OSINT ENGINE COMPLETE")
    print(f"   Output directory: {args.output_dir}")
    print("=" * 60)


if __name__ == "__main__":
    main()
