#!/usr/bin/env python3
"""
SETECOM / DEEP SEA ELECTRONICS INVESTIGATION
=============================================
Search for infrastructure related to:
- SETECOM SA (Heredia, CR) - owned by Hector Mora Marin
- Deep Sea Electronics products in Costa Rica
- DSC Webnet gateways
"""
import shodan
import json
from datetime import datetime

api = shodan.Shodan("I0QODvLjcj1nbPEjuNcxSYcNBdKxskuZ")

results = {}

print("=" * 70)
print("SETECOM SA INVESTIGATION")
print("=" * 70)

# SETECOM searches
setecom_queries = [
    ("SETECOM org CR", 'org:"setecom" country:CR'),
    ("SETECOM hostname", 'hostname:setecom'),
    ("SETECOM SSL cert", 'ssl:"setecom"'),
    ("SETECOM title", 'http.title:"setecom"'),
]

for name, query in setecom_queries:
    try:
        r = api.search(query)
        count = r['total']
        print(f"\n[{name}]: {count} results")
        if count > 0:
            results[name] = []
            for m in r['matches'][:5]:
                info = {
                    'ip': m.get('ip_str'),
                    'port': m.get('port'),
                    'org': m.get('org'),
                    'hostnames': m.get('hostnames', []),
                    'product': m.get('product', ''),
                }
                results[name].append(info)
                print(f"  {info['ip']}:{info['port']} - {info['org']} - {info['hostnames']}")
    except Exception as e:
        print(f"[{name}]: Error - {e}")

print("\n" + "=" * 70)
print("DEEP SEA ELECTRONICS / GENERATOR CONTROLLERS")
print("=" * 70)

# Deep Sea / Generator searches
dse_queries = [
    ("DSE product CR", 'product:"deep sea" country:CR'),
    ("Generator controller CR", '"generator" country:CR port:502'),
    ("Modbus port 502 CR", 'port:502 country:CR'),
    ("SCADA CR", 'product:scada country:CR'),
    ("DSE Webnet", 'http.title:"webnet"'),
    ("DSE 890/891 gateway", '"890" "deep sea"'),
]

for name, query in dse_queries:
    try:
        r = api.search(query)
        count = r['total']
        print(f"\n[{name}]: {count} results")
        if count > 0:
            results[name] = []
            for m in r['matches'][:5]:
                info = {
                    'ip': m.get('ip_str'),
                    'port': m.get('port'),
                    'org': m.get('org'),
                    'country': m.get('location', {}).get('country_name', ''),
                    'product': m.get('product', ''),
                }
                results[name].append(info)
                print(f"  {info['ip']}:{info['port']} - {info['org']} ({info['country']}) - {info['product']}")
    except Exception as e:
        print(f"[{name}]: Error - {e}")

print("\n" + "=" * 70)
print("HECTOR MORA MARIN / MORA CONNECTIONS")
print("=" * 70)

mora_queries = [
    ("Mora hostname", 'hostname:mora'),
    ("Mora org", 'org:"mora"'),
    ("Heredia CR", 'city:heredia country:CR'),
]

for name, query in mora_queries:
    try:
        r = api.search(query)
        count = r['total']
        print(f"\n[{name}]: {count} results")
        if count > 0 and count < 100:
            for m in r['matches'][:5]:
                print(f"  {m.get('ip_str')}:{m.get('port')} - {m.get('org')} - {m.get('hostnames', [])}")
        elif count >= 100:
            print(f"  (Too many results to display)")
    except Exception as e:
        print(f"[{name}]: Error - {e}")

# Save results
output = {
    'timestamp': datetime.now().isoformat(),
    'investigation': 'SETECOM-DSE-2026-01-25',
    'target': {
        'company': 'SETECOM SA',
        'owner': 'Hector Mora Marin',
        'location': 'Heredia, Costa Rica',
        'distance_km': 8.5,
        'business': 'Deep Sea Electronics distributor',
        'connection': 'Edson Martendal (DSE Brazil) runs training with Mauricio/Jose Pablo from SETECOM'
    },
    'results': results
}

output_file = f"shodan_setecom_dse_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
with open(output_file, 'w') as f:
    json.dump(output, f, indent=2, default=str)

print(f"\n[SAVED] {output_file}")
