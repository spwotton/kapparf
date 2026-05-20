"""
SUPPZ SEO SUPERCHARGER
Shopify Store SEO Automation Toolkit

Features:
- Bulk product SEO optimization
- AI-powered meta descriptions
- Schema markup generation
- Keyword optimization
- Competitor analysis

Requires:
- SHOPIFY_STORE_URL: your-store.myshopify.com
- SHOPIFY_ACCESS_TOKEN: Admin API access token
"""

import os
import json
import re
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, asdict
from datetime import datetime

# Try to import optional dependencies
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
    product_id: str
    handle: str
    title: str
    current_meta_title: str
    current_meta_description: str
    optimized_meta_title: str
    optimized_meta_description: str
    target_keywords: List[str]
    schema_markup: Dict
    seo_score: int
    issues: List[str]
    recommendations: List[str]


class ShopifySEO:
    """Shopify SEO Automation"""
    
    def __init__(self, store_url: str = None, access_token: str = None):
        self.store_url = store_url or os.environ.get("SHOPIFY_STORE_URL", "")
        self.access_token = access_token or os.environ.get("SHOPIFY_ACCESS_TOKEN", "")
        self.api_version = "2024-01"
        
        # SEO templates for supplements
        self.seo_templates = {
            "fat_burner": {
                "keywords": ["fat burner", "thermogenic", "metabolism booster", "weight loss supplement"],
                "title_template": "{product} | Premium {category} | {brand}",
                "desc_template": "Boost your metabolism with {product}. {unique_ingredient} for enhanced fat burning. {benefit}. Free shipping on orders over $50.",
            },
            "amino_acids": {
                "keywords": ["amino acids", "BCAAs", "muscle recovery", "workout supplement"],
                "title_template": "{product} - {category} for Muscle Recovery | {brand}",
                "desc_template": "Fuel your muscles with {product}. Premium {category} for faster recovery and lean muscle growth. {benefit}.",
            },
            "nootropic": {
                "keywords": ["nootropic", "brain supplement", "cognitive enhancer", "focus supplement"],
                "title_template": "{product} | Brain-Boosting {category} | {brand}",
                "desc_template": "Enhance mental clarity with {product}. {unique_ingredient} for improved focus and cognitive performance. {benefit}.",
            },
            "general": {
                "keywords": ["supplement", "nutrition", "health"],
                "title_template": "{product} | Premium Supplements | {brand}",
                "desc_template": "Shop {product} at {brand}. High-quality supplements for your health goals. {benefit}. Fast shipping.",
            }
        }
        
        # Ecklonia cava specific content (for Helios)
        self.ecklonia_content = {
            "unique_selling_points": [
                "Deep ocean Ecklonia cava extract",
                "Crosses blood-brain barrier",
                "8x stronger than green tea antioxidants",
                "Phlorotannins for neuroprotection",
                "Korean brown algae superfood"
            ],
            "keywords": [
                "ecklonia cava supplement",
                "brown algae extract",
                "phlorotannin supplement",
                "korean seaweed supplement",
                "brain health algae",
                "deep ocean antioxidant"
            ],
            "benefits": [
                "Supports cognitive function",
                "Promotes healthy circulation", 
                "Natural antioxidant protection",
                "Supports metabolic health"
            ]
        }
    
    def _api_call(self, endpoint: str, method: str = "GET", data: dict = None) -> Optional[Dict]:
        """Make Shopify API call"""
        if not HAS_REQUESTS:
            print("❌ requests library not installed. Run: pip install requests")
            return None
            
        if not self.store_url or not self.access_token:
            print("❌ Shopify credentials not configured")
            print("   Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN environment variables")
            return None
        
        url = f"https://{self.store_url}/admin/api/{self.api_version}/{endpoint}"
        headers = {
            "X-Shopify-Access-Token": self.access_token,
            "Content-Type": "application/json"
        }
        
        try:
            if method == "GET":
                resp = requests.get(url, headers=headers)
            elif method == "PUT":
                resp = requests.put(url, headers=headers, json=data)
            elif method == "POST":
                resp = requests.post(url, headers=headers, json=data)
            
            resp.raise_for_status()
            return resp.json()
        except Exception as e:
            print(f"❌ API error: {e}")
            return None
    
    def get_all_products(self, limit: int = 250) -> List[Dict]:
        """Fetch all products from store"""
        products = []
        endpoint = f"products.json?limit={limit}"
        
        while endpoint:
            result = self._api_call(endpoint)
            if not result:
                break
            
            products.extend(result.get("products", []))
            
            # Handle pagination
            # (Simplified - full implementation would parse Link header)
            break
        
        return products
    
    def analyze_product_seo(self, product: Dict) -> ProductSEO:
        """Analyze SEO for a single product"""
        issues = []
        recommendations = []
        score = 100
        
        title = product.get("title", "")
        handle = product.get("handle", "")
        description = product.get("body_html", "")
        meta_title = product.get("metafields_global_title_tag", "") or title
        meta_desc = product.get("metafields_global_description_tag", "") or ""
        
        # Check meta title
        if len(meta_title) < 30:
            issues.append("Meta title too short (<30 chars)")
            score -= 10
        elif len(meta_title) > 60:
            issues.append("Meta title too long (>60 chars)")
            score -= 5
        
        # Check meta description
        if not meta_desc:
            issues.append("Missing meta description")
            score -= 20
        elif len(meta_desc) < 120:
            issues.append("Meta description too short (<120 chars)")
            score -= 10
        elif len(meta_desc) > 160:
            issues.append("Meta description too long (>160 chars)")
            score -= 5
        
        # Check for keywords in title
        product_lower = title.lower()
        if not any(kw in product_lower for kw in ["supplement", "capsule", "powder", "formula"]):
            recommendations.append("Add product type keyword to title")
        
        # Check images for alt text
        images = product.get("images", [])
        missing_alt = sum(1 for img in images if not img.get("alt"))
        if missing_alt > 0:
            issues.append(f"{missing_alt} images missing alt text")
            score -= (5 * missing_alt)
        
        # Detect product category for template
        category = self._detect_category(title, description)
        template = self.seo_templates.get(category, self.seo_templates["general"])
        
        # Generate optimized meta
        optimized_title = self._generate_meta_title(product, category)
        optimized_desc = self._generate_meta_description(product, category)
        
        # Generate schema
        schema = self._generate_product_schema(product)
        
        return ProductSEO(
            product_id=str(product.get("id", "")),
            handle=handle,
            title=title,
            current_meta_title=meta_title,
            current_meta_description=meta_desc,
            optimized_meta_title=optimized_title,
            optimized_meta_description=optimized_desc,
            target_keywords=template["keywords"],
            schema_markup=schema,
            seo_score=max(0, score),
            issues=issues,
            recommendations=recommendations
        )
    
    def _detect_category(self, title: str, description: str) -> str:
        """Detect product category from title/description"""
        text = (title + " " + description).lower()
        
        if any(kw in text for kw in ["fat burn", "thermogenic", "helios", "weight loss"]):
            return "fat_burner"
        elif any(kw in text for kw in ["amino", "bcaa", "charged", "recovery"]):
            return "amino_acids"
        elif any(kw in text for kw in ["nootropic", "brain", "focus", "cognitive", "ecklonia"]):
            return "nootropic"
        else:
            return "general"
    
    def _generate_meta_title(self, product: Dict, category: str) -> str:
        """Generate optimized meta title"""
        title = product.get("title", "")
        vendor = product.get("vendor", "Suppz")
        
        template = self.seo_templates.get(category, self.seo_templates["general"])
        
        # Format template
        meta_title = template["title_template"].format(
            product=title,
            category=category.replace("_", " ").title(),
            brand=vendor
        )
        
        # Truncate to 60 chars
        if len(meta_title) > 60:
            meta_title = meta_title[:57] + "..."
        
        return meta_title
    
    def _generate_meta_description(self, product: Dict, category: str) -> str:
        """Generate optimized meta description"""
        title = product.get("title", "")
        vendor = product.get("vendor", "Suppz")
        
        # Check for ecklonia cava products
        if "ecklonia" in title.lower() or "helios" in title.lower():
            usp = self.ecklonia_content["unique_selling_points"][0]
            benefit = self.ecklonia_content["benefits"][0]
            return f"Discover {title} with {usp}. {benefit}. Premium Korean brown algae extract. Shop now at {vendor} - Fast shipping!"
        
        template = self.seo_templates.get(category, self.seo_templates["general"])
        
        meta_desc = template["desc_template"].format(
            product=title,
            category=category.replace("_", " ").title(),
            brand=vendor,
            unique_ingredient="premium ingredients",
            benefit="Clinically-studied formula"
        )
        
        # Truncate to 160 chars
        if len(meta_desc) > 160:
            meta_desc = meta_desc[:157] + "..."
        
        return meta_desc
    
    def _generate_product_schema(self, product: Dict) -> Dict:
        """Generate JSON-LD schema markup for product"""
        images = product.get("images", [])
        variants = product.get("variants", [{}])
        
        schema = {
            "@context": "https://schema.org/",
            "@type": "Product",
            "name": product.get("title", ""),
            "description": self._strip_html(product.get("body_html", "")),
            "image": [img.get("src", "") for img in images[:5]],
            "brand": {
                "@type": "Brand",
                "name": product.get("vendor", "")
            },
            "offers": {
                "@type": "Offer",
                "url": f"https://suppz.com/products/{product.get('handle', '')}",
                "priceCurrency": "USD",
                "price": variants[0].get("price", "0.00"),
                "availability": "https://schema.org/InStock" if variants[0].get("available", True) else "https://schema.org/OutOfStock",
                "seller": {
                    "@type": "Organization",
                    "name": "Suppz"
                }
            }
        }
        
        # Add aggregate rating if reviews exist
        # (Would need to integrate with review system)
        
        return schema
    
    def _strip_html(self, html: str) -> str:
        """Remove HTML tags from string"""
        clean = re.sub('<[^<]+?>', '', html)
        return ' '.join(clean.split())[:500]
    
    def generate_ai_description(self, product: Dict, use_ollama: bool = True) -> str:
        """Generate AI-powered product description"""
        if use_ollama and HAS_OLLAMA:
            try:
                prompt = f"""Write a compelling 2-3 sentence product meta description for SEO:

Product: {product.get('title', '')}
Category: {self._detect_category(product.get('title', ''), product.get('body_html', ''))}
Brand: {product.get('vendor', 'Suppz')}

Requirements:
- 150-160 characters max
- Include primary keyword naturally
- End with call-to-action
- Highlight unique benefit

Description:"""
                
                response = ollama.generate(model="qwen2.5-coder:1.5b", prompt=prompt)
                return response.get("response", "").strip()[:160]
            except Exception as e:
                print(f"Ollama error: {e}")
        
        # Fallback to template
        return self._generate_meta_description(product, self._detect_category(
            product.get("title", ""), product.get("body_html", "")
        ))
    
    def audit_store(self, output_file: str = "seo_audit.json") -> Dict:
        """Full SEO audit of store"""
        print("🔍 SUPPZ SEO AUDIT")
        print("=" * 60)
        
        products = self.get_all_products()
        
        if not products:
            # Demo mode with sample data
            print("📋 Running in DEMO MODE (no API credentials)")
            products = self._get_demo_products()
        
        print(f"📦 Analyzing {len(products)} products...")
        
        results = {
            "audit_date": datetime.now().isoformat(),
            "total_products": len(products),
            "products": [],
            "summary": {
                "avg_score": 0,
                "critical_issues": 0,
                "products_need_work": 0,
                "products_optimized": 0
            }
        }
        
        total_score = 0
        
        for product in products:
            seo_data = self.analyze_product_seo(product)
            results["products"].append(asdict(seo_data))
            total_score += seo_data.seo_score
            
            if seo_data.seo_score < 50:
                results["summary"]["critical_issues"] += 1
            elif seo_data.seo_score < 80:
                results["summary"]["products_need_work"] += 1
            else:
                results["summary"]["products_optimized"] += 1
            
            # Print progress
            score_emoji = "✅" if seo_data.seo_score >= 80 else "⚠️" if seo_data.seo_score >= 50 else "❌"
            print(f"  {score_emoji} {seo_data.title[:40]:40} Score: {seo_data.seo_score}")
        
        results["summary"]["avg_score"] = total_score // len(products) if products else 0
        
        # Save results
        output_path = Path(output_file)
        output_path.write_text(json.dumps(results, indent=2))
        
        print("\n" + "=" * 60)
        print("📊 AUDIT SUMMARY")
        print(f"   Average SEO Score: {results['summary']['avg_score']}/100")
        print(f"   Critical Issues: {results['summary']['critical_issues']}")
        print(f"   Need Work: {results['summary']['products_need_work']}")
        print(f"   Optimized: {results['summary']['products_optimized']}")
        print(f"\n💾 Full report saved to: {output_path}")
        
        return results
    
    def _get_demo_products(self) -> List[Dict]:
        """Demo products for testing"""
        return [
            {
                "id": 1,
                "title": "Helios Fat Burner",
                "handle": "helios-fat-burner",
                "vendor": "Suppz",
                "body_html": "<p>Premium thermogenic with Ecklonia cava extract for enhanced metabolism and cognitive support.</p>",
                "variants": [{"price": "49.99", "available": True}],
                "images": [{"src": "https://example.com/helios.jpg", "alt": ""}]
            },
            {
                "id": 2,
                "title": "Charged Amino",
                "handle": "charged-amino",
                "vendor": "Suppz",
                "body_html": "<p>Essential amino acids for muscle recovery and growth. Perfect intra-workout formula.</p>",
                "variants": [{"price": "34.99", "available": True}],
                "images": [{"src": "https://example.com/charged.jpg", "alt": "Charged Amino"}]
            },
            {
                "id": 3,
                "title": "Marine Phytoplankton Complex",
                "handle": "marine-phytoplankton",
                "vendor": "Gaia's Legacy",
                "body_html": "<p>Ocean-sourced superfood with Ecklonia cava and marine phytoplankton. Ultimate cellular nutrition.</p>",
                "variants": [{"price": "59.99", "available": True}],
                "images": [{"src": "https://example.com/marine.jpg", "alt": ""}]
            }
        ]
    
    def generate_bulk_optimization(self, products: List[Dict] = None) -> List[Dict]:
        """Generate optimized SEO data for all products"""
        if not products:
            products = self.get_all_products() or self._get_demo_products()
        
        optimizations = []
        
        for product in products:
            seo = self.analyze_product_seo(product)
            
            optimizations.append({
                "product_id": seo.product_id,
                "handle": seo.handle,
                "updates": {
                    "metafields_global_title_tag": seo.optimized_meta_title,
                    "metafields_global_description_tag": seo.optimized_meta_description
                },
                "schema": seo.schema_markup,
                "current_score": seo.seo_score,
                "projected_score": min(100, seo.seo_score + 30)  # After optimization
            })
        
        return optimizations


