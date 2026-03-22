import time
import numpy as np

class BioGAP_Ultra_Stream:
    """
    BioGAP-Ultra Interface (Mock).
    Simulates the GAP9 SoC ingestion of multimodal biosignals.
    Channels: 16-ch EEG, 12-ch EMG, ECG, PPG, Accelerometry.
    Rate: 46.875 Hz (GOS Frame Lock).
    """
    
    def __init__(self):
        self.sampling_rate = 46.875
        self.channels = {
            'EEG': 16,
            'EMG': 12,
            'ECG': 1,
            'PPG': 1,
            'ACC': 3
        }
        self.is_streaming = False
        
    def connect(self):
        print("[1;34m⚡ BioGAP-Ultra: Connecting to GAP9 SoC...[0m")
        time.sleep(0.5)
        print("   [LINK] BLE 2M PHY Established (1.362 Mbps)")
        print(f"   [SYNC] Clock Locked to 8.392 Hz GNSS Subharmonic")
        self.is_streaming = True
        return True
        
    def read_frame(self):
        """
        Returns a dictionary of sensor data for one frame.
        """
        if not self.is_streaming: return None
        
        # Generate synthetic biological data
        frame = {}
        for sensor, count in self.channels.items():
            # Generate random noise + carrier wave
            # EEG has alpha/beta waves (8-12Hz, 12-30Hz)
            # PPG has ~1Hz heartbeat
            
            data = np.random.normal(0, 1, count)
            if sensor == 'PPG':
                # Add pulse wave
                t = time.time()
                pulse = np.sin(2 * np.pi * 1.0 * t) # 60 BPM
                data += pulse
            
            frame[sensor] = data
            
        return frame

    def stream_diagnostics(self, duration=1):
        print("\n[1;35m📊 BIOGAP DIAGNOSTICS STREAM[0m")
        idx = 0
        end_time = time.time() + duration
        while time.time() < end_time:
            frame = self.read_frame()
            eeg_power = np.mean(frame['EEG']**2)
            ppg_val = frame['PPG'][0]
            
            status = "❤️" if ppg_val > 0.5 else "🖤"
            print(f"   Frame {idx:04d} | EEG Power: {eeg_power:.2f} uV | PPG: {status} ({ppg_val:.2f})")
            
            idx += 1
            time.sleep(1/self.sampling_rate)

if __name__ == "__main__":
    bg = BioGAP_Ultra_Stream()
    bg.connect()
    bg.stream_diagnostics()
