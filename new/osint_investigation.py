#!/usr/bin/env python3
"""
OSINT Investigation Tool
Targets: Jorge Jimenez, Oscar Jimenez, Hector Mora Marin
Platforms: OSINT.Industries, xray.contact, Shodan
"""

import os
import json
import requests
from datetime import datetime
from pathlib import Path

# API Keys (user must provide)
OSINT_INDUSTRIES_API_KEY = os.environ.get('OSINT_INDUSTRIES_API_KEY', '')
XRAY_CONTACT_API_KEY = os.environ.get('XRAY_CONTACT_API_KEY', '')
SHODAN_API_KEY = os.environ.get('SHODAN_API_KEY', 'I0QODvLjcj1nbPEjuNcxSYcNBdKxskuZ')

# Investigation Targets
TARGETS = {
    "jorge_jimenez": {
        "name": "Jorge Jimenez",
        "email": "jorgejiminez16@gmail.com",  # Note: misspelling in original
        "role": "Property Owner - Calle Cabello Real, La Guácima",
        "notes": "Father is Oscar (ex-drug cop)",
        "country": "CR"
    },
    "oscar_jimenez": {
        "name": "Oscar Jimenez",
        "role": "Father of Jorge, Ex-Drug Cop (OIJ or similar)",
        "country": "CR",
        "notes": "Law enforcement background - potential access to surveillance tools"
    },
    "hector_mora_marin": {
        "name": "Hector Mora Marin",
        "role": "Owner - SETECOM SA",
        "company": "SETECOM SA",
        "location": "Heredia, Costa Rica",
        "country": "CR",
        "infrastructure_ip": "190.106.77.194",
        "notes": "FortiGate firewall with Modbus:502 exposed, DSE distributor"
    },
    "mauricio_campos": {
        "name": "Mauricio Campos",
        "role": "SETECOM Costa Rica Representative",
        "company": "SETECOM SA",
        "country": "CR",
        "notes": "From DSE training video - liaison with Deep Sea Electronics"
    },
    "edson_martendal": {
        "name": "Edson Martendal",
        "role": "Deep Sea Electronics Brazil Technical Support",
        "company": "Deep Sea Electronics Brazil",
        "country": "BR",
        "notes": "Provides tech support to SETECOM, from training video"
    }
}

# Output directory
OUTPUT_DIR = Path(__file__).parent / "osint_results"
OUTPUT_DIR.mkdir(exist_ok=True)


def search_osint_industries(query: str, query_type: str = "email") -> dict:
    """
    Search OSINT.Industries API
    query_type: email, phone, username, name
    API: GET https://api.osint.industries/v2/request
    """
    if not OSINT_INDUSTRIES_API_KEY:
        return {"error": "OSINT_INDUSTRIES_API_KEY not set"}
    
    url = "https://api.osint.industries/v2/request"
    headers = {
        "Authorization": f"Bearer {OSINT_INDUSTRIES_API_KEY}",
        "Content-Type": "application/json"
    }
    params = {
        "type": query_type,
        "query": query
    }
    
    try:
        response = requests.get(url, headers=headers, params=params, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"HTTP {response.status_code}", "text": response.text}
    except Exception as e:
        return {"error": str(e)}


def search_xray_contact(query: str, query_type: str = "email") -> dict:
    """
    Search xray.contact API
    """
    if not XRAY_CONTACT_API_KEY:
        return {"error": "XRAY_CONTACT_API_KEY not set"}
    
    # xray.contact API endpoint (needs verification)
    url = "https://api.xray.contact/v1/search"
    headers = {
        "X-API-Key": XRAY_CONTACT_API_KEY,
        "Content-Type": "application/json"
    }
    data = {
        "type": query_type,
        "query": query
    }
    
    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        if response.status_code == 200:
            return response.json()
        else:
            return {"error": f"HTTP {response.status_code}", "text": response.text}
    except Exception as e:
        return {"error": str(e)}


