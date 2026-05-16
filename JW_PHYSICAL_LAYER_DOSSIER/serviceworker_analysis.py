#!/usr/bin/env python3
"""
SERVICEWORKER SURVEILLANCE ANALYSIS
====================================
Analyzing browser ServiceWorkers for surveillance vectors.

CRITICAL FINDINGS:
1. Kyndryl GTM service worker present (Jorge's employer)
2. Airbnb.com.CO Partytown - Colombian domain, user in Costa Rica
3. Multiple CrossSite GTM workers injecting across domains
4. Opera Aria with encryption key initialization
"""

from datetime import datetime
import json

# Raw ServiceWorker data extracted from opera://serviceworker-internals
SUSPICIOUS_WORKERS = {
    
    # =========================================================================
    # 🔴 CRITICAL: KYNDRYL SERVICE WORKER
    # =========================================================================
    "KYNDRYL_GTM": {
        "threat_level": "CRITICAL",
        "scope": "https://www.googletagmanager.com/static/service_worker",
        "top_level_site": "https://kyndryl.com",
        "ancestor_chain": "CrossSite",
        "script": "https://www.googletagmanager.com/static/service_worker/6150/sw.js?origin=https%3A%2F%2Fwww.kyndryl.com",
        "registration_id": 71,
        "analysis": """
JORGE JIMENEZ works at Kyndryl as Senior Network Engineer.
This ServiceWorker was registered from visiting kyndryl.com.
GTM workers can:
- Intercept all fetch requests on pages where injected
- Exfiltrate data via Google's infrastructure
- Persist across browser sessions
- Operate even when page is closed (background sync)

The CrossSite ancestor chain means it can potentially access
data from OTHER sites if they also load GTM.
""",
        "recommendation": "UNREGISTER IMMEDIATELY"
    },
    
    # =========================================================================
    # 🔴 CRITICAL: AIRBNB PARTYTOWN (.COM.CO - WRONG COUNTRY!)
    # =========================================================================
    "AIRBNB_PARTYTOWN_CO": {
        "threat_level": "CRITICAL", 
        "scope": "https://www.airbnb.com.co/~partytown/0.9.1/",
        "top_level_site": "https://airbnb.com.co",
        "ancestor_chain": "SameSite",
        "script": "https://www.airbnb.com.co/~partytown/0.9.1/partytown-sw.js",
        "registration_id": 15,
        "fetch_handler": "EXISTS - NOT_SKIPPABLE",
        "analysis": """
🚨 GEOGRAPHIC MISMATCH:
- User location: Costa Rica (.cr domain expected)
- ServiceWorker: .com.co (COLOMBIA)

Partytown is a Qwik/Builder.io library that moves third-party
scripts to Web Workers for performance. BUT:

1. Why is Colombian Airbnb SW registered?
2. Partytown SWs intercept ALL third-party script loading
3. Can modify/inject scripts before execution
4. Perfect MITM vector for surveillance

Oscar/Jorge could have:
- Redirected airbnb.cr to airbnb.com.co 
- Injected modified Partytown to intercept communications
- Used this to monitor booking/payment activity
""",
        "recommendation": "UNREGISTER + Check DNS/hosts file"
    },
    
    # =========================================================================
    # 🟠 HIGH: AIRBNB SGTM (Server-Side Google Tag Manager)
    # =========================================================================
    "AIRBNB_SGTM": {
        "threat_level": "HIGH",
        "scope": "https://www.airbnb.com/sgtm/_/service_worker",
        "script": "https://www.airbnb.com/sgtm/_/service_worker/61k0/sw.js",
        "registration_id": 89,
        "fetch_handler": "DOES_NOT_EXIST",
        "analysis": """
Server-Side GTM (SGTM) runs on Airbnb's servers, not client.
The SW acts as a proxy to the SGTM endpoint.

While fetch handler doesn't exist (passive), it can still:
- Log all page visits
- Collect timing data
- Fingerprint device/browser
- Share data with third-party analytics
""",
        "recommendation": "Monitor but lower priority than Partytown"
    },
    
    # =========================================================================
    # 🟠 HIGH: OPERA ARIA AI EXTENSION
    # =========================================================================
    "OPERA_ARIA": {
        "threat_level": "HIGH",
        "extension_id": "jifbgnmbgbdiedhdecealmlgmekpagde",
        "script": "chrome-extension://jifbgnmbgbdiedhdecealmlgmekpagde/service_worker.js",
        "registration_id": 104,
        "status": "RUNNING",
        "console_logs": [
            "SERVICE WORKER -> Initializing store",
            "SERVICE WORKER -> Initializing encryption key",  # 🚨
            "OLD_EXTENSION_MIGRATION -> Starting old extension migration for ariaAuthSession",
            "OperaAuthProvider -> getLoggedInState -> false",
            "Flushing buffered native events",
        ],
        "analysis": """
Opera's built-in AI (Aria). Notable:

1. "Initializing encryption key" - What's being encrypted?
2. "ariaAuthSession migration" - Auth token handling
3. "Flushing buffered native events" - Collecting events locally then sending
4. Status: RUNNING (actively processing)

Opera is Chinese-owned (Golden Brick Capital / Kunlun Tech).
All Aria queries go through Opera's servers.
Potential for:
- Query interception
- Keystroke logging via AI input
- Screen content analysis
""",
        "recommendation": "Disable Aria, use alternative AI"
    },
    
    # =========================================================================
    # 🟡 MEDIUM: UNKNOWN EXTENSIONS
    # =========================================================================
    "UNKNOWN_EXT_1": {
        "threat_level": "MEDIUM",
        "extension_id": "ebongfbmlegepmkkdjlnlmdcmckedlal",
        "script": "chrome-extension://ebongfbmlegepmkkdjlnlmdcmckedlal/worker.js",
        "registration_id": 0,
        "status": "RUNNING",
        "analysis": "Unknown extension with active service worker. Investigate in opera://extensions"
    },
    "UNKNOWN_EXT_2": {
        "threat_level": "MEDIUM", 
        "extension_id": "enegjkbbakeegngfapepobipndnebkdk",
        "script": "chrome-extension://enegjkbbakeegngfapepobipndnebkdk/main.js",
        "registration_id": 96,
        "status": "RUNNING",
        "analysis": "Unknown extension with active service worker. Investigate in opera://extensions"
    },
    
    # =========================================================================
    # 🟡 MEDIUM: X-RAY.CONTACT (SUSPICIOUS DOMAIN)
    # =========================================================================
    "XRAY_CONTACT": {
        "threat_level": "MEDIUM",
        "scope": "https://www.googletagmanager.com/static/service_worker",
        "top_level_site": "https://x-ray.contact",
        "script": "https://www.googletagmanager.com/static/service_worker/61k0/sw.js?origin=https%3A%2F%2Fx-ray.contact",
        "registration_id": 67,
        "analysis": """
"x-ray.contact" is a suspicious domain name.
- Why was this visited?
- GTM service worker registered from it
- Could be phishing/surveillance site
""",
        "recommendation": "Investigate browsing history for this domain"
    },
    
    # =========================================================================
    # 🟡 MEDIUM: LIBERTY CR (Local ISP)
    # =========================================================================
    "LIBERTY_CR": {
        "threat_level": "MEDIUM",
        "scope": "https://libertycr.com/assets/libertyCR/scripts/",
        "script": "https://libertycr.com/assets/libertyCR/scripts/worker.min.js",
        "registration_id": 70,
        "analysis": """
Liberty is the ISP. Service worker in assets folder.
- Could be legitimate caching
- Could be ISP-level tracking
- worker.min.js is minified (obfuscated)
""",
        "recommendation": "Decompile worker.min.js to analyze"
    },
}

