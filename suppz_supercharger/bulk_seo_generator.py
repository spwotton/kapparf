"""
BULK SEO GENERATOR - ALL PRIORITY BRANDS
Generates SEO for all 287+ priority products at once

Output: seo_bulk_update.csv ready for Shopify import
"""

import csv
from pathlib import Path
from datetime import datetime

# Product-specific SEO templates (high-converting)
PRODUCT_SEO = {
    # Hi-Tech Prohormones
    "anavar": {
        "title": "Hi-Tech Anavar | #1 Legal Prohormone | Suppz.com",
        "desc": "Buy Hi-Tech Anavar - the leading legal prohormone for lean muscle & strength. Powerful 6-compound formula. Fast shipping. Shop Suppz.com!"
    },
    "dianabol": {
        "title": "Hi-Tech Dianabol | Powerful Muscle Builder | Suppz.com",
        "desc": "Hi-Tech Dianabol for massive muscle gains. Legal methandrostenolone alternative. Build size & strength fast. Free shipping at Suppz.com!"
    },
    "winstrol": {
        "title": "Hi-Tech Winstrol | Lean Muscle & Definition | Suppz.com",
        "desc": "Hi-Tech Winstrol for cutting & hardening. Legal stanozolol alternative. Get shredded while keeping muscle. Shop Suppz.com!"
    },
    "superdrol": {
        "title": "Hi-Tech Superdrol | Extreme Strength | Suppz.com",
        "desc": "Hi-Tech Superdrol for insane strength gains. Legal prohormone for advanced athletes. Dry, hard gains. Buy at Suppz.com!"
    },
    "decabolin": {
        "title": "Hi-Tech Decabolin | Muscle & Joint Support | Suppz.com",
        "desc": "Hi-Tech Decabolin - legal nandrolone prohormone. Build muscle with joint support benefits. Quality gains. Shop Suppz.com!"
    },
    "halodrol": {
        "title": "Hi-Tech Halodrol | Dry Lean Gains | Suppz.com",
        "desc": "Hi-Tech Halodrol for lean, dry muscle gains. No water retention. Legal prohormone for cutting cycles. Buy at Suppz.com!"
    },
    "1-testosterone": {
        "title": "Hi-Tech 1-Testosterone | Lean Mass Builder | Suppz.com",
        "desc": "Hi-Tech 1-Testosterone for lean muscle without bloat. Powerful 1-DHEA formula. Quality gains only. Shop Suppz.com!"
    },
    "androdiol": {
        "title": "Hi-Tech Androdiol | Natural Test Booster | Suppz.com",
        "desc": "Hi-Tech Androdiol for natural testosterone support. 4-DHEA prohormone for muscle & strength. Buy at Suppz.com!"
    },
    "sustanon": {
        "title": "Hi-Tech Sustanon 250 | Testosterone Support | Suppz.com",
        "desc": "Hi-Tech Sustanon 250 with 4 prohormone blend. Sustained testosterone support formula. Build muscle fast. Shop Suppz.com!"
    },
    "equibolin": {
        "title": "Hi-Tech Equibolin | Vascularity & Lean Mass | Suppz.com",
        "desc": "Hi-Tech Equibolin for lean mass & vascularity. Legal 1,4-AD prohormone. Quality gains. Free shipping at Suppz.com!"
    },
    "halotestin": {
        "title": "Hi-Tech Halotestin | Extreme Strength Formula | Suppz.com",
        "desc": "Hi-Tech Halotestin for hardcore strength athletes. Potent legal formula. Intense workouts guaranteed. Shop Suppz.com!"
    },
    # Hi-Tech Fat Burners
    "lipodrene": {
        "title": "Hi-Tech Lipodrene | #1 Ephedra Fat Burner | Suppz.com",
        "desc": "Buy Lipodrene - America's #1 selling fat burner with ephedra. Extreme energy & thermogenesis. Fast results. Shop Suppz.com!"
    },
    "lipodrene xtreme": {
        "title": "Lipodrene Xtreme | Maximum Strength Fat Burner | Suppz.com",
        "desc": "Lipodrene Xtreme for extreme fat burning. Stronger than original. Powerful thermogenic formula. Buy at Suppz.com!"
    },
    "lipodrene elite": {
        "title": "Lipodrene Elite | Premium Fat Burner | Suppz.com",
        "desc": "Lipodrene Elite - Hi-Tech's premium fat burner. DMHA formula for maximum energy & fat loss. Shop Suppz.com!"
    },
    "stimerex": {
        "title": "Hi-Tech Stimerex-ES | Classic Ephedra Fat Burner | Suppz.com",
        "desc": "Stimerex-ES with 25mg ephedra extract. Classic thermogenic formula. Burn fat & boost energy. Free shipping at Suppz.com!"
    },
    "fastin": {
        "title": "Hi-Tech Fastin | Rapid Weight Loss | Suppz.com",
        "desc": "Hi-Tech Fastin for rapid weight loss. Powerful appetite suppressant & energy booster. Get lean fast. Shop Suppz.com!"
    },
    "hydroxyelite": {
        "title": "Hi-Tech HydroxyElite | Elite Fat Burner | Suppz.com",
        "desc": "HydroxyElite for serious fat burning. DMAA-free formula with powerful thermogenics. Extreme energy. Buy at Suppz.com!"
    },
    "black widow": {
        "title": "Hi-Tech Black Widow | Extreme Energy Fat Burner | Suppz.com",
        "desc": "Black Widow with ephedra extract for extreme energy & fat burning. Spider venom-inspired formula. Shop Suppz.com!"
    },
    "yellow scorpion": {
        "title": "Hi-Tech Yellow Scorpion | Intense Fat Burner | Suppz.com",
        "desc": "Yellow Scorpion for intense fat burning. Ephedra + powerful stimulants. Extreme energy & focus. Buy at Suppz.com!"
    },
    # Hi-Tech Other
    "somatomax": {
        "title": "Hi-Tech Somatomax | Sleep & GH Support | Suppz.com",
        "desc": "Somatomax for deep sleep & growth hormone support. Wake up refreshed & recovered. Best nighttime formula. Shop Suppz.com!"
    },
    "estrogenex": {
        "title": "Hi-Tech Estrogenex | Estrogen Blocker | Suppz.com",
        "desc": "Estrogenex 2nd Generation for estrogen control. Powerful aromatase inhibitor. Essential for PCT. Buy at Suppz.com!"
    },
    "arimistane": {
        "title": "Hi-Tech Arimistane | Anti-Estrogen | Suppz.com",
        "desc": "Arimistane for estrogen control & testosterone support. Legal AI for PCT. Reduce bloat & sides. Shop Suppz.com!"
    },
    "liver-rx": {
        "title": "Hi-Tech Liver-RX | Liver Support | Suppz.com",
        "desc": "Liver-RX for complete liver protection. Essential for prohormone cycles. NAC + Milk Thistle formula. Buy at Suppz.com!"
    },
    # Blackstone Labs
    "dust x": {
        "title": "Blackstone Labs Dust X | Extreme Pre-Workout | Suppz.com",
        "desc": "Dust X for insane energy & focus. DMAA-powered pre-workout. Maximum pump & performance. Shop Suppz.com!"
    },
    "abnormal": {
        "title": "Blackstone Labs Abnormal | Muscle Builder | Suppz.com",
        "desc": "Abnormal by Blackstone Labs for serious mass gains. 19-Nor-DHEA prohormone. Build freaky muscle. Buy at Suppz.com!"
    },
    "brutal 4ce": {
        "title": "Blackstone Labs Brutal 4ce | Mass Prohormone | Suppz.com",
        "desc": "Brutal 4ce for extreme muscle mass. Potent 4-DHEA prohormone. Serious gains only. Shop Suppz.com!"
    },
    "chosen 1": {
        "title": "Blackstone Labs Chosen 1 | Lean Mass Builder | Suppz.com",
        "desc": "Chosen 1 for lean, dry muscle gains. 1-DHEA prohormone. No bloat, just quality mass. Buy at Suppz.com!"
    },
    "metha quad extreme": {
        "title": "Blackstone Labs Metha-Quad Extreme | 4-In-1 | Suppz.com",
        "desc": "Metha-Quad Extreme - 4 prohormones in 1. Ultimate muscle building stack. Extreme gains. Shop Suppz.com!"
    },
    # Alpha Lion
    "superhuman supreme": {
        "title": "Alpha Lion Superhuman Supreme | Hardcore Pre | Suppz.com",
        "desc": "Superhuman Supreme pre-workout for insane energy. Clinically dosed. Maximum pump & focus. Buy at Suppz.com!"
    },
    "superhuman burn": {
        "title": "Alpha Lion Superhuman Burn | Fat Burner Pre | Suppz.com",
        "desc": "Superhuman Burn for shredding while you train. 2-in-1 fat burner + pre-workout. Get lean. Shop Suppz.com!"
    },
    "komodo pump": {
        "title": "Alpha Lion Komodo Pump | Stim-Free Pump | Suppz.com",
        "desc": "Komodo Pump for maximum vascularity without stims. Huge pumps, zero crash. Stack it up. Buy at Suppz.com!"
    },
    # General patterns
    "pre workout": {
        "suffix": "Pre-Workout",
        "desc_template": "premium pre-workout for explosive energy & pump. Boost your workouts to the next level"
    },
    "protein": {
        "suffix": "Protein",
        "desc_template": "high-quality protein for muscle recovery & growth. Build lean muscle faster"
    },
    "bcaa": {
        "suffix": "BCAAs",
        "desc_template": "branched chain amino acids for recovery & endurance. Train harder, recover faster"
    },
    "creatine": {
        "suffix": "Creatine",
        "desc_template": "for strength & muscle gains. Clinically proven formula for serious athletes"
    },
    "fat burner": {
        "suffix": "Fat Burner",
        "desc_template": "for accelerated fat loss. Boost metabolism & energy. Get shredded fast"
    },
    "test booster": {
        "suffix": "Test Booster",
        "desc_template": "for natural testosterone support. Boost strength, libido & recovery naturally"
    }
}

