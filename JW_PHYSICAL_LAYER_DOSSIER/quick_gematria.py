#!/usr/bin/env python3
"""Quick gematria check on remaining names"""
import sys
sys.path.insert(0, 'signal_forensics')
from gematria_decoder import analyze_phrase

names = [
    'OSCAR JIMENEZ', 
    'SETECOM', 
    'VSEK', 
    'MATHEMATICS', 
    'HECTOR MORA', 
    'DEEP SEA ELECTRONICS', 
    'MAURICIO CAMPOS', 
    'EDSON MARTENDAL',
    'ROCKLAND',
    'WALPOLE',
    'JACO',
    'LA GUACIMA',
    'ALAJUELA',
    'HEREDIA',
    'COSTA RICA'
]

for name in names:
    r = analyze_phrase(name)
    print(f"{name}: Ord={r['gematria']['english_ordinal']} Full={r['gematria']['english_full']} Latin={r['gematria']['english_latin']} Root={r['digital_root']}")
    if r['jw_significance']:
        for s in r['jw_significance'][:3]:
            print(f"  JW: {s}")
