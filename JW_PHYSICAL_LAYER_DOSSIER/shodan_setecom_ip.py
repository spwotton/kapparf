#!/usr/bin/env python3
"""Deep dive on SETECOM Costa Rica IP"""
import shodan
import json

api = shodan.Shodan("I0QODvLjcj1nbPEjuNcxSYcNBdKxskuZ")

target_ip = "190.106.77.194"

print("=" * 70)
print(f"SETECOM COSTA RICA IP: {target_ip}")
print("=" * 70)

try:
    host = api.host(target_ip)
    print(f"Organization: {host.get('org', 'N/A')}")
    print(f"ISP: {host.get('isp', 'N/A')}")
    print(f"ASN: {host.get('asn', 'N/A')}")
    print(f"Country: {host.get('country_name', 'N/A')}")
    print(f"City: {host.get('city', 'N/A')}")
    print(f"Hostnames: {host.get('hostnames', [])}")
    print(f"Domains: {host.get('domains', [])}")
    print(f"Open Ports: {host.get('ports', [])}")
    print(f"Vulns: {host.get('vulns', [])}")
    print(f"Last Update: {host.get('last_update', 'N/A')}")
    
    print("\n" + "-" * 50)
    print("SERVICES DETAIL:")
    print("-" * 50)
    
    for item in host.get('data', []):
        port = item.get('port', 'N/A')
        transport = item.get('transport', 'tcp')
        product = item.get('product', '')
        version = item.get('version', '')
        info = item.get('info', '')
        
        print(f"\n[{port}/{transport}] {product} {version}")
        if info:
            print(f"  Info: {info}")
        
        # SSL Certificate info
        ssl = item.get('ssl')
        if ssl:
            cert = ssl.get('cert', {})
            if cert:
                subject = cert.get('subject', {})
                issuer = cert.get('issuer', {})
                expires = cert.get('expires', '')
                
                if subject:
                    print(f"  SSL Subject CN: {subject.get('CN', 'N/A')}")
                    print(f"  SSL Subject O: {subject.get('O', 'N/A')}")
                if issuer:
                    print(f"  SSL Issuer CN: {issuer.get('CN', 'N/A')}")
                if expires:
                    print(f"  SSL Expires: {expires}")
        
        # Banner (first 200 chars)
        banner = item.get('data', '')
        if banner:
            clean_banner = banner[:200].replace('\n', ' ').replace('\r', '')
            print(f"  Banner: {clean_banner}...")
    
    # Save full data
    with open(f"shodan_host_{target_ip.replace('.','_')}.json", 'w') as f:
        json.dump(host, f, indent=2, default=str)
    print(f"\n[SAVED] shodan_host_{target_ip.replace('.','_')}.json")
    
except Exception as e:
    print(f"Error: {e}")
