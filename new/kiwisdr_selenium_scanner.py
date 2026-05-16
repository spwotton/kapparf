#!/usr/bin/env python3
"""
SELENIUM AUTOMATED SCANNER - Captures spectrograms
Run this for automated scanning with screenshots
"""

import os
import time
import json
from datetime import datetime
from pathlib import Path

try:
    from selenium import webdriver
    from selenium.webdriver.chrome.service import Service
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from webdriver_manager.chrome import ChromeDriverManager
    from PIL import Image
    import io
except ImportError as e:
    print(f"Missing dependency: {e}")
    print("Run: pip install selenium webdriver-manager pillow")
    exit(1)

KIWISDR_BASE = "http://ti0rc.proxy.kiwisdr.com:8073"
SCREENSHOT_DIR = Path("signal_forensics/kiwisdr_screenshots")
SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)

# Priority frequencies to scan
PRIORITY_FREQS = [
    (1234, "am", "TR-069 correlation"),
    (4687, "am", "46.875Hz harmonic x100"),
    (7410, "am", "Pirate radio"),
    (6925, "am", "Pirate radio"),
    (3900, "lsb", "80m SSB"),
    (7200, "lsb", "40m SSB"),
    (14200, "usb", "20m SSB"),
    (27025, "am", "CB Channel 6"),
    (27185, "am", "CB Channel 19"),
]


def init_browser():
    """Initialize headless Chrome browser"""
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver


def capture_frequency(driver, freq_khz, mode, note=""):
    """Navigate to frequency and capture screenshot"""
    url = f"{KIWISDR_BASE}/?f={freq_khz}&mod={mode}&zoom=11&wf=2"
    
    print(f"  📻 {freq_khz} kHz ({mode.upper()}) - {note}")
    driver.get(url)
    
    # Wait for waterfall to load
    time.sleep(5)  # KiwiSDR needs time to render
    
    # Capture screenshot
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"{freq_khz}kHz_{mode}_{timestamp}.png"
    filepath = SCREENSHOT_DIR / filename
    
    driver.save_screenshot(str(filepath))
    
    # Get page info
    try:
        # Try to get signal strength from S-meter if visible
        signal_info = driver.execute_script("""
            var smeter = document.querySelector('.smeter-value');
            return smeter ? smeter.textContent : 'N/A';
        """)
    except:
        signal_info = "N/A"
    
    return {
        "frequency": freq_khz,
        "mode": mode,
        "note": note,
        "screenshot": str(filepath),
        "signal": signal_info,
        "timestamp": datetime.now().isoformat()
    }


def run_priority_scan():
    """Scan priority frequencies and capture spectrograms"""
    
    print("=" * 70)
    print("🎯 KIWISDR AUTOMATED SPECTRUM SCANNER")
    print("=" * 70)
    print(f"Target: Hector Mora Setecom 180W HF Radio")
    print(f"SDR: {KIWISDR_BASE}")
    print(f"Screenshots: {SCREENSHOT_DIR}")
    print()
    
    driver = None
    results = []
    
    try:
        print("🚀 Initializing Chrome browser...")
        driver = init_browser()
        print("✅ Browser ready")
        print()
        
        print(f"📡 Scanning {len(PRIORITY_FREQS)} priority frequencies...")
        print("-" * 70)
        
        for freq, mode, note in PRIORITY_FREQS:
            try:
                result = capture_frequency(driver, freq, mode, note)
                results.append(result)
            except Exception as e:
                print(f"  ❌ Error at {freq} kHz: {e}")
                results.append({
                    "frequency": freq,
                    "mode": mode,
                    "error": str(e)
                })
        
        print("-" * 70)
        print()
        
        # Save results
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = SCREENSHOT_DIR / f"SCAN_RESULTS_{timestamp}.json"
        with open(report_path, 'w') as f:
            json.dump({
                "timestamp": datetime.now().isoformat(),
                "target": "Hector Mora 180W HF",
                "frequencies_scanned": len(results),
                "results": results
            }, f, indent=2)
        
        print(f"✅ Captured {len(results)} spectrograms")
        print(f"📁 Saved to: {SCREENSHOT_DIR}")
        print(f"📋 Report: {report_path}")
        
    except Exception as e:
        print(f"❌ Scanner error: {e}")
        import traceback
        traceback.print_exc()
    
    finally:
        if driver:
            driver.quit()
            print("🔒 Browser closed")
    
    return results


if __name__ == "__main__":
    run_priority_scan()
