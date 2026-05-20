# GAIA'S LEGACY — COMPANION AUDIO PROTOCOL

## Concept: "Epigenetics You Can Hear"

Each Gaia's Legacy product is paired with a binaural audio session targeting the **same biological pathways** as the supplement ingredients. The audio doesn't replace the supplement — it provides a complementary acoustic stimulus mapped to the same gene loci.

---

## Product → Audio Mapping

### HELIOS: Epigenetic Physique Modulator

**Audio:** `PROTOCOL_HELIOS.wav` | **Duration:** 33 min (full) / 60 sec (preview)

| Ingredient | Dosage | Gene Target | Mode | Frequency | Why |
|-----------|--------|-------------|------|-----------|-----|
| Epicatechin | 200mg | MSTN (chr2) | SILENCE | 40.36 Hz | Both inhibit myostatin — epicatechin via follistatin, audio via κ-destructive interference |
| Phosphatidic Acid | 250mg | COL1A1 (chr17) | HEAL | 65.59 Hz | mTOR activation → structural protein synthesis |
| Ecklonia Cava | 150mg | BDNF (chr11) | HEAL | 89.80 Hz | Phlorotannins cross BBB → neurotrophic support |
| Ursolic Acid | 150mg | TERT (chr5) | HEAL | 14.61 Hz | Anti-atrophy + IGF-1 → cellular regeneration |
| Turkesterone | 500mg | CYP3A4 (chr7) | HEAL | 63.13 Hz | Akt pathway → metabolic processing |

**Usage:** Take 2 HELIOS capsules. Put on headphones. Play PROTOCOL_HELIOS.wav.

---

### Marine Phytoplankton + Ecklonia Cava

**Audio:** `PROTOCOL_MARINE.wav` | **Duration:** 33 min (full) / 60 sec (preview)

| Ingredient | Dosage | Gene Target | Mode | Frequency | Why |
|-----------|--------|-------------|------|-----------|-----|
| Marine Phytoplankton | 1500mg | TERT (chr5) | HEAL | 14.61 Hz | Raw cellular nutrition → telomere/longevity pathway |
| Ecklonia Cava | 300mg | IL6 (chr7) | SILENCE | 110.64 Hz | Anti-inflammatory cytokine suppression |
| Ecklonia Cava | 300mg | TNF (chr6) | SILENCE | 106.83 Hz | Tumor necrosis factor dampening |
| Trace minerals | — | MTHFR (chr1) | HEAL | 50.07 Hz | Methylation cycle support |
| Chlorophyll/detox | — | ALDH2 (chr12) | HEAL | 74.02 Hz | Metabolic detoxification pathway |

**Usage:** Mix 1 scoop in water. Put on headphones. Play PROTOCOL_MARINE.wav.

---

### LUNA: Women's Hormone Optimization

**Audio:** `PROTOCOL_LUNA.wav` | **Duration:** 33 min (full) / 60 sec (preview)

| Ingredient | Dosage | Gene Target | Mode | Frequency | Why |
|-----------|--------|-------------|------|-----------|-----|
| DIM | 200mg | COMT (chr22) | SILENCE | 119.73 Hz | Both target estrogen catechol methylation pathway |
| Vitex (Chasteberry) | 400mg | ESR1 (chr6) | HEAL | 109.34 Hz | Estrogen receptor modulation + pituitary prolactin |
| KSM-66 Ashwagandha | 300mg | BDNF (chr11) | HEAL | 89.80 Hz | Cortisol reduction → neurotrophin balance |
| Maca + Shatavari | 400mg | AMH (chr19) | HEAL | 160.10 Hz | Reproductive hormone rhythm support |
| GABA | 150mg | CLOCK (chr4) | HEAL | 84.90 Hz | Circadian/cycle synchronization |

**Usage:** Take 1 LUNA capsule. Put on headphones. Play PROTOCOL_LUNA.wav. Best during evening wind-down.

---

## Delivery Strategy

### QR Code on Packaging

Each product box/label gets a QR code → `gaiaslegacy.com/audio/[product]`

### Post-Purchase Email

```
Subject: Your HELIOS Companion Audio Is Ready 🎧

You just unlocked something no other supplement brand offers.

HELIOS targets 4 epigenetic pathways (myostatin, mTOR, BDNF, telomere).
Your companion audio session targets the same pathways — acoustically.

→ Play PROTOCOL_HELIOS (33 min) with headphones
→ Best taken alongside your daily HELIOS dose

[PLAY NOW] → gaiaslegacy.com/audio/helios
```

### Suppz Product Listing Addition

Add to each Gaia's Legacy product description on suppz.com:

```
🎧 COMPANION AUDIO INCLUDED
Every Gaia's Legacy product comes with a free binaural audio protocol
targeting the same epigenetic pathways as the supplement ingredients.
Scan the QR code on your box or visit gaiaslegacy.com/audio
```

### Content Marketing (Week 9 Blog Post)

"Binaural Audio + Supplements: The Companion Protocol Concept"

- Explain binaural beats (documented psychoacoustic phenomenon)
- Explain gene-frequency mapping (the GOS math)
- Show ingredient → gene → frequency table
- Embedded audio player preview

---

## Generation Commands

```powershell
# Generate all three companion protocols (short preview)
python runagen_launcher.py --protocol "helios" --short
python runagen_launcher.py --protocol "marine cellular" --short
python runagen_launcher.py --protocol "luna" --short

# Generate full 33-minute sessions
python runagen_launcher.py --protocol "helios"
python runagen_launcher.py --protocol "marine cellular"
python runagen_launcher.py --protocol "luna"

# Alias shortcuts work too
python runagen_launcher.py --protocol "epicatechin"      # → helios
python runagen_launcher.py --protocol "phytoplankton"    # → marine cellular
python runagen_launcher.py --protocol "vitex"            # → luna
python runagen_launcher.py --protocol "hormone"          # → luna
```

---

## The Competitive Moat

Nobody else has this. Every supplement brand on Suppz sells powder in a tub. Gaia's Legacy sells:

1. **The chemistry** (supplement ingredients targeting epigenetic pathways)
2. **The acoustics** (companion audio targeting the same gene loci)
3. **The framework** (internally consistent math linking ingredients to frequencies)

The word "epigenetic" is already on the HELIOS label. The companion audio makes it tangible. Instead of "trust us, it's epigenetic," it's "here — listen to the frequency mapped to the exact gene your epicatechin is inhibiting."

---

## Technical Notes

- Audio generated by RunaGen v1.0 (`runagen_launcher.py`)
- Frequencies: chromosomal position × category harmonic × GOS constants (φ, κ)
- Stereo: binaural beat encoding (L/R offset by category-specific delta)
- Fade envelope: 3s in, 5s out (prevents auditory startle)
- Normalization: -3 dB headroom, 16-bit 44.1kHz WAV
- All files in `AUBREY_THERAPEUTICS/` directory