def search_shodan_person(name: str, country: str = "CR") -> dict:
    """
    Search Shodan for infrastructure associated with a person/company
    """
    if not SHODAN_API_KEY:
        return {"error": "SHODAN_API_KEY not set"}
    
    import shodan
    api = shodan.Shodan(SHODAN_API_KEY)
    
    results = {}
    queries = [
        f'org:"{name}"',
        f'ssl:"{name}"',
        f'http.title:"{name}"',
    ]
    
    for query in queries:
        if country:
            query += f' country:{country}'
        try:
            result = api.search(query)
            results[query] = {
                "total": result['total'],
                "matches": [
                    {
                        "ip": m['ip_str'],
                        "port": m['port'],
                        "org": m.get('org'),
                        "hostnames": m.get('hostnames', []),
                        "product": m.get('product'),
                        "data_preview": m.get('data', '')[:200]
                    }
                    for m in result['matches'][:10]
                ]
            }
        except Exception as e:
            results[query] = {"error": str(e)}
    
    return results


def investigate_target(target_id: str, target: dict) -> dict:
    """
    Run full investigation on a target
    """
    print(f"\n{'='*60}")
    print(f"INVESTIGATING: {target['name']}")
    print(f"Role: {target.get('role', 'Unknown')}")
    print(f"{'='*60}")
    
    results = {
        "target": target,
        "timestamp": datetime.now().isoformat(),
        "osint_industries": {},
        "xray_contact": {},
        "shodan": {}
    }
    
    # Search by email if available
    if 'email' in target:
        print(f"  [*] Searching email: {target['email']}")
        results['osint_industries']['email'] = search_osint_industries(target['email'], 'email')
        results['xray_contact']['email'] = search_xray_contact(target['email'], 'email')
    
    # Search by name
    print(f"  [*] Searching name: {target['name']}")
    results['osint_industries']['name'] = search_osint_industries(target['name'], 'name')
    results['xray_contact']['name'] = search_xray_contact(target['name'], 'name')
    
    # Search Shodan for infrastructure
    if 'company' in target:
        print(f"  [*] Searching Shodan for: {target['company']}")
        results['shodan']['company'] = search_shodan_person(target['company'], target.get('country'))
    
    print(f"  [*] Searching Shodan for: {target['name']}")
    results['shodan']['name'] = search_shodan_person(target['name'], target.get('country'))
    
    # Save individual result
    output_file = OUTPUT_DIR / f"{target_id}_investigation.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2, default=str)
    print(f"  [+] Saved to: {output_file}")
    
    return results


def run_full_investigation():
    """
    Run investigation on all targets
    """
    print("\n" + "="*70)
    print("OSINT INVESTIGATION - JIMENEZ / SETECOM NETWORK")
    print("="*70)
    print(f"Timestamp: {datetime.now().isoformat()}")
    print(f"Targets: {len(TARGETS)}")
    print(f"APIs configured:")
    print(f"  - OSINT.Industries: {'✓' if OSINT_INDUSTRIES_API_KEY else '✗ (set OSINT_INDUSTRIES_API_KEY)'}")
    print(f"  - xray.contact: {'✓' if XRAY_CONTACT_API_KEY else '✗ (set XRAY_CONTACT_API_KEY)'}")
    print(f"  - Shodan: {'✓' if SHODAN_API_KEY else '✗'}")
    
    all_results = {}
    
    for target_id, target in TARGETS.items():
        try:
            all_results[target_id] = investigate_target(target_id, target)
        except Exception as e:
            print(f"  [!] Error investigating {target_id}: {e}")
            all_results[target_id] = {"error": str(e)}
    
    # Save consolidated results
    consolidated_file = OUTPUT_DIR / "FULL_INVESTIGATION.json"
    with open(consolidated_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "targets": TARGETS,
            "results": all_results
        }, f, indent=2, default=str)
    
    print(f"\n{'='*70}")
    print(f"INVESTIGATION COMPLETE")
    print(f"Results saved to: {consolidated_file}")
    print(f"{'='*70}")
    
    return all_results


if __name__ == "__main__":
    # Check for API keys in environment
    if not OSINT_INDUSTRIES_API_KEY and not XRAY_CONTACT_API_KEY:
        print("WARNING: No OSINT API keys configured!")
        print("Set environment variables:")
        print("  $env:OSINT_INDUSTRIES_API_KEY = 'your_key'")
        print("  $env:XRAY_CONTACT_API_KEY = 'your_key'")
        print("\nRunning with Shodan only...")
    
    run_full_investigation()
