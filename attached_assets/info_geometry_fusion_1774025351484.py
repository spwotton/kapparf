import numpy as np
import scipy.spatial.distance as distance

class InformationGeometry_Fusion_Layer:
    """
    KYMA Fusion Layer based on Information Geometry.
    
    Purpose:
    1. Treat sensing modalities (CSI, EEG) as observation channels on a statistical manifold.
    2. Use Fisher Information (approximated via variance/entropy) to weight channels.
    3. Detect Environmental Drift (e.g. furniture moving) to trigger recalibration.
    """
    
    def __init__(self, history_window=50):
        self.history_window = history_window
        # Buffers for drift detection
        self.csi_manifold_buffer = [] 
        self.eeg_manifold_buffer = []
        
        # Drift Thresholds (Kullback-Leibler Divergence proxy)
        self.DRIFT_THRESHOLD_CSI = 0.5 
        
    def estimate_fisher_weight(self, data_vector):
        """
        Estimates the 'Information Content' (Fisher Weight) of a signal vector.
        High Variance + Low Entropy usually implies signal presence in this specific domain.
        For simplicity, we use Inverse Variance of the noise floor (SNR proxy).
        """
        # 1. Estimate Signal Power (Frame Energy)
        sig_power = np.mean(data_vector**2)
        
        # 2. Estimate Noise Floor (using percentile to ignore peaks)
        # Using 25th percentile as heuristic for noise floor
        noise_floor = np.percentile(np.abs(data_vector), 25) ** 2
        
        if noise_floor == 0: noise_floor = 1e-9
        
        snr = sig_power / noise_floor
        return np.log1p(snr) # Logarithmic weight

    def detect_manifold_drift(self, new_point, manifold_buffer):
        """
        Detects if the new observation drifts significantly from the recent manifold geometry.
        Uses Mahalanobis distance or similar metric relative to buffer statistics.
        """
        if len(manifold_buffer) < self.history_window:
            manifold_buffer.append(new_point)
            return False, 0.0
            
        # Compute Manifold Centroid and Covariance
        buffer_matrix = np.array(manifold_buffer)
        centroid = np.mean(buffer_matrix, axis=0)
        
        # Simple Euclidean drift for prototype (Mahalanobis is expensive per frame)
        drift_dist = distance.euclidean(new_point, centroid)
        
        # Update Buffer (Rolling)
        manifold_buffer.pop(0)
        manifold_buffer.append(new_point)
        
        return drift_dist, centroid

    def fuse_inputs(self, csi_features, eeg_features=None):
        """
        Fuses inputs based on reality-bound confidence tiers.
        """
        # 1. CSI Weighting (Ambient Tier)
        w_csi = self.estimate_fisher_weight(csi_features)
        
        # 2. Drift Check (Information Geometry)
        drift, centroid = self.detect_manifold_drift(csi_features, self.csi_manifold_buffer)
        
        recalibration_needed = False
        if len(self.csi_manifold_buffer) >= self.history_window:
             # Normalize drift by scalar variance of buffer
             buffer_std = np.std(np.array(self.csi_manifold_buffer))
             z_score = drift / (buffer_std + 1e-9)
             
             if z_score > 3.0: # 3 Sigma Drift
                 recalibration_needed = True

        # 3. EEG Weighting (Substantiated Tier)
        w_eeg = 0.0
        if eeg_features is not None:
            w_eeg = self.estimate_fisher_weight(eeg_features)
            # Boost EEG weight as it is "Ground Truth" for cognitive state
            w_eeg *= 2.0 
            
        # 4. Weighted Fusion
        # If EEG is present, it dominates the "Intent" vector.
        # If not, we rely on CSI but with lower confidence.
        
        total_weight = w_csi + w_eeg
        if total_weight == 0: return None
        
        alpha = w_csi / total_weight
        beta = w_eeg / total_weight
        
        # For prototype, we just return the weights and status
        return {
            "weights": {"CSI": w_csi, "EEG": w_eeg},
            "ratio": {"CSI": alpha, "EEG": beta},
            "drift_detected": recalibration_needed,
            "drift_z_score": 0 if len(self.csi_manifold_buffer)<self.history_window else z_score
        }

if __name__ == "__main__":
    fusion = InformationGeometry_Fusion_Layer()
    
    # 1. Stable Environment (Baseline)
    print("--- Phase 1: Stable Environment ---")
    for i in range(60):
        # Generate stable CSI features
        csi = np.random.normal(loc=1.0, scale=0.1, size=16) 
        res = fusion.fuse_inputs(csi)
        if i % 20 == 0:
            print(f"Frame {i}: Drift Z={res['drift_z_score']:.2f}")

    # 2. Environment Shift (Furniture Moved)
    print("\n--- Phase 2: Environment Shift ---")
    csi_shifted = np.random.normal(loc=5.0, scale=0.1, size=16) # Jump in mean
    res = fusion.fuse_inputs(csi_shifted)
    print(f"Frame 61: Drift Z={res['drift_z_score']:.2f} | RECALIBRATION: {res['drift_detected']}")
