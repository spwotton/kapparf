#!/usr/bin/env python3
"""
MANUAL HRV INPUT MODULE
=======================
For when camera PPG isn't available - accepts input from:
- Apple Watch / Fitbit / Garmin exports
- Manual pulse counting
- Polar H10 / chest strap data
- Oura Ring exports
"""

import json
import time
import csv
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, List
import sys

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from correlator import BiometricSample, EvidenceDatabase


class ManualHRVInput:
    """Accept manual HRV input from various sources"""
    
    def __init__(self, db: EvidenceDatabase):
        self.db = db
    
    def input_manual_reading(
        self,
        heart_rate: float,
        stress_level: Optional[float] = None,  # Subjective 0-100
        notes: str = ""
    ) -> int:
        """Record a manual heart rate reading"""
        
        # Estimate stress from HR if not provided
        # Resting HR ~60-70, stressed ~80-100+
        if stress_level is None:
            if heart_rate < 60:
                stress_level = 10
            elif heart_rate < 70:
                stress_level = 25
            elif heart_rate < 80:
                stress_level = 40
            elif heart_rate < 90:
                stress_level = 60
            elif heart_rate < 100:
                stress_level = 75
            else:
                stress_level = 90
        
        sample = BiometricSample(
            timestamp=time.time(),
            source='manual_input',
            heart_rate=heart_rate,
            stress_index=stress_level,
            signal_quality=0.5  # Lower confidence for manual input
        )
        
        sample_id = self.db.store_biometric(sample)
        print(f"[MANUAL] Recorded HR={heart_rate} Stress={stress_level} (ID: {sample_id})")
        
        return sample_id
    
    def import_apple_health_csv(self, csv_path: str) -> int:
        """Import heart rate data from Apple Health export"""
        imported = 0
        
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Apple Health format
                    if 'Heart Rate' in row.get('type', ''):
                        hr = float(row['value'])
                        timestamp = datetime.fromisoformat(
                            row['startDate'].replace('Z', '+00:00')
                        ).timestamp()
                        
                        sample = BiometricSample(
                            timestamp=timestamp,
                            source='apple_health',
                            heart_rate=hr,
                            signal_quality=0.8
                        )
                        self.db.store_biometric(sample)
                        imported += 1
                except Exception as e:
                    continue
        
        print(f"[IMPORT] Imported {imported} readings from Apple Health")
        return imported
    
    def import_fitbit_json(self, json_path: str) -> int:
        """Import heart rate data from Fitbit export"""
        imported = 0
        
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Fitbit format varies - handle common cases
        if isinstance(data, list):
            for entry in data:
                try:
                    hr = entry.get('value', {}).get('bpm', entry.get('bpm'))
                    timestamp = datetime.fromisoformat(
                        entry.get('dateTime', entry.get('time'))
                    ).timestamp()
                    
                    if hr:
                        sample = BiometricSample(
                            timestamp=timestamp,
                            source='fitbit',
                            heart_rate=float(hr),
                            signal_quality=0.85
                        )
                        self.db.store_biometric(sample)
                        imported += 1
                except:
                    continue
        
        print(f"[IMPORT] Imported {imported} readings from Fitbit")
        return imported
    
    def import_polar_hrv(self, csv_path: str) -> int:
        """Import HRV data from Polar H10 export"""
        imported = 0
        
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                try:
                    # Polar exports RR intervals
                    rr_interval = float(row.get('RR', row.get('rr', 0)))
                    if rr_interval > 0:
                        hr = 60000 / rr_interval  # Convert ms to BPM
                        
                        sample = BiometricSample(
                            timestamp=time.time(),  # Would need timestamp parsing
                            source='polar_h10',
                            heart_rate=hr,
                            signal_quality=0.95  # Chest strap is accurate
                        )
                        self.db.store_biometric(sample)
                        imported += 1
                except:
                    continue
        
        print(f"[IMPORT] Imported {imported} readings from Polar")
        return imported
    
    def import_oura_json(self, json_path: str) -> int:
        """Import from Oura Ring export"""
        imported = 0
        
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Oura has daily HRV summaries
        for day in data.get('sleep', []):
            try:
                hr_avg = day.get('hr_average')
                hrv_avg = day.get('rmssd')  # Oura provides RMSSD
                timestamp = datetime.fromisoformat(day['bedtime_start']).timestamp()
                
                sample = BiometricSample(
                    timestamp=timestamp,
                    source='oura_ring',
                    heart_rate=float(hr_avg) if hr_avg else None,
                    rmssd=float(hrv_avg) if hrv_avg else None,
                    signal_quality=0.9
                )
                self.db.store_biometric(sample)
                imported += 1
            except:
                continue
        
        print(f"[IMPORT] Imported {imported} readings from Oura")
        return imported


