#!/usr/bin/env python3
import urllib.request
import re
import json

print("Fetching...")
url = 'http://rx.linkfanel.net/kiwisdr_com.js'
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
data = urllib.request.urlopen(req, timeout=15).read().decode('utf-8')

# Search for costa rica in raw text
lines = data.split('},')
for i, line in enumerate(lines):
    if 'costa rica' in line.lower() or 'radioclub' in line.lower():
        print(f"\n=== MATCH {i} ===")
        print(line[:500])
