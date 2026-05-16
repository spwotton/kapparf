#!/usr/bin/env python3
"""Find Costa Rica KiwiSDR receivers"""
import urllib.request
import re
import json
import sys

print("Fetching KiwiSDR directory...", flush=True)
sys.stdout.flush()

url = 'http://rx.linkfanel.net/kiwisdr_com.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
data = urllib.request.urlopen(req, timeout=15).read().decode('utf-8')
print(f"Got {len(data)} bytes", flush=True)

match = re.search(r'var kiwisdr_com = (\[.*?\]);', data, re.DOTALL)
if match:
    receivers = json.loads(match.group(1))
    print(f"Total receivers in directory: {len(receivers)}", flush=True)
    print("\n" + "="*70, flush=True)
    print("SEARCHING: costa rica, radioclub, ti2, san jose, central america", flush=True)
    print("="*70 + "\n", flush=True)
    
    found = []
    for r in receivers:
        name = r.get('n', '').lower()
        loc = r.get('qra', '').lower()
        grid = r.get('gr', '').lower()
        
        # Search terms
        if any(term in name or term in loc for term in ['costa rica', 'radioclub', 'ti2', 'san jose', 'panama', 'nicaragua', 'venezuela', 'caracas', 'colombia', 'bogota']):
            found.append(r)
    
    print(f"Found {len(found)} matches!", flush=True)
    
    for r in found:
        print(f"NAME: {r.get('n')}", flush=True)
        print(f"URL:  {r.get('url')}", flush=True)
        print(f"GPS:  {r.get('gps')}", flush=True)
        print(f"GRID: {r.get('gr')}", flush=True)
        print(f"LOC:  {r.get('qra')}", flush=True)
        print(f"STATUS: {'ONLINE' if r.get('s') == 1 else 'OFFLINE'}", flush=True)
        print(f"USERS: {r.get('u')}/{r.get('um')}", flush=True)
        print("-"*70, flush=True)
    
    if not found:
        print("No Central American receivers found in directory!")
        print("\nSearching by grid square (EJ = Costa Rica region)...")
        for r in receivers:
            grid = r.get('gr', '')
            if grid.startswith('EJ') or grid.startswith('FJ'):
                print(f"{r.get('n')} | {r.get('url')} | {grid}")
