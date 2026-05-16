#!/usr/bin/env python3
"""
GEMATRIA / CIPHER DECODER FOR V2K ANALYSIS
==========================================
Implements multiple cipher systems used by JW and other organizations:
- Hebrew Gematria (Standard)
- English Gematria (Ordinal, Reduction, Latin)
- Greek Isopsephy
- Base-53 GOS Encoding
- JW Numerology (1914, 144000, 7 times, etc.)

Use to decode patterns in V2K audio harassment.
"""

import re
from typing import Dict, List, Tuple
from datetime import datetime
import json

# Hebrew letter values (standard gematria)
HEBREW_GEMATRIA = {
    'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9,
    'י': 10, 'כ': 20, 'ל': 30, 'מ': 40, 'נ': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'צ': 90,
    'ק': 100, 'ר': 200, 'ש': 300, 'ת': 400,
    'ך': 500, 'ם': 600, 'ן': 700, 'ף': 800, 'ץ': 900  # Final forms
}

# English ordinal (A=1, B=2, ... Z=26)
ENGLISH_ORDINAL = {chr(i): i - 64 for i in range(65, 91)}

# English reduction (reduce to single digit)
ENGLISH_REDUCTION = {chr(i): ((i - 65) % 9) + 1 for i in range(65, 91)}

# Latin/Jewish-English (A=1, B=2... I=9, J=600, K=10...)
ENGLISH_LATIN = {
    'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6, 'G': 7, 'H': 8, 'I': 9,
    'J': 600, 'K': 10, 'L': 20, 'M': 30, 'N': 40, 'O': 50, 'P': 60, 'Q': 70, 'R': 80,
    'S': 90, 'T': 100, 'U': 200, 'V': 700, 'W': 900, 'X': 300, 'Y': 400, 'Z': 500
}

# English Full (A=6, B=12, C=18... multiples of 6)
ENGLISH_FULL = {chr(i): (i - 64) * 6 for i in range(65, 91)}

# Base-53 GOS encoding characters
BASE53_CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZαβγδεζηθικλμνξπρστφχψω"

# JW significant numbers
JW_NUMBERS = {
    7: "Divine perfection/completeness",
    12: "Organizational perfection (tribes, apostles)",
    40: "Period of trial/testing",
    70: "Divinely determined period",
    144: "Emphasis on 12 (12x12)",
    666: "Human imperfection (beast)",
    1000: "Millennium",
    1914: "Christ's invisible return/Kingdom established",
    1918: "Christ came to temple",
    1919: "Faithful slave appointed",
    1925: "Expected resurrection (failed)",
    1975: "Expected end (failed)",
    2914: "Theorized end of 1000-year reign",
    144000: "Anointed class (little flock)",
    6000: "Human history before millennium"
}

# GOS Constants
KAPPA = 4 / 3.14159265358979  # ≈ 1.2732
PHI = 1.618033988749895  # Golden ratio
OMEGA = 0.567143290409784  # Omega constant


def english_ordinal_value(text: str) -> int:
    """Calculate English ordinal gematria (A=1, B=2, ... Z=26)"""
    text = text.upper()
    return sum(ENGLISH_ORDINAL.get(c, 0) for c in text)


def english_reduction_value(text: str) -> int:
    """Calculate reduced gematria (each letter reduced to 1-9)"""
    text = text.upper()
    return sum(ENGLISH_REDUCTION.get(c, 0) for c in text)


def english_full_value(text: str) -> int:
    """Calculate full English gematria (multiples of 6)"""
    text = text.upper()
    return sum(ENGLISH_FULL.get(c, 0) for c in text)


def english_latin_value(text: str) -> int:
    """Calculate Jewish-English/Latin gematria"""
    text = text.upper()
    return sum(ENGLISH_LATIN.get(c, 0) for c in text)


def hebrew_gematria_value(text: str) -> int:
    """Calculate Hebrew standard gematria"""
    return sum(HEBREW_GEMATRIA.get(c, 0) for c in text)


