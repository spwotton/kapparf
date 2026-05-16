#!/usr/bin/env python3
"""
SHODAN INVESTIGATION - DORJE STATION
=====================================
Search for surveillance infrastructure around the property.
"""

import shodan
import json
from datetime import datetime
from pathlib import Path

SHODAN_API_KEY = "I0QODvLjcj1nbPEjuNcxSYcNBdKxskuZ"

def main():
    api = shodan.Shodan(SHODAN_API_KEY)
    
    # Verify API
    info = api.info()
    print(f"[+] Shodan API Active - {info['query_credits']} query credits remaining")
    print()
    
    results_all = {}
    
    # 1. Search for V-SEK systems
    print("=" * 60)
    print("V-SEK / VIRTUAL SECURITY SYSTEMS")
    print("=" * 60)
    try:
        results = api.search('org:"v-sek" country:CR')
        print(f"Found {results['total']} results for V-SEK org")
        results_all['v-sek'] = results['matches']
        for r in results['matches'][:10]:
            print(f"  {r['ip_str']}:{r.get('port')} - {r.get('product', 'N/A')}")
    except Exception as e:
        print(f"  Search error: {e}")
    
    # 2. Cameras/CCTV in Alajuela
    print()
    print("=" * 60)
    print("CAMERAS/CCTV IN ALAJUELA, COSTA RICA")
    print("=" * 60)
    try:
        # Search for common camera brands
        queries = [
            'country:CR city:alajuela port:554',  # RTSP cameras
            'country:CR city:alajuela product:hikvision',
            'country:CR city:alajuela product:dahua', 
            'country:CR city:alajuela http.title:"camera"',
        ]
        for q in queries:
            try:
                results = api.search(q)
                if results['total'] > 0:
                    print(f"\n[{q}] - {results['total']} results")
                    results_all[q] = results['matches']
                    for r in results['matches'][:5]:
                        print(f"  {r['ip_str']}:{r.get('port')} - {r.get('org', 'N/A')} - {r.get('product', '')}")
            except:
                pass
    except Exception as e:
        print(f"  Search error: {e}")
    
    # 3. TP-Link devices in Costa Rica
    print()
    print("=" * 60)
    print("TP-LINK DEVICES IN COSTA RICA")
    print("=" * 60)
    try:
        results = api.search('country:CR product:tp-link')
        print(f"Found {results['total']} TP-Link devices")
        results_all['tp-link'] = results['matches']
        for r in results['matches'][:10]:
            print(f"  {r['ip_str']}:{r.get('port')} - {r.get('org', 'N/A')} - {r.get('hostnames', [])}")
    except Exception as e:
        print(f"  Search error: {e}")
    
    # 4. Liberty (your ISP) infrastructure
    print()
    print("=" * 60)
    print("LIBERTY (YOUR ISP) EXPOSED DEVICES")
    print("=" * 60)
    try:
        results = api.search('country:CR org:"Liberty"')
        print(f"Found {results['total']} Liberty devices")
        results_all['liberty'] = results['matches'][:20]
        for r in results['matches'][:10]:
            print(f"  {r['ip_str']}:{r.get('port')} - {r.get('product', 'N/A')}")
    except Exception as e:
        print(f"  Search error: {e}")
    
    # 5. Search for exposed cameras with default passwords
    print()
    print("=" * 60)
    print("EXPOSED/VULNERABLE CAMERAS IN COSTA RICA")
    print("=" * 60)
    try:
        vuln_queries = [
            'country:CR "Server: Boa" port:80',  # Old camera server
            'country:CR port:8080 "realm=GoAhead"',  # GoAhead cameras
            'country:CR "DVRDVS-Webs"',  # DVR systems
            'country:CR "Hikvision-Webs"',
        ]
        for q in vuln_queries:
            try:
                results = api.search(q)
                if results['total'] > 0:
                    print(f"\n[{q}] - {results['total']} results")
                    for r in results['matches'][:3]:
                        print(f"  {r['ip_str']}:{r.get('port')} - {r.get('org', 'N/A')}")
            except:
                pass
    except Exception as e:
        print(f"  Search error: {e}")
    
    # 6. Geo search around La Guácima
    print()
    print("=" * 60)
    print("GEO SEARCH: 5km RADIUS OF LA GUÁCIMA")
    print("=" * 60)
    try:
        # La Guácima coordinates: 9.9765, -84.2285
        results = api.search('geo:9.9765,-84.2285,5')
        print(f"Found {results['total']} devices within 5km")
        results_all['geo_5km'] = results['matches']
        for r in results['matches'][:15]:
            print(f"  {r['ip_str']}:{r.get('port')} - {r.get('org', 'N/A')} - {r.get('product', '')}")
    except Exception as e:
        print(f"  Search error: {e}")
    
    # 7. Search for FinSpy/Gamma Group infrastructure
    print()
    print("=" * 60)
    print("FINSPY/GAMMA GROUP INFRASTRUCTURE")
    print("=" * 60)
    try:
        queries = [
            'ssl:"Gamma" country:CR',
            'ssl:"FinFisher"',
            '"FinSpy"',
        ]
        for q in queries:
            try:
                results = api.search(q)
                if results['total'] > 0:
                    print(f"\n[{q}] - {results['total']} results")
                    for r in results['matches'][:5]:
                        print(f"  {r['ip_str']}:{r.get('port')} - {r.get('org', 'N/A')} - {r.get('location', {}).get('country_name', '')}")
            except:
                pass
    except Exception as e:
        print(f"  Search error: {e}")
    
    # Save results
    output_file = Path(__file__).parent / f"shodan_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'investigation': 'DORJE-2026-01-25',
            'results': {k: len(v) if isinstance(v, list) else v for k, v in results_all.items()}
        }, f, indent=2, default=str)
    print(f"\n[SAVED] {output_file}")

if __name__ == "__main__":
    main()
