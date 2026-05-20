"""
SUPPZ SEO GENERATOR
Automated SEO content generation for Shopify products

Features:
- Reads product export CSV
- Generates keyword-optimized meta titles/descriptions
- Pushes directly to Shopify via Admin API
- Or exports for bulk import

Usage:
    python seo_generator.py --analyze              # Show what needs work
    python seo_generator.py --generate             # Generate SEO for all
    python seo_generator.py --generate --brand "Hi Tech Pharmaceuticals"
    python seo_generator.py --push                 # Push to Shopify (requires API)
    python seo_generator.py --export               # Export CSV for bulk import
"""

import os
import sys
import csv
import json
import re
import argparse
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass, asdict
from datetime import datetime

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

try:
    import ollama
    HAS_OLLAMA = True
except ImportError:
    HAS_OLLAMA = False


@dataclass
class ProductSEO:
    """SEO data for a product"""
    handle: str
    title: str
    vendor: str
    price: str
    current_seo_title: str
    current_seo_desc: str
    new_seo_title: str
    new_seo_desc: str
    keywords: List[str]
    needs_update: bool


class SEOGenerator:
    """Generate SEO content for supplement products"""
    
    def __init__(self, csv_path: str = None):
        self.csv_path = csv_path or self._find_csv()
        self.products = {}
        self.load_products()
        
        # Shopify API config
        self.store_url = os.environ.get("SHOPIFY_STORE_URL", "")
        self.access_token = os.environ.get("SHOPIFY_ACCESS_TOKEN", "")
        self.api_version = "2024-01"
        
        # Brand-specific keyword maps
        self.brand_keywords = {
            "hi tech pharmaceuticals": {
                "category": "prohormone",
                "keywords": ["hi-tech pharmaceuticals", "legal prohormone", "muscle building supplement"],
                "benefits": ["lean muscle", "strength gains", "performance enhancement"]
            },
            "blackstone labs": {
                "category": "hardcore",
                "keywords": ["blackstone labs", "hardcore supplement", "bodybuilding"],
                "benefits": ["extreme results", "muscle growth", "performance"]
            },
            "alpha lion": {
                "category": "performance",
                "keywords": ["alpha lion", "superhuman", "pre workout"],
                "benefits": ["energy", "focus", "pump"]
            },
            "olympus labs": {
                "category": "advanced",
                "keywords": ["olympus labs", "advanced formula", "research-backed"],
                "benefits": ["cutting edge", "scientifically formulated", "premium quality"]
            },
            "nutrex": {
                "category": "mainstream",
                "keywords": ["nutrex research", "lipo 6", "muscle infusion"],
                "benefits": ["fat burning", "muscle building", "performance"]
            }
        }
        
        # Product-specific keyword maps (high-value products)
        self.product_keywords = {
            "lipodrene": {
                "primary": ["lipodrene", "hi tech lipodrene", "buy lipodrene"],
                "secondary": ["ephedra fat burner", "thermogenic", "weight loss pills"],
                "benefits": "powerful thermogenic for extreme fat burning and energy"
            },
            "anavar": {
                "primary": ["hi tech anavar", "anavar supplement", "buy anavar"],
                "secondary": ["prohormone", "lean muscle", "cutting supplement"],
                "benefits": "legal anavar alternative for lean muscle and strength"
            },
            "dianabol": {
                "primary": ["hi tech dianabol", "dianabol supplement", "buy dianabol"],
                "secondary": ["muscle builder", "mass gainer", "bulking prohormone"],
                "benefits": "legal dianabol for serious mass and strength gains"
            },
            "winstrol": {
                "primary": ["hi tech winstrol", "winstrol supplement"],
                "secondary": ["cutting prohormone", "lean gains", "definition"],
                "benefits": "legal winstrol alternative for hardening and definition"
            },
            "superdrol": {
                "primary": ["hi tech superdrol", "superdrol prohormone"],
                "secondary": ["muscle hardener", "dry gains", "strength"],
                "benefits": "extreme strength and muscle density"
            },
            "hydroxyelite": {
                "primary": ["hydroxyelite", "hi tech hydroxyelite"],
                "secondary": ["fat burner", "energy supplement", "diet pill"],
                "benefits": "powerful fat burning and appetite control"
            },
            "fastin": {
                "primary": ["fastin", "hi tech fastin"],
                "secondary": ["diet pill", "appetite suppressant", "energy"],
                "benefits": "rapid weight loss and extreme energy"
            },
            "stimerex": {
                "primary": ["stimerex", "stimerex es", "hi tech stimerex"],
                "secondary": ["ephedra", "fat burner", "thermogenic"],
                "benefits": "classic ephedra formula for fat burning"
            },
            "somatomax": {
                "primary": ["somatomax", "hi tech somatomax"],
                "secondary": ["sleep supplement", "gh booster", "recovery"],
                "benefits": "deep sleep and growth hormone support"
            },
            "decabolin": {
                "primary": ["decabolin", "hi tech decabolin"],
                "secondary": ["nandrolone", "joint support", "mass builder"],
                "benefits": "muscle building with joint support benefits"
            },
            "halodrol": {
                "primary": ["halodrol", "hi tech halodrol"],
                "secondary": ["prohormone", "lean muscle", "strength"],
                "benefits": "dry lean gains and strength"
            },
            "androdiol": {
                "primary": ["androdiol", "hi tech androdiol"],
                "secondary": ["testosterone booster", "muscle builder"],
                "benefits": "natural testosterone support for muscle growth"
            },
            "1-testosterone": {
                "primary": ["1-testosterone", "hi tech 1-testosterone", "1-ad"],
                "secondary": ["prohormone", "lean mass", "cutting"],
                "benefits": "lean muscle without water retention"
            },
            "sustanon": {
                "primary": ["sustanon 250", "hi tech sustanon"],
                "secondary": ["testosterone blend", "muscle builder"],
                "benefits": "sustained testosterone support formula"
            },
            "equibolin": {
                "primary": ["equibolin", "hi tech equibolin"],
                "secondary": ["prohormone", "lean gains", "vascularity"],
                "benefits": "quality lean muscle and vascularity"
            }
        }
    
    def _find_csv(self) -> str:
        """Find product export CSV"""
        candidates = [
            Path(__file__).parent.parent / "products_export_1 - products_export_1 (1).csv",
            Path(__file__).parent / "products_export.csv",
        ]
        for p in candidates:
            if p.exists():
                return str(p)
        return ""
    
    def load_products(self):
        """Load products from CSV"""
        if not self.csv_path or not Path(self.csv_path).exists():
            print(f"❌ CSV not found: {self.csv_path}")
            return
        
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                handle = row.get('Handle', '')
                if handle and handle not in self.products:
                    self.products[handle] = row
        
        print(f"✅ Loaded {len(self.products)} unique products")
    
    def get_products_needing_seo(self, vendor: str = None) -> List[Dict]:
        """Get products missing SEO descriptions"""
        results = []
        for handle, product in self.products.items():
            if not product.get('SEO Description'):
                if vendor:
                    if vendor.lower() in product.get('Vendor', '').lower():
                        results.append(product)
                else:
                    results.append(product)
        return results
    
    def generate_seo(self, product: Dict, use_ai: bool = True) -> ProductSEO:
        """Generate SEO content for a product"""
        title = product.get('Title', '')
        vendor = product.get('Vendor', '')
        handle = product.get('Handle', '')
        price = product.get('Variant Price', '0')
        current_seo_title = product.get('SEO Title', '')
        current_seo_desc = product.get('SEO Description', '')
        
        # Determine product keywords
        keywords = self._get_product_keywords(title, vendor)
        
        # Generate new SEO
        if use_ai and HAS_OLLAMA:
            new_title, new_desc = self._generate_ai_seo(title, vendor, keywords)
        else:
            new_title, new_desc = self._generate_template_seo(title, vendor, keywords)
        
        return ProductSEO(
            handle=handle,
            title=title,
            vendor=vendor,
            price=price,
            current_seo_title=current_seo_title,
            current_seo_desc=current_seo_desc,
            new_seo_title=new_title,
            new_seo_desc=new_desc,
            keywords=keywords,
            needs_update=not current_seo_desc
        )
    
    def _get_product_keywords(self, title: str, vendor: str) -> List[str]:
        """Extract relevant keywords for product"""
        keywords = []
        title_lower = title.lower()
        
        # Check product-specific keywords
        for product_key, data in self.product_keywords.items():
            if product_key in title_lower:
                keywords.extend(data['primary'])
                keywords.extend(data['secondary'][:2])
                break
        
        # Add brand keywords
        vendor_lower = vendor.lower()
        for brand_key, data in self.brand_keywords.items():
            if brand_key in vendor_lower:
                keywords.extend(data['keywords'][:2])
                break
        
        # Generic supplement keywords
        if not keywords:
            keywords = ['supplement', 'buy online', 'free shipping']
        
        return list(set(keywords))[:6]
    
    def _generate_template_seo(self, title: str, vendor: str, keywords: List[str]) -> Tuple[str, str]:
        """Generate SEO using templates"""
        title_lower = title.lower()
        
        # Find product-specific data
        product_benefit = "premium quality supplement for your fitness goals"
        for product_key, data in self.product_keywords.items():
            if product_key in title_lower:
                product_benefit = data['benefits']
                break
        
        # Generate title (max 60 chars)
        seo_title = f"{title} | Buy Online | Suppz.com"
        if len(seo_title) > 60:
            seo_title = f"{title[:45]}... | Suppz.com"
        
        # Generate description (max 155 chars)
        primary_kw = keywords[0] if keywords else title
        seo_desc = f"Buy {title} at Suppz.com. {product_benefit.capitalize()}. Fast shipping, best prices. Shop now!"
        
        if len(seo_desc) > 155:
            seo_desc = seo_desc[:152] + "..."
        
        return seo_title, seo_desc
    
    def _generate_ai_seo(self, title: str, vendor: str, keywords: List[str]) -> Tuple[str, str]:
        """Generate SEO using AI (Ollama)"""
        keywords_str = ", ".join(keywords[:4])
        
        prompt = f"""Generate SEO meta content for this supplement product:

Product: {title}
Brand: {vendor}
Target keywords: {keywords_str}

Generate:
1. SEO Title (max 60 characters, include brand or "Buy Online", end with "| Suppz.com")
2. SEO Description (max 155 characters, compelling, include benefit and CTA)

Respond in this exact format:
TITLE: [your title here]
DESC: [your description here]"""

        try:
            response = ollama.generate(model="qwen2.5-coder:1.5b", prompt=prompt)
            text = response.get("response", "")
            
            # Parse response
            title_match = re.search(r'TITLE:\s*(.+?)(?:\n|$)', text)
            desc_match = re.search(r'DESC:\s*(.+?)(?:\n|$)', text)
            
            if title_match and desc_match:
                seo_title = title_match.group(1).strip()[:60]
                seo_desc = desc_match.group(1).strip()[:155]
                return seo_title, seo_desc
        except Exception as e:
            print(f"AI generation failed: {e}")
        
        # Fallback to template
        return self._generate_template_seo(title, vendor, keywords)
    
    def generate_all(self, vendor: str = None, use_ai: bool = False, limit: int = None) -> List[ProductSEO]:
        """Generate SEO for all products needing it"""
        products = self.get_products_needing_seo(vendor)
        
        if limit:
            products = products[:limit]
        
        results = []
        total = len(products)
        
        print(f"\n🚀 Generating SEO for {total} products...")
        if use_ai:
            print("   Using AI generation (slower but higher quality)")
        else:
            print("   Using template generation (fast)")
        
        for i, product in enumerate(products, 1):
            seo = self.generate_seo(product, use_ai=use_ai)
            results.append(seo)
            
            if i % 10 == 0 or i == total:
                print(f"   Progress: {i}/{total}")
        
        return results
    
    def export_csv(self, seo_results: List[ProductSEO], output_path: str = "seo_updates.csv"):
        """Export SEO updates for Shopify bulk import"""
        with open(output_path, 'w', newline='', encoding='utf-8') as f:
            writer = csv.writer(f)
            writer.writerow(['Handle', 'Title', 'SEO Title', 'SEO Description'])
            
            for seo in seo_results:
                writer.writerow([
                    seo.handle,
                    seo.title,
                    seo.new_seo_title,
                    seo.new_seo_desc
                ])
        
        print(f"\n✅ Exported {len(seo_results)} products to: {output_path}")
        print("   Import this CSV via Shopify Admin > Products > Import")
    
    def push_to_shopify(self, seo_results: List[ProductSEO], dry_run: bool = True):
        """Push SEO updates directly to Shopify"""
        if not self.store_url or not self.access_token:
            print("❌ Shopify credentials not configured")
            print("   Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN environment variables")
            return
        
        if not HAS_REQUESTS:
            print("❌ requests library not installed: pip install requests")
            return
        
        if dry_run:
            print("\n🔍 DRY RUN - No changes will be made")
        else:
            print("\n🚀 PUSHING TO SHOPIFY...")
        
        headers = {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }
        
        success = 0
        failed = 0
        
        for seo in seo_results:
            # First, get product ID by handle
            url = f"https://{self.store_url}/admin/api/{self.api_version}/products.json?handle={seo.handle}"
            
            try:
                resp = requests.get(url, headers=headers)
                resp.raise_for_status()
                products = resp.json().get('products', [])
                
                if not products:
                    print(f"   ⚠️ Product not found: {seo.handle}")
                    failed += 1
                    continue
                
                product_id = products[0]['id']
                
                if dry_run:
                    print(f"   [DRY] Would update: {seo.title[:40]}...")
                    success += 1
                    continue
                
                # Update product metafields
                update_url = f"https://{self.store_url}/admin/api/{self.api_version}/products/{product_id}.json"
                update_data = {
                    "product": {
                        "id": product_id,
                        "metafields_global_title_tag": seo.new_seo_title,
                        "metafields_global_description_tag": seo.new_seo_desc
                    }
                }
                
                resp = requests.put(update_url, headers=headers, json=update_data)
                resp.raise_for_status()
                
                print(f"   ✅ Updated: {seo.title[:40]}...")
                success += 1
                
            except Exception as e:
                print(f"   ❌ Failed: {seo.handle} - {e}")
                failed += 1
        
        print(f"\n📊 Results: {success} success, {failed} failed")