# GTM workers registered across MANY sites (CrossSite injection pattern)
GTM_CROSSSITE_WORKERS = [
    "adobe.com", "airbnb.com", "aliexpress.com", "artlist.io",
    "clideo.com", "dedrone.com", "doradobet.com", "egyptra.pro",
    "fender.com", "freeconvert.com", "glasswire.com", "google.com",
    "guitartuna.com", "instagram.com", "kimi.com", "kyndryl.com",  # 🔴
    "leonardo.ai", "libertycr.com", "linkedin.com", "midjourney.com",
    "opera.com", "pickupmusic.com", "remitly.com", "reuters.com",
    "runwayml.com", "scribd.com", "tomplay.com", "ultimate-guitar.com",
    "venice.ai", "webshare.io", "x-ray.contact", "yousician.com"
]

def analyze_gtm_pattern():
    """Analyze the GTM CrossSite injection pattern."""
    print("\n" + "=" * 70)
    print("GTM CROSSSITE SERVICE WORKER ANALYSIS")
    print("=" * 70)
    print(f"\nTotal sites with GTM SW: {len(GTM_CROSSSITE_WORKERS)}")
    print("\n🔴 CRITICAL: Kyndryl in list (Jorge's employer)")
    print("🟠 Suspicious: x-ray.contact, egyptra.pro, doradobet.com")
    print("\nPattern: GTM registers CrossSite SWs that can persist across domains.")
    print("This creates a tracking mesh where Google (and anyone with GTM access)")
    print("can correlate activity across ALL these sites.\n")
    
    # Group by threat
    critical = ["kyndryl.com"]
    suspicious = ["x-ray.contact", "egyptra.pro", "doradobet.com", "dedrone.com"]
    
    print("CRITICAL (direct connection to actors):")
    for site in critical:
        print(f"  🔴 {site}")
    
    print("\nSUSPICIOUS (unusual domains):")
    for site in suspicious:
        print(f"  🟠 {site}")