def reduce_to_single(n: int) -> int:
    """Reduce a number to a single digit (digital root)"""
    while n > 9:
        n = sum(int(d) for d in str(n))
    return n


def base53_encode(value: int) -> str:
    """Encode integer to Base-53 GOS format"""
    if value == 0:
        return BASE53_CHARS[0]
    result = []
    while value:
        result.append(BASE53_CHARS[value % 53])
        value //= 53
    return ''.join(reversed(result))


def base53_decode(text: str) -> int:
    """Decode Base-53 GOS format to integer"""
    result = 0
    for char in text:
        if char in BASE53_CHARS:
            result = result * 53 + BASE53_CHARS.index(char)
    return result


def find_jw_significance(value: int) -> List[str]:
    """Check if a number has JW numerological significance"""
    matches = []
    
    # Direct match
    if value in JW_NUMBERS:
        matches.append(f"{value}: {JW_NUMBERS[value]}")
    
    # Digital root
    root = reduce_to_single(value)
    if root == 7:
        matches.append(f"Digital root = 7 (divine perfection)")
    
    # Factors
    for jw_num in [7, 12, 40, 70, 144]:
        if value % jw_num == 0:
            matches.append(f"Divisible by {jw_num} ({JW_NUMBERS[jw_num]})")
    
    # 1914 relationship
    if 1914 - 100 <= value <= 1914 + 100:
        matches.append(f"Near 1914 (offset: {value - 1914})")
    
    return matches


def analyze_phrase(phrase: str) -> Dict:
    """Full gematria analysis of a phrase"""
    results = {
        "input": phrase,
        "timestamp": datetime.now().isoformat(),
        "gematria": {
            "english_ordinal": english_ordinal_value(phrase),
            "english_reduction": english_reduction_value(phrase),
            "english_full": english_full_value(phrase),
            "english_latin": english_latin_value(phrase),
        },
        "digital_root": reduce_to_single(english_ordinal_value(phrase)),
        "base53": base53_encode(english_ordinal_value(phrase)),
        "jw_significance": [],
        "gos_resonance": {}
    }
    
    # Check JW significance for all values
    for method, value in results["gematria"].items():
        significance = find_jw_significance(value)
        if significance:
            results["jw_significance"].extend([f"{method}({value}): {s}" for s in significance])
    
    # GOS resonance check
    ordinal = results["gematria"]["english_ordinal"]
    results["gos_resonance"] = {
        "kappa_ratio": round(ordinal / KAPPA, 6),
        "phi_ratio": round(ordinal / PHI, 6),
        "omega_ratio": round(ordinal / OMEGA, 6),
        "mod_432": ordinal % 432,
        "mod_37": ordinal % 37,
        "mod_111": ordinal % 111,
    }
    
    return results


