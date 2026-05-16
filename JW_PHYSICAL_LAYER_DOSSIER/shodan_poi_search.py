#!/usr/bin/env python3
"""
SHODAN POI SEARCH - Persons/Orgs of Interest
"""
import shodan

api = shodan.Shodan("I0QODvLjcj1nbPEjuNcxSYcNBdKxskuZ")

searches = [
    ("Deep Sea Electronics", 'org:"deep sea"'),
    ("DeepSea", '"deepsea"'),
    ("Hector Mora", '"hector mora"'),
    ("Mora Marin", '"mora marin"'),
    ("Mauricio Campos", '"mauricio campos"'),
    ("Edson Martenal", '"edson martenal"'),
    ("Jorge Jimenez CR", '"jorge jimenez" country:CR'),
    ("Jimenez Org CR", 'org:"jimenez" country:CR'),
    ("Oscar Jimenez", '"oscar jimenez"'),
    ("OSLU Network", 'hostname:"oslu"'),
    ("Gamma Group", 'org:"gamma"'),
    ("FinFisher", '"finfisher"'),
    ("FinSpy", '"finspy"'),
    ("Cyberforsec", '"cyberforsec"'),
    ("Surveillance CR", '"surveillance" country:CR'),
]

print("=" * 70)
print("SHODAN SEARCH: PERSONS/ORGANIZATIONS OF INTEREST")
print("=" * 70)

for name, query in searches:
    try:
        results = api.search(query)
        count = results['total']
        if count > 0:
            print(f"\n[+] {name}: {count} results")
            for r in results['matches'][:3]:
                ip = r.get('ip_str', 'N/A')
                port = r.get('port', 'N/A')
                org = r.get('org', 'N/A')
                country = r.get('location', {}).get('country_name', 'N/A')
                product = r.get('product', '')
                print(f"    {ip}:{port} - {org} ({country}) {product}")
        else:
            print(f"[-] {name}: 0 results")
    except Exception as e:
        print(f"[!] {name}: Error - {e}")

print("\n" + "=" * 70)
print("DONE")