class InteractiveHRVSession:
    """Interactive session for real-time manual HRV logging"""
    
    def __init__(self, db_path: str = "biometric_evidence.db"):
        self.db = EvidenceDatabase(db_path)
        self.manual = ManualHRVInput(self.db)
        self.session_start = time.time()
        self.readings = []
    
    def pulse_count(self, duration: int = 15):
        """
        Guide user through manual pulse counting
        """
        print("\n" + "="*50)
        print("MANUAL PULSE COUNTING")
        print("="*50)
        print(f"\n1. Find your pulse (wrist or neck)")
        print(f"2. Count beats for {duration} seconds")
        print(f"3. Enter the count when prompted")
        
        input(f"\nPress ENTER when ready to start {duration}s countdown...")
        
        print(f"\nCounting... ", end='', flush=True)
        for i in range(duration, 0, -1):
            print(f"{i}...", end='', flush=True)
            time.sleep(1)
        print("STOP!")
        
        try:
            count = int(input("\nHow many beats did you count? "))
            hr = count * (60 / duration)
            
            # Ask about subjective stress
            stress_input = input("Stress level (0-100, or press ENTER to estimate): ").strip()
            stress = float(stress_input) if stress_input else None
            
            sample_id = self.manual.input_manual_reading(hr, stress)
            self.readings.append({
                'id': sample_id,
                'hr': hr,
                'stress': stress,
                'time': time.time()
            })
            
            print(f"\n✓ Recorded: HR={hr:.0f} BPM")
            
        except ValueError:
            print("[ERROR] Invalid input")
    
    def log_event(self):
        """Log a notable event with current state"""
        print("\n" + "="*50)
        print("EVENT LOGGING")
        print("="*50)
        
        event_types = [
            "1. Sudden anxiety/stress",
            "2. Hearing unusual sounds",
            "3. Feeling of being watched",
            "4. Device acting strangely",
            "5. Physical sensation (tingling, pressure)",
            "6. Unusual fatigue",
            "7. Other"
        ]
        
        print("\nEvent types:")
        for e in event_types:
            print(f"  {e}")
        
        choice = input("\nSelect event type (1-7): ").strip()
        description = input("Brief description: ").strip()
        
        # Get current heart rate
        print("\nQuick pulse check (10 seconds)...")
        input("Press ENTER when ready...")
        print("Count beats... ", end='', flush=True)
        for i in range(10, 0, -1):
            print(f"{i}...", end='', flush=True)
            time.sleep(1)
        print("STOP!")
        
        try:
            count = int(input("Beat count: "))
            hr = count * 6
            
            sample_id = self.manual.input_manual_reading(hr, stress_level=70)  # Assume elevated if logging event
            
            print(f"\n✓ Event logged: {event_types[int(choice)-1]} - {description}")
            print(f"  HR at event: {hr:.0f} BPM")
            
        except ValueError:
            print("[ERROR] Invalid input")
    
    def interactive_loop(self):
        """Main interactive loop"""
        print("\n" + "="*60)
        print("BIOMETRIC CORRELATOR - MANUAL INPUT MODE")
        print("="*60)
        print(f"\nSession started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"Database: {self.db.db_path}")
        
        while True:
            print("\n" + "-"*40)
            print("OPTIONS:")
            print("  1. Take pulse reading")
            print("  2. Log notable event")
            print("  3. Quick reading (enter HR directly)")
            print("  4. View session summary")
            print("  5. Import from device")
            print("  q. Quit")
            
            choice = input("\nChoice: ").strip().lower()
            
            if choice == '1':
                self.pulse_count()
            elif choice == '2':
                self.log_event()
            elif choice == '3':
                try:
                    hr = float(input("Heart rate (BPM): "))
                    stress = input("Stress (0-100, ENTER to skip): ").strip()
                    stress = float(stress) if stress else None
                    self.manual.input_manual_reading(hr, stress)
                except ValueError:
                    print("[ERROR] Invalid input")
            elif choice == '4':
                self.show_summary()
            elif choice == '5':
                self.import_menu()
            elif choice == 'q':
                print("\nSession ended.")
                self.show_summary()
                break
            else:
                print("Invalid option")
    
    def show_summary(self):
        """Show session summary"""
        duration = (time.time() - self.session_start) / 60
        print(f"\n{'='*40}")
        print(f"SESSION SUMMARY")
        print(f"{'='*40}")
        print(f"Duration: {duration:.1f} minutes")
        print(f"Readings: {len(self.readings)}")
        
        if self.readings:
            hrs = [r['hr'] for r in self.readings]
            print(f"HR Range: {min(hrs):.0f} - {max(hrs):.0f} BPM")
            print(f"HR Average: {sum(hrs)/len(hrs):.0f} BPM")
    
    def import_menu(self):
        """Import data from wearable devices"""
        print("\n" + "-"*40)
        print("IMPORT FROM DEVICE:")
        print("  1. Apple Health (CSV)")
        print("  2. Fitbit (JSON)")
        print("  3. Polar H10 (CSV)")
        print("  4. Oura Ring (JSON)")
        print("  5. Cancel")
        
        choice = input("\nChoice: ").strip()
        
        if choice in ['1', '2', '3', '4']:
            path = input("File path: ").strip()
            try:
                if choice == '1':
                    self.manual.import_apple_health_csv(path)
                elif choice == '2':
                    self.manual.import_fitbit_json(path)
                elif choice == '3':
                    self.manual.import_polar_hrv(path)
                elif choice == '4':
                    self.manual.import_oura_json(path)
            except Exception as e:
                print(f"[ERROR] Import failed: {e}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Manual HRV Input')
    parser.add_argument('--db', default='biometric_evidence.db', help='Database path')
    parser.add_argument('--import-apple', metavar='PATH', help='Import Apple Health CSV')
    parser.add_argument('--import-fitbit', metavar='PATH', help='Import Fitbit JSON')
    parser.add_argument('--import-polar', metavar='PATH', help='Import Polar CSV')
    parser.add_argument('--import-oura', metavar='PATH', help='Import Oura JSON')
    parser.add_argument('--hr', type=float, help='Single HR reading')
    parser.add_argument('--stress', type=float, help='Stress level with --hr')
    
    args = parser.parse_args()
    
    db = EvidenceDatabase(args.db)
    manual = ManualHRVInput(db)
    
    if args.import_apple:
        manual.import_apple_health_csv(args.import_apple)
    elif args.import_fitbit:
        manual.import_fitbit_json(args.import_fitbit)
    elif args.import_polar:
        manual.import_polar_hrv(args.import_polar)
    elif args.import_oura:
        manual.import_oura_json(args.import_oura)
    elif args.hr:
        manual.input_manual_reading(args.hr, args.stress)
    else:
        # Interactive mode
        session = InteractiveHRVSession(args.db)
        session.interactive_loop()


if __name__ == '__main__':
    main()
