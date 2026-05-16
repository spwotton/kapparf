#!/usr/bin/env python3
"""
ServiceWorker Cleanup Script
=============================
Generates browser commands to unregister malicious ServiceWorkers.

CRITICAL ServiceWorkers identified:
- Kyndryl GTM (ID 71) - Jorge's employer, NEVER visited
- Airbnb.com.co Partytown (ID 15) - WRONG COUNTRY domain
- UberEats (ID 72) - Jorge said "they know when orders come through"

Usage:
    Run this script, then paste the output into browser DevTools console.
"""

import json
from pathlib import Path
from datetime import datetime

# Critical ServiceWorkers to remove
MALICIOUS_SW = [
    {
        "id": 71,
        "scope": "https://www.kyndryl.com/",
        "script": "gtm-msr.kyndryl.com",
        "threat": "CRITICAL",
        "reason": "Jorge's employer - user NEVER visited kyndryl.com"
    },
    {
        "id": 15,
        "scope": "https://www.airbnb.com.co/~partytown/",
        "script": "partytown ServiceWorker",
        "threat": "CRITICAL", 
        "reason": "Colombian domain for Costa Rica user - injection vector"
    },
    {
        "id": 72,
        "scope": "https://www.ubereats.com/",
        "script": "sw.js",
        "threat": "HIGH",
        "reason": "Jorge said 'they know when orders come through the app'"
    }
]

# ALL CrossSite GTM ServiceWorkers (32 total from analysis)
CROSSSITE_GTM_SCOPES = [
    "https://www.googletagmanager.com/",
    "https://gtm-msr.kyndryl.com/",  # CRITICAL
    # Add more as needed from serviceworker_threat_report.json
]

def generate_unregister_script():
    """Generate JavaScript to unregister malicious ServiceWorkers"""
    
    script = """
// ═══════════════════════════════════════════════════════════════════════════
// SERVICEWORKER CLEANUP - Paste in DevTools Console (F12)
// ═══════════════════════════════════════════════════════════════════════════

(async () => {
    console.log('🔥 Starting ServiceWorker cleanup...');
    
    // Get all registrations
    const registrations = await navigator.serviceWorker.getRegistrations();
    console.log(`Found ${registrations.length} ServiceWorker registrations`);
    
    // Domains to block
    const maliciousDomains = [
        'kyndryl.com',
        'airbnb.com.co',  // Wrong country
        'gtm-msr.',       // GTM injection
        'googletagmanager.com'  // All GTM
    ];
    
    let removed = 0;
    for (const reg of registrations) {
        const scope = reg.scope;
        const isMalicious = maliciousDomains.some(d => scope.includes(d));
        
        if (isMalicious) {
            console.log(`🚫 Unregistering: ${scope}`);
            await reg.unregister();
            removed++;
        }
    }
    
    console.log(`✅ Removed ${removed} malicious ServiceWorkers`);
    
    // Clear all caches used by SW
    const cacheNames = await caches.keys();
    console.log(`Found ${cacheNames.length} caches`);
    
    for (const name of cacheNames) {
        if (name.includes('gtm') || name.includes('kyndryl') || name.includes('partytown')) {
            console.log(`🗑️ Deleting cache: ${name}`);
            await caches.delete(name);
        }
    }
    
    console.log('🎯 Cleanup complete! Refresh the page.');
})();
"""
    return script


def generate_hosts_block():
    """Generate hosts file entries to block malicious domains"""
    
    hosts = """
# ═══════════════════════════════════════════════════════════════════════════
# SERVICEWORKER SURVEILLANCE BLOCK
# Add these lines to C:\\Windows\\System32\\drivers\\etc\\hosts
# Run as Administrator: notepad C:\\Windows\\System32\\drivers\\etc\\hosts
# ═══════════════════════════════════════════════════════════════════════════

# Block Kyndryl GTM (Jorge's employer - surveillance vector)
0.0.0.0 gtm-msr.kyndryl.com
0.0.0.0 www.kyndryl.com
0.0.0.0 kyndryl.com

# Block wrong-country Airbnb domain
0.0.0.0 www.airbnb.com.co
0.0.0.0 airbnb.com.co

# Block Google Tag Manager (surveillance framework)
0.0.0.0 www.googletagmanager.com
0.0.0.0 googletagmanager.com
0.0.0.0 tagmanager.google.com

# Block analytics
0.0.0.0 www.google-analytics.com
0.0.0.0 google-analytics.com
0.0.0.0 ssl.google-analytics.com
"""
    return hosts


def generate_opera_cleanup():
    """Generate Opera-specific cleanup commands"""
    
    return """
# ═══════════════════════════════════════════════════════════════════════════
# OPERA BROWSER CLEANUP
# ═══════════════════════════════════════════════════════════════════════════

1. Open opera://serviceworker-internals/
2. Click "Unregister" on these entries:
   - ID 71: kyndryl.com (CRITICAL)
   - ID 15: airbnb.com.co (CRITICAL)
   - ID 72: ubereats.com (HIGH)
   - All entries with "gtm" in the URL

3. Open opera://settings/clearBrowserData
   - Select "Cookies and other site data"
   - Select "Cached images and files"
   - Click "Clear data"

4. Open opera://extensions/
   - Disable/remove any unknown extensions
   - Check for extension ID: ebongfbmlegepmkkdjlnlmdcmckedlal

5. Open opera://settings/content/notifications
   - Remove kyndryl.com if listed
   - Remove any unknown domains
"""


def main():
    print("=" * 60)
    print("SERVICEWORKER CLEANUP SCRIPT")
    print("=" * 60)
    print()
    
    # Generate JavaScript
    js_script = generate_unregister_script()
    print("📋 STEP 1: JavaScript for DevTools Console")
    print("-" * 40)
    print(js_script)
    print()
    
    # Generate hosts entries
    hosts = generate_hosts_block()
    print("📋 STEP 2: Hosts file entries")
    print("-" * 40)
    print(hosts)
    print()
    
    # Opera instructions
    opera = generate_opera_cleanup()
    print("📋 STEP 3: Opera-specific cleanup")
    print("-" * 40)
    print(opera)
    
    # Save to file
    output = {
        "generated": datetime.now().isoformat(),
        "javascript": js_script,
        "hosts_entries": hosts,
        "opera_instructions": opera,
        "malicious_sw": MALICIOUS_SW
    }
    
    output_path = Path(__file__).parent / "serviceworker_cleanup_commands.json"
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, indent=2)
    
    print(f"\n✅ Commands saved to: {output_path}")


if __name__ == "__main__":
    main()