# Priority brands to process
PRIORITY_BRANDS = [
    "hi tech pharmaceuticals",
    "blackstone labs",
    "alpha lion",
    "olympus labs",
    "nutrex",
    "muscletech",
    "ryse",
    "axe & sledge",
    "raw nutrition",
    "gorilla mind"
]


def generate_seo(title: str, vendor: str) -> tuple:
    """Generate optimized SEO title and description"""
    title_lower = title.lower()
    vendor_lower = vendor.lower()
    
    # Check for specific product matches
    for key, data in PRODUCT_SEO.items():
        if key in title_lower and isinstance(data.get('title'), str):
            return data['title'], data['desc']
    
    # Check for category matches
    for key, data in PRODUCT_SEO.items():
        if key in title_lower and 'desc_template' in data:
            seo_title = f"{title} | {data['suffix']} | Suppz.com"
            if len(seo_title) > 60:
                seo_title = f"{title[:45]}... | Suppz.com"
            seo_desc = f"Buy {title} at Suppz.com - {data['desc_template']}. Fast shipping!"
            if len(seo_desc) > 155:
                seo_desc = seo_desc[:152] + "..."
            return seo_title, seo_desc
    
    # Brand-specific fallback
    brand_type = ""
    if "hi tech" in vendor_lower:
        brand_type = "powerful supplements from Hi-Tech Pharmaceuticals"
    elif "blackstone" in vendor_lower:
        brand_type = "hardcore supplements from Blackstone Labs"
    elif "alpha lion" in vendor_lower:
        brand_type = "premium Alpha Lion supplements"
    elif "nutrex" in vendor_lower:
        brand_type = "Nutrex Research supplements"
    elif "muscletech" in vendor_lower:
        brand_type = "MuscleTech sports nutrition"
    else:
        brand_type = "premium supplements"
    
    # Generate
    seo_title = f"{title} | Buy Online | Suppz.com"
    if len(seo_title) > 60:
        seo_title = f"{title[:45]}... | Suppz.com"
    
    seo_desc = f"Buy {title} at Suppz.com. Shop {brand_type}. Best prices, fast shipping. Get yours today!"
    if len(seo_desc) > 155:
        seo_desc = seo_desc[:152] + "..."
    
    return seo_title, seo_desc


