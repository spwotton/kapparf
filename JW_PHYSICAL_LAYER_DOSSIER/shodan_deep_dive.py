#!/usr/bin/env python3
"""
SHODAN DEEP DIVE - Detailed IP lookup
"""
import shodan
import json

api = shodan.Shodan("I0QODvLjcj1nbPEjuNcxSYcNBdKxskuZ")

targets = [
    ("DEEP SEA ELECTRONICS LTD", "209.214.96.70"),
    ("HECTOR MORA (Puerto Rico)", "154.64.219.37"),
]

for name, ip in targets:
    print("=" * 70)
    print(f"{name} - {ip}")
    print("=" * 70)
    try:
        host = api.host(ip)
        print(f"Organization: {host.get('org', 'N/A')}")
        print(f"ASN: {host.get('asn', 'N/A')}")
        print(f"Country: {host.get('country_name', 'N/A')}")
        print(f"City: {host.get('city', 'N/A')}")
        print(f"ISP: {host.get('isp', 'N/A')}")
        print(f"Hostnames: {host.get('hostnames', [])}")
        print(f"Domains: {host.get('domains', [])}")
        print(f"Open Ports: {host.get('ports', [])}")
        print(f"Last Update: {host.get('last_update', 'N/A')}")
        print(f"Vulns: {host.get('vulns', [])}")
        print()
        print("Services:")
        for item in host.get('data', []):
            port = item.get('port', 'N/A')
            product = item.get('product', '')
            version = item.get('version', '')
            info = item.get('info', '')
            transport = item.get('transport', 'tcp')
            banner = item.get('data', '')[:200] if item.get('data') else ''
            print(f"  [{port}/{transport}] {product} {version}")
            if info:
                print(f"    Info: {info}")
            if banner:
                print(f"    Banner: {banner[:100]}...")
        print()
    except Exception as e:
        print(f"Error: {e}")
        print()

# Also check your external IP
print("=" * 70)
print("YOUR EXTERNAL IP")
print("=" * 70)
try:
    my_ip = api.tools.myip()
    print(f"Your IP: {my_ip}")
    host = api.host(my_ip)
    print(f"Organization: {host.get('org', 'N/A')}")
    print(f"ISP: {host.get('isp', 'N/A')}")
    print(f"Open Ports: {host.get('ports', [])}")
except Exception as e:
    print(f"Could not lookup your IP: {e}")