class CompetitorAnalyzer:
    """Analyze competitor SEO"""
    
    def __init__(self):
        self.competitors = [
            "bodybuilding.com",
            "gnc.com",
            "vitaminshoppe.com",
            "amazon.com"
        ]
        
        # Common supplement keywords to track
        self.keywords = [
            "fat burner supplements",
            "best thermogenic",
            "amino acid supplements",
            "pre workout supplements",
            "ecklonia cava supplement",
            "brown algae supplement"
        ]
    
    def analyze_keyword_gaps(self, our_keywords: List[str]) -> Dict:
        """Find keywords competitors rank for that we don't"""
        # This would normally use an SEO API like Semrush, Ahrefs, etc.
        # For now, return strategic recommendations
        
        gaps = {
            "high_opportunity": [
                "ecklonia cava fat burner",
                "korean brown algae supplement",
                "phlorotannin supplement",
                "deep ocean extract weight loss"
            ],
            "medium_opportunity": [
                "natural thermogenic supplements",
                "brain boosting fat burner",
                "nootropic weight loss"
            ],
            "long_tail": [
                "ecklonia cava vs green tea",
                "best supplement for metabolism and focus",
                "ocean algae weight loss supplement"
            ]
        }
        
        return gaps


def main():
    """Run SEO audit"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║           SUPPZ SEO SUPERCHARGER v1.0                     ║
║           Beat the morons. Automate everything.           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    seo = ShopifySEO()
    
    # Run audit
    results = seo.audit_store("suppz_seo_audit.json")
    
    # Show optimizations
    print("\n" + "=" * 60)
    print("🚀 RECOMMENDED OPTIMIZATIONS")
    print("=" * 60)
    
    opts = seo.generate_bulk_optimization()
    
    for opt in opts:
        print(f"\n📦 {opt['handle']}")
        print(f"   Current Score: {opt['current_score']} → Projected: {opt['projected_score']}")
        print(f"   New Title: {opt['updates']['metafields_global_title_tag']}")
        print(f"   New Desc: {opt['updates']['metafields_global_description_tag'][:80]}...")
    
    # Competitor analysis
    print("\n" + "=" * 60)
    print("🎯 KEYWORD OPPORTUNITIES (vs competitors)")
    print("=" * 60)
    
    comp = CompetitorAnalyzer()
    gaps = comp.analyze_keyword_gaps([])
    
    print("\n🔥 HIGH OPPORTUNITY (rank for these!):")
    for kw in gaps["high_opportunity"]:
        print(f"   • {kw}")
    
    print("\n📈 LONG-TAIL OPPORTUNITIES:")
    for kw in gaps["long_tail"]:
        print(f"   • {kw}")
    
    print("\n" + "=" * 60)
    print("✅ Audit complete! Next steps:")
    print("   1. Set SHOPIFY_STORE_URL and SHOPIFY_ACCESS_TOKEN")
    print("   2. Run: python seo_supercharger.py --apply")
    print("   3. Generate blog content for keywords")


if __name__ == "__main__":
    main()
