#!/usr/bin/env python3
"""Extended SETECOM and local Modbus search"""
import shodan

api = shodan.Shodan("I0QODvLjcj1nbPEjuNcxSYcNBdKxskuZ")

print("=" * 70)
print("SETECOM.COM SSL CERTIFICATES")
print("=" * 70)
try:
    r = api.search('ssl.cert.subject.CN:setecom')
    print(f"Found {r['total']} results with 'setecom' in SSL cert CN")
    for m in r['matches'][:10]:
        ssl = m.get('ssl', {})
        cert = ssl.get('cert', {}) if ssl else {}
        subj = cert.get('subject', {}) if cert else {}
        cn = subj.get('CN', 'N/A')
        org = subj.get('O', 'N/A')
        print(f"  {m['ip_str']}:{m.get('port')} - CN={cn}, O={org} - {m.get('org', '')}")
except Exception as e:
    print(f"Error: {e}")

print()
print("=" * 70)
print("MODBUS DEVICES IN ALAJUELA (YOUR AREA)")
print("=" * 70)
try:
    r = api.search('port:502 city:alajuela country:CR')
    print(f"Found {r['total']} Modbus devices in Alajuela")
    for m in r['matches'][:15]:
        banner = m.get('data', '')[:100].replace('\n', ' ')
        print(f"  {m['ip_str']} - {m.get('org', 'N/A')}")
        print(f"    Banner: {banner}")
except Exception as e:
    print(f"Error: {e}")

print()
print("=" * 70)
print("FORTINET DEVICES IN COSTA RICA")
print("=" * 70)
try:
    r = api.search('product:fortigate country:CR')
    print(f"Found {r['total']} FortiGate devices in Costa Rica")
    for m in r['matches'][:10]:
        ssl = m.get('ssl', {})
        cert = ssl.get('cert', {}) if ssl else {}
        subj = cert.get('subject', {}) if cert else {}
        cn = subj.get('CN', '')
        print(f"  {m['ip_str']}:{m.get('port')} - {cn} - {m.get('org', '')}")
except Exception as e:
    print(f"Error: {e}")

print()
print("=" * 70)
print("GENERATOR CONTROLLERS / SCADA IN COSTA RICA")
print("=" * 70)
try:
    queries = [
        'http.title:"generator" country:CR',
        'http.title:"genset" country:CR',
        'http.title:"DSE" country:CR',
        '"deep sea" country:CR',
    ]
    for q in queries:
        r = api.search(q)
        if r['total'] > 0:
            print(f"\n[{q}]: {r['total']} results")
            for m in r['matches'][:3]:
                title = m.get('http', {}).get('title', '') if m.get('http') else ''
                print(f"  {m['ip_str']}:{m.get('port')} - {title} - {m.get('org', '')}")
except Exception as e:
    print(f"Error: {e}")