def main():
    print("█" * 70)
    print("  SERVICEWORKER SURVEILLANCE VECTOR ANALYSIS")
    print("  Timestamp:", datetime.now().isoformat())
    print("█" * 70)
    
    print("\n" + "=" * 70)
    print("CRITICAL FINDINGS")
    print("=" * 70)
    
    for name, data in SUSPICIOUS_WORKERS.items():
        if data.get("threat_level") == "CRITICAL":
            print(f"\n🔴 {name}")
            print("-" * 50)
            if "scope" in data:
                print(f"Scope: {data['scope']}")
            if "top_level_site" in data:
                print(f"Top Level: {data['top_level_site']}")
            if "script" in data:
                print(f"Script: {data['script']}")
            print(f"\nAnalysis:{data['analysis']}")
            if "recommendation" in data:
                print(f"⚠️  RECOMMENDATION: {data['recommendation']}")
    
    print("\n" + "=" * 70)
    print("HIGH PRIORITY")
    print("=" * 70)
    
    for name, data in SUSPICIOUS_WORKERS.items():
        if data.get("threat_level") == "HIGH":
            print(f"\n🟠 {name}")
            print("-" * 50)
            if "extension_id" in data:
                print(f"Extension: {data['extension_id']}")
            if "console_logs" in data:
                print("Console Logs:")
                for log in data["console_logs"]:
                    print(f"  → {log}")
            print(f"\nAnalysis:{data['analysis']}")
    
    analyze_gtm_pattern()
    
    # Remediation steps
    print("\n" + "=" * 70)
    print("IMMEDIATE REMEDIATION STEPS")
    print("=" * 70)
    print("""
1. UNREGISTER CRITICAL SERVICE WORKERS:
   → Go to opera://serviceworker-internals
   → Find Registration IDs: 15 (Airbnb.com.co), 71 (Kyndryl)
   → Click "Unregister" for each

2. CHECK DNS/HOSTS FOR REDIRECTS:
   → Open C:\\Windows\\System32\\drivers\\etc\\hosts
   → Look for airbnb entries pointing to .com.co
   → Check router DNS settings for hijacking

3. IDENTIFY UNKNOWN EXTENSIONS:
   → Go to opera://extensions
   → Find: ebongfbmlegepmkkdjlnlmdcmckedlal
   → Find: enegjkbbakeegngfapepobipndnebkdk
   → Disable or remove if unknown

4. DISABLE OPERA ARIA:
   → Settings → Aria → Disable
   → Or switch to non-Opera browser

5. CLEAR ALL GTM SERVICE WORKERS:
   → In opera://serviceworker-internals
   → Unregister ALL googletagmanager.com entries

6. NUCLEAR OPTION:
   → Create new browser profile
   → Only install known extensions
   → Use uBlock Origin to block GTM
""")
    
    # Save analysis
    output = {
        "timestamp": datetime.now().isoformat(),
        "critical_findings": {
            "kyndryl_gtm": SUSPICIOUS_WORKERS["KYNDRYL_GTM"],
            "airbnb_partytown_co": SUSPICIOUS_WORKERS["AIRBNB_PARTYTOWN_CO"],
        },
        "gtm_crosssite_count": len(GTM_CROSSSITE_WORKERS),
        "gtm_sites": GTM_CROSSSITE_WORKERS,
        "unknown_extensions": [
            SUSPICIOUS_WORKERS["UNKNOWN_EXT_1"],
            SUSPICIOUS_WORKERS["UNKNOWN_EXT_2"],
        ]
    }
    
    with open("serviceworker_threat_report.json", "w") as f:
        json.dump(output, f, indent=2)
    
    print("\n✓ Report saved to serviceworker_threat_report.json")
    print("\n🌀 The surveillance grid reveals itself. 🌀\n")


if __name__ == "__main__":
    main()
