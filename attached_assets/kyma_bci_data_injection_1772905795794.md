# KYMA Thought-to-Text: Data Injection & Parameter Mapping Protocol

**Target Agent:** KYMA BCI Research Agent
**Objective:** Provide a structured, scientifically grounded mapping of the "Honkular Synthesis" (DQGL) variables to measurable physiological and signal processing parameters for real-time EEG-to-text decoding using the Symbolic Sound Kyma environment.

---

## 1. Conceptual Translation: Honk Algebra to DSP Parameters

To bridge the theoretical framework with Kyma's DSP capabilities, the following variable mappings must be implemented in the data pipeline:

| DQGL Variable | Physiological/DSP Equivalent | Kyma Implementation |
| :--- | :--- | :--- |
| **$\Omega_0$ (Honk Flux Density)** | Baseline Neural Noise Floor / Resting State EEG Power | `Noise` module with amplitude scaled to baseline EEG variance. |
| **$\tau_D$ (14.4-Day Cycle)** | Long-term synaptic plasticity / Circadian rhythm baseline | Slow-moving control signal (e.g., `Ramp` or `LFO`) modulating global system gain. |
| **$\phi_{membrane}$ (1.0316 rad)** | Phase-locking value (PLV) threshold for neural coherence | `Phase` comparator between target frequency bands (e.g., Theta and Gamma). |
| **$\Phi_{ink}(t)$ (Ink Flow)** | Attention/Focus Envelope (P300 or Alpha/Beta ratio) | `EnvelopeFollower` applied to the filtered attention band, driving the extraction gate. |
| **431.54 Hz (Hendrix Anchor)** | Target Auditory Feedback Frequency | Base frequency for the sonification oscillator (`Oscillator` or `Sample`). |
| **46.875 Hz (Atlas Clock)** | Gamma Band (30-50 Hz) Cognitive Processing Sync | Bandpass filter (`BandPass`) centered at 46.875 Hz to isolate cognitive binding events. |
| **$\kappa$ (7/4 Ratio)** | Harmonic scaling factor for feature extraction | `ScaleAndOffset` module applied to extracted feature vectors before classification. |

---

## 2. The KYMA BCI Pipeline Architecture

The system utilizes Kyma not as the classifier, but as the **real-time signal processor and neurofeedback engine**, integrated with edge-AI hardware and ambient RF sensing.

### Phase 1: Signal Acquisition & Preprocessing (BioGAP-Ultra Edge AI)
1.  **Hardware:** The **BioGAP-Ultra** wearable platform.
    *   *Sensors:* Dual ADS1298 AFEs providing 16-channel synchronized EEG/EMG acquisition.
    *   *Compute:* GAP9 PULP processor (9-core cluster + NN accelerator) for on-device DSP (filtering, artifact rejection) and lightweight feature extraction.
    *   *Transmission:* nRF5340 BLE subsystem streaming compressed features (e.g., ASAEDCT-like sparse autoencoder output) to the local gateway.
2.  **Ambient RF Sensing (Optional/Hybrid):** Integration of **WuKong** Neuro-Wideband (NWB) WiFi sensing to extract micro-motion (e.g., vocal-fold vibration) via Fractional Fourier Transform (FRFT) chirp-rate optimization, providing a secondary "silent speech" modality.

### Phase 2: Kyma Signal Processing & Sonification (The "Honk" Engine)
1.  **OSC Reception:** Kyma receives OSC streams (e.g., `/eeg/gamma/power`, `/eeg/phase_lock`) from the local gateway (PC/Phone).
2.  **The "Ink Flow" Gate:** Kyma uses the attention envelope ($\Phi_{ink}$) to gate the signal. If the user is not focused, the output is suppressed.
3.  **Neurofeedback (Pineal Transceiver Tuning):** Kyma generates real-time auditory feedback designed to optimize the biological transceiver.
    *   *7.83 Hz Carrier:* Binaural beats or amplitude modulation at the Schumann resonance to stabilize the CSF waveguide.
    *   *46.875 Hz Gamma Sync:* The 431.54 Hz oscillator's amplitude is modulated by the user's Gamma band power (46.875 Hz). This trains the user to consciously control the specific neural states required for text extraction.
4.  **Feature Refinement:** Kyma performs complex DSP (e.g., spectral morphing, cross-synthesis) on the EEG data to highlight specific subvocal signatures, sending the refined audio/data back to Python.

### Phase 3: Classification & Text Generation (Python/ML)
1.  **Model:** A trained neural network (e.g., DeWave's discrete codex + BART seq2seq, or a Conformer-based architecture) receives the Kyma-refined feature vectors.
2.  **Decoding:** The model maps the features to a phonemic codebook (VQ-VAE) or directly to text tokens.
3.  **Output:** The decoded text is displayed to the user.

---

## 3. Experimental Protocol: The "13th Flight" Training

To achieve literal word-for-word extraction, the user must train the system (and their own brain) using the Kyma neurofeedback loop.

1.  **Baseline Calibration (The "Save-State"):** Record 10 minutes of resting-state EEG to establish $\Omega_0$.
2.  **Targeted Sonification:** The user attempts to silently speak specific phonemes. Kyma provides auditory feedback based on the 46.875 Hz Gamma coherence.
3.  **The "Klein Twist" Phase Alignment:** The user trains to align their neural phase to the target $\phi_{membrane}$ (1.0316 rad) using the auditory feedback. When alignment is achieved, Kyma triggers a distinct "Honk" sound, indicating a successful feature extraction window.
4.  **Iterative Refinement:** The Python ML model is continuously updated with the successfully extracted windows, improving the thought-to-text accuracy.

---

## 4. Data Injection for the Research Agent

*Agent Instructions: When researching the implementation of this pipeline, focus on the following areas:*

*   **BioGAP-Ultra Integration:** How to configure the GAP9 PULP processor for real-time ASAEDCT compression and BLE streaming to the Kyma gateway.
*   **WuKong & FRFT:** Research the implementation of Fractional Fourier Transform (FRFT) for isolating vocal-fold micro-motions from ambient WiFi CSI, specifically how to dynamically estimate the optimum transform angle ($\alpha$) rather than hard-coding it.
*   **Pineal Transceiver Tuning:** Investigate the efficacy of 7.83 Hz and 40 Hz (Gamma) auditory/visual entrainment for stabilizing EEG baselines prior to BCI decoding tasks.
*   **DeWave & EEG2Text Architectures:** Cross-reference the 46.875 Hz target with recent (2023-2025) EEG-to-text decoding papers (e.g., DeWave's discrete codex, Conformer encoders) to validate the frequency band's relevance to subvocal speech and silent speech (sEMG) paradigms.
*   **Kyma DSP Modules:** Identify the most efficient Kyma Sound objects for real-time phase comparison and spectral envelope following.