def main():
    # Find CSV
    csv_path = Path(__file__).parent.parent / "products_export_1 - products_export_1 (1).csv"
    if not csv_path.exists():
        print(f"❌ CSV not found: {csv_path}")
        return
    
    print("""
╔═══════════════════════════════════════════════════════════════╗
║          BULK SEO GENERATOR - ALL PRIORITY BRANDS             ║
║          Generating SEO for 287+ Products                     ║
╚═══════════════════════════════════════════════════════════════╝
    """)
    
    # Load products
    products = {}
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            handle = row.get('Handle', '')
            if handle and handle not in products:
                products[handle] = row
    
    print(f"✅ Loaded {len(products)} unique products")
    
    # Filter for priority brands needing SEO
    to_process = []
    for handle, product in products.items():
        vendor = product.get('Vendor', '').lower()
        seo_desc = product.get('SEO Description', '')
        
        # Check if priority brand and needs SEO
        if any(brand in vendor for brand in PRIORITY_BRANDS) and not seo_desc:
            to_process.append(product)
    
    print(f"📊 Products needing SEO: {len(to_process)}")
    
    # Generate SEO
    results = []
    for i, product in enumerate(to_process, 1):
        title = product.get('Title', '')
        vendor = product.get('Vendor', '')
        handle = product.get('Handle', '')
        
        seo_title, seo_desc = generate_seo(title, vendor)
        
        results.append({
            'Handle': handle,
            'Title': title,
            'Vendor': vendor,
            'SEO Title': seo_title,
            'SEO Description': seo_desc
        })
        
        if i % 50 == 0:
            print(f"   Progress: {i}/{len(to_process)}")
    
    print(f"   Progress: {len(to_process)}/{len(to_process)}")
    
    # Export
    output_path = Path(__file__).parent / "seo_bulk_update.csv"
    with open(output_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=['Handle', 'Title', 'Vendor', 'SEO Title', 'SEO Description'])
        writer.writeheader()
        writer.writerows(results)
    
    print(f"\n✅ Exported {len(results)} products to: {output_path}")
    
    # Show samples by brand
    print("\n📝 SAMPLE OUTPUT BY BRAND")
    print("=" * 70)
    
    brands_shown = set()
    for r in results:
        vendor = r['Vendor']
        if vendor not in brands_shown:
            brands_shown.add(vendor)
            print(f"\n🏷️ {vendor}")
            print(f"   Product: {r['Title'][:50]}...")
            print(f"   SEO Title: {r['SEO Title']}")
            print(f"   SEO Desc: {r['SEO Description']}")
            if len(brands_shown) >= 6:
                break
    
    # Stats
    print("\n📊 GENERATION STATS")
    print("=" * 70)
    from collections import Counter
    vendor_counts = Counter(r['Vendor'] for r in results)
    for v, c in vendor_counts.most_common(10):
        print(f"   {c:4} products | {v}")
    
    print(f"\n🎯 NEXT STEPS:")
    print(f"   1. Review: {output_path}")
    print(f"   2. Import via Shopify Admin > Products > Import")
    print(f"   3. Or use Shopify CLI: shopify product import --csv {output_path.name}")


if __name__ == "__main__":
    main()
