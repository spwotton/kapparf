"""
SUPPZ PRODUCT ANALYZER
Analyze product export for SEO opportunities
"""

import csv
from collections import Counter
from pathlib import Path

def analyze_products(csv_path: str):
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f'Total rows: {len(rows)}')

    # Get unique products by handle
    unique = {}
    for r in rows:
        h = r.get('Handle', '')
        if h and h not in unique:
            unique[h] = r

    print(f'Unique products: {len(unique)}')

    # Count missing SEO
    missing_seo_title = sum(1 for p in unique.values() if not p.get('SEO Title'))
    missing_seo_desc = sum(1 for p in unique.values() if not p.get('SEO Description'))
    print(f'\nSEO AUDIT:')
    print(f'  Missing SEO Title: {missing_seo_title} ({missing_seo_title*100//len(unique)}%)')
    print(f'  Missing SEO Description: {missing_seo_desc} ({missing_seo_desc*100//len(unique)}%)')

    # Top vendors
    vendors = Counter(r.get('Vendor', '') for r in unique.values())
    print('\nTOP 20 VENDORS:')
    for v, c in vendors.most_common(20):
        print(f'  {c:4} | {v}')

    # Hi-Tech products
    hitech = [p for p in unique.values() if 'hi tech' in p.get('Vendor', '').lower()]
    print(f'\n{"="*60}')
    print(f'HI-TECH PHARMACEUTICALS: {len(hitech)} products')
    print(f'{"="*60}')
    
    for p in sorted(hitech, key=lambda x: x.get('Title', '')):
        seo = 'SEO' if p.get('SEO Description') else '---'
        price = p.get('Variant Price', '0')
        title = p.get('Title', '')[:55]
        print(f'  [{seo}] ${price:>6} | {title}')
    
    # Other big brands
    priority_brands = ['Hi Tech Pharmaceuticals', 'Blackstone Labs', 'Alpha Lion', 'Olympus Labs', 'Nutrex', 'Muscletech']
    
    print(f'\n{"="*60}')
    print('PRIORITY BRANDS SEO STATUS')
    print(f'{"="*60}')
    
    for brand in priority_brands:
        brand_products = [p for p in unique.values() if p.get('Vendor', '').lower() == brand.lower()]
        with_seo = sum(1 for p in brand_products if p.get('SEO Description'))
        without_seo = len(brand_products) - with_seo
        pct = with_seo * 100 // len(brand_products) if brand_products else 0
        print(f'  {brand:25} | {len(brand_products):3} products | {pct:3}% have SEO | {without_seo} need work')


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        csv_path = sys.argv[1]
    else:
        csv_path = Path(__file__).parent.parent / "products_export_1 - products_export_1 (1).csv"
    analyze_products(str(csv_path))