def main():
    parser = argparse.ArgumentParser(description="SUPPZ SEO Generator")
    parser.add_argument("--analyze", action="store_true", help="Analyze products needing SEO")
    parser.add_argument("--generate", action="store_true", help="Generate SEO content")
    parser.add_argument("--export", action="store_true", help="Export to CSV")
    parser.add_argument("--push", action="store_true", help="Push to Shopify")
    parser.add_argument("--brand", type=str, help="Filter by brand name")
    parser.add_argument("--ai", action="store_true", help="Use AI generation")
    parser.add_argument("--limit", type=int, help="Limit number of products")
    parser.add_argument("--dry-run", action="store_true", help="Don't actually push")
    parser.add_argument("--csv", type=str, help="Path to product CSV")
    
    args = parser.parse_args()
    
    print("""
╔═══════════════════════════════════════════════════════════╗
║           SUPPZ SEO GENERATOR v1.0                        ║
║           Automated SEO for 3000+ Products                ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    # Initialize generator
    csv_path = args.csv or str(Path(__file__).parent.parent / "products_export_1 - products_export_1 (1).csv")
    gen = SEOGenerator(csv_path)
    
    if args.analyze or not any([args.generate, args.export, args.push]):
        # Show analysis
        print("\n📊 SEO ANALYSIS")
        print("=" * 60)
        
        needs_seo = gen.get_products_needing_seo(args.brand)
        print(f"Products needing SEO: {len(needs_seo)}")
        
        # Group by vendor
        from collections import Counter
        vendors = Counter(p.get('Vendor', '') for p in needs_seo)
        print("\nBy Brand:")
        for v, c in vendors.most_common(15):
            print(f"  {c:4} | {v}")
        
        # Show sample
        print("\nSample products needing SEO:")
        for p in needs_seo[:10]:
            print(f"  • {p.get('Title', '')[:50]}")
    
    if args.generate:
        # Generate SEO
        results = gen.generate_all(
            vendor=args.brand,
            use_ai=args.ai,
            limit=args.limit
        )
        
        # Show samples
        print("\n📝 GENERATED SEO SAMPLES")
        print("=" * 60)
        for seo in results[:5]:
            print(f"\n🏷️ {seo.title}")
            print(f"   Title: {seo.new_seo_title}")
            print(f"   Desc:  {seo.new_seo_desc}")
        
        # Export if requested
        if args.export:
            gen.export_csv(results)
        
        # Push if requested
        if args.push:
            gen.push_to_shopify(results, dry_run=args.dry_run)
        
        # Save results
        output_json = Path(__file__).parent / "seo_generated.json"
        with open(output_json, 'w') as f:
            json.dump([asdict(s) for s in results], f, indent=2)
        print(f"\n💾 Full results saved to: {output_json}")


if __name__ == "__main__":
    main()
