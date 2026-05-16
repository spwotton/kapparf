# Chr20 evidence notes (PubMed + Ensembl)

This file is derived from the automated pull in:
- signal_forensics/reports/chr20_pubmed.json
- signal_forensics/reports/chr20_pubmed_summary.md

Variant-level tightening pass (separate output):
- signal_forensics/reports/chr20_pubmed_variants.json
- signal_forensics/reports/chr20_pubmed_variants_summary.md

Long-form narrative synthesis (user-provided “gemini research” writeup):
- signal_forensics/reports/chr20_neurogenetic_architecture_report_gemini.md

## High-signal anchors (quick read)

### PRNP (chr20)
- Strong, direct link to sleep pathology via **fatal familial insomnia** and other prion diseases.
  - Pedigree analysis / inheritance for FFI: https://pubmed.ncbi.nlm.nih.gov/41107634/
  - GSS psychiatric presentation including insomnia: https://pubmed.ncbi.nlm.nih.gov/41327454/

Variant-focused highlights:
- REM/NREM + sleep physiology in FFI context:
  - Thalamic contribution to sleep slow oscillation features in FFI: https://pubmed.ncbi.nlm.nih.gov/22609023/

Interpretation: PRNP-related disease is an established cause of catastrophic sleep-wake dysregulation (thalamus involvement in FFI is commonly emphasized).

### CHRNA4 (chr20)
- Strong, direct link to **Sleep-Related Hypermotor Epilepsy** (historically “ADNFLE” in older literature) and seizure/sleep coupling.
  - Nicotine as targeted therapy (case report + review): https://pubmed.ncbi.nlm.nih.gov/41192108/
  - Mechanistic review (tripartite synaptic transmission in sleep-related hypermotor epilepsy): https://pubmed.ncbi.nlm.nih.gov/41096936/
  - Family psychiatric/psychotic symptoms in ADNFLE families with different mutations: https://pubmed.ncbi.nlm.nih.gov/12782965/

Variant-focused highlights:
- Subcortical circuits / thalamus involvement in genetic rat models of AD sleep-related hypermotor epilepsy: https://pubmed.ncbi.nlm.nih.gov/40564986/

Interpretation: CHRNA4 is one of the cleanest Chr20 examples where gene → phenotype includes sleep-specific seizure syndromes.

### SLC32A1 / VGAT (chr20)
- Core marker/transporter for inhibitory (GABA/glycine) vesicular loading; many hits are broader “GABAergic” literature, but it’s repeatedly used as a handle for inhibitory neuron populations.
  - VGAT-Cre epilepsy/EEG model note: https://pubmed.ncbi.nlm.nih.gov/32954490/
  - Schizophrenia marker reductions including midbrain GABAergic markers: https://pubmed.ncbi.nlm.nih.gov/34174930/

Interpretation: SLC32A1 is a plausible “control point” for excitation/inhibition balance framing, but direct single-gene human phenotype linkage will require more targeted queries (e.g., "SLC32A1" AND (variant OR mutation) AND (epilepsy OR sleep)).

Variant-focused highlights (direct SLC32A1 human genetics signal):
- De novo missense variants causing developmental + epileptic encephalopathy (impaired inhibitory neurotransmission): https://pubmed.ncbi.nlm.nih.gov/36073542/
- Missense variants associated with genetic epilepsy with febrile seizures plus: https://pubmed.ncbi.nlm.nih.gov/34038384/

### GNAS (chr20)
- Multiple hits connect imprinting / hypothalamic regulation to sleep-state architecture.
  - Loss of Gnas imprinting affects REM/NREM sleep and cognition in mice: https://pubmed.ncbi.nlm.nih.gov/22589743/

Variant-focused highlights:
- Seizure presentations in pseudohypoparathyroidism / GNAS mutation case reports exist (worth triaging separately from sleep-specific effects):
  - https://pubmed.ncbi.nlm.nih.gov/33422028/

Interpretation: GNAS looks relevant for circadian/sleep state regulation (especially via imprinting and hypothalamic pathways), but needs careful separation of endocrine/systemic phenotypes vs CNS-specific mechanisms.

### TOP1 (chr20)
- Signal in circadian transcription regulation (Topoisomerase I rhythmic binding; Bmal1).
  - Rhythmic Topoisomerase I binding impacts Bmal1 transcription/circadian period: https://pubmed.ncbi.nlm.nih.gov/22904072/

Interpretation: TOP1 reads more like a transcription/circadian machinery contributor than a primary psychiatric gene; still interesting as a mechanistic bridge into clock gene regulation.

## Next tightening pass (recommended queries)

If you want higher specificity (human genetics, variant-level):
- "CHRNA4" AND (mutation OR variant) AND (sleep OR nocturnal OR epilepsy)
- "PRNP" AND (mutation OR variant) AND (insomnia OR thalamus)
- "SLC32A1" AND (mutation OR variant) AND (epilepsy OR seizure)
- "GNAS" AND (imprinting OR hypothalamus) AND (REM OR NREM)
- "TOP1" AND (circadian OR Bmal1)

You can run the script with a custom keyword list:
- python tools/chr20_research/chr20_pubmed_research.py --genes CHRNA4 PRNP SLC32A1 GNAS TOP1 --keywords sleep insomnia epilepsy seizure REM NREM circadian Bmal1 mutation variant --max-per-query 10

For ADA (chr20), variant-focused results now include sleep-related polymorphism/EEG papers (after excluding ADAR/ADARB confounds):
- Functional ADA polymorphism and sleep depth/EEG/sleep quality:
  - https://pubmed.ncbi.nlm.nih.gov/21734253/
  - https://pubmed.ncbi.nlm.nih.gov/22952909/
  - https://pubmed.ncbi.nlm.nih.gov/33981350/