def decode_number_sequence(numbers: List[int]) -> Dict:
    """Decode a sequence of numbers (e.g., from morse, tones)"""
    results = {
        "input": numbers,
        "sum": sum(numbers),
        "as_letters": "",
        "jw_significance": [],
        "patterns": []
    }
    
    # Convert to letters (1=A, 2=B, etc.)
    for n in numbers:
        if 1 <= n <= 26:
            results["as_letters"] += chr(64 + n)
        elif n == 0:
            results["as_letters"] += " "
        else:
            results["as_letters"] += f"[{n}]"
    
    # Check significance
    results["jw_significance"] = find_jw_significance(results["sum"])
    
    # Look for patterns
    if len(numbers) >= 3:
        # Fibonacci check
        for i in range(len(numbers) - 2):
            if numbers[i] + numbers[i+1] == numbers[i+2]:
                results["patterns"].append(f"Fibonacci at position {i}")
        
        # Repeating patterns
        for pattern_len in range(1, len(numbers) // 2 + 1):
            pattern = numbers[:pattern_len]
            if all(numbers[i] == pattern[i % pattern_len] for i in range(len(numbers))):
                results["patterns"].append(f"Repeating pattern: {pattern}")
                break
    
    return results


def find_matching_words(target_value: int, method: str = "ordinal", wordlist: List[str] = None) -> List[str]:
    """Find words that match a specific gematria value"""
    if wordlist is None:
        # Common words list (expand as needed)
        wordlist = [
            "GOD", "LOVE", "HATE", "FEAR", "WATCH", "TOWER", "KINGDOM", "HALL",
            "WITNESS", "JEHOVAH", "SATAN", "DEVIL", "ANGEL", "DEMON", "SPIRIT",
            "TRUTH", "LIE", "MATH", "NUMBER", "CODE", "SIGNAL", "VOICE", "HEAR",
            "SEE", "WATCH", "FOLLOW", "TARGET", "TRACK", "HUNT", "KILL", "DEATH",
            "LIFE", "SOUL", "MIND", "CONTROL", "OBEY", "SUBMIT", "REBEL", "RESIST"
        ]
    
    calc_func = {
        "ordinal": english_ordinal_value,
        "reduction": english_reduction_value,
        "full": english_full_value,
        "latin": english_latin_value
    }.get(method, english_ordinal_value)
    
    return [word for word in wordlist if calc_func(word) == target_value]


def main():
    print("=" * 60)
    print("GEMATRIA DECODER FOR V2K ANALYSIS")
    print("=" * 60)
    print()
    
    # Test with key phrases
    test_phrases = [
        "JEHOVAH",
        "WATCHTOWER",
        "KINGDOM HALL", 
        "JEFF PORTER",
        "SUSAN PORTER",
        "JORGE JIMENEZ",
        "OSCAR JIMENEZ",
        "SETECOM",
        "V-SEK",
        "MATHEMATICS",
        "HECTOR MORA",
    ]
    
    all_results = []
    
    for phrase in test_phrases:
        print(f"\n{'='*40}")
        print(f"ANALYZING: {phrase}")
        print('='*40)
        
        result = analyze_phrase(phrase)
        all_results.append(result)
        
        print(f"English Ordinal:  {result['gematria']['english_ordinal']}")
        print(f"English Full:     {result['gematria']['english_full']}")
        print(f"English Latin:    {result['gematria']['english_latin']}")
        print(f"Digital Root:     {result['digital_root']}")
        print(f"Base-53 GOS:      {result['base53']}")
        
        if result['jw_significance']:
            print(f"\nJW Significance:")
            for sig in result['jw_significance']:
                print(f"  - {sig}")
        
        print(f"\nGOS Resonance:")
        print(f"  kappa ratio: {result['gos_resonance']['kappa_ratio']}")
        print(f"  phi ratio: {result['gos_resonance']['phi_ratio']}")
        print(f"  mod 432: {result['gos_resonance']['mod_432']}")
        print(f"  mod 37:  {result['gos_resonance']['mod_37']}")
    
    # Save results
    output_file = "signal_forensics/gematria_analysis.json"
    with open(output_file, 'w') as f:
        json.dump(all_results, f, indent=2)
    print(f"\n\nResults saved to {output_file}")
    
    # Interactive mode
    print("\n" + "=" * 60)
    print("INTERACTIVE MODE - Enter phrases to analyze (Ctrl+C to exit)")
    print("=" * 60)
    
    try:
        while True:
            phrase = input("\nEnter phrase: ").strip()
            if phrase:
                result = analyze_phrase(phrase)
                print(f"\nOrdinal: {result['gematria']['english_ordinal']}")
                print(f"Full:    {result['gematria']['english_full']}")
                print(f"Root:    {result['digital_root']}")
                if result['jw_significance']:
                    for sig in result['jw_significance']:
                        print(f"  JW: {sig}")
    except KeyboardInterrupt:
        print("\n\nExiting...")


if __name__ == "__main__":
    main()
