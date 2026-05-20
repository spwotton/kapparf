"""
SUPPZ CONTENT ENGINE
Automated AI-Powered Content Generation for SEO Domination

Features:
- Blog post generation for topical authority
- Product description optimization
- Social media content creation
- Keyword-optimized content clusters

Uses: Ollama (local, free) or Claude API (quality)
"""

import os
import json
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Optional

try:
    import ollama
    HAS_OLLAMA = True
except ImportError:
    HAS_OLLAMA = False


class ContentEngine:
    """AI-powered content generation for supplement SEO"""
    
    def __init__(self, model: str = "qwen2.5-coder:1.5b"):
        self.model = model
        
        # Content pillars for topical authority
        self.content_pillars = {
            "ecklonia_cava": {
                "hub": "Ultimate Guide to Ecklonia Cava",
                "spokes": [
                    "Ecklonia Cava Benefits: What Science Says",
                    "Ecklonia Cava vs Green Tea: Antioxidant Comparison",
                    "How Phlorotannins Cross the Blood-Brain Barrier",
                    "Korean Brown Algae: Traditional Uses and Modern Science",
                    "Ecklonia Cava for Weight Loss: The Research",
                    "Ecklonia Cava Dosage Guide",
                    "Best Ecklonia Cava Supplements (2026 Guide)"
                ]
            },
            "fat_burners": {
                "hub": "Complete Guide to Fat Burner Supplements",
                "spokes": [
                    "How Thermogenic Supplements Work",
                    "Natural vs Synthetic Fat Burners",
                    "Fat Burner Timing: When to Take for Best Results",
                    "Stacking Fat Burners with Other Supplements",
                    "Fat Burner Side Effects: What to Know",
                    "Best Fat Burners That Actually Work (2026)"
                ]
            },
            "amino_acids": {
                "hub": "Essential Amino Acids Guide",
                "spokes": [
                    "BCAAs vs EAAs: Which Do You Need?",
                    "Amino Acids for Recovery",
                    "When to Take Amino Acids",
                    "Amino Acids and Muscle Protein Synthesis",
                    "Intra-Workout Amino Formulas Explained"
                ]
            },
            "marine_nutrition": {
                "hub": "Ocean-Based Supplements Guide",
                "spokes": [
                    "Marine Phytoplankton Benefits",
                    "Algae Supplements: Types and Benefits",
                    "Ocean Superfoods for Health",
                    "Why Deep Ocean Nutrients Are Different",
                    "Sustainable Sourcing of Marine Supplements"
                ]
            }
        }
        
        # Product-specific talking points
        self.product_angles = {
            "helios": {
                "unique_ingredient": "Ecklonia cava (Korean brown algae)",
                "differentiator": "Crosses blood-brain barrier for cognitive + metabolic benefits",
                "proof_points": [
                    "8x stronger antioxidant than green tea",
                    "Phlorotannins are unique to brown algae",
                    "Studied in Korea for decades"
                ],
                "target_keywords": [
                    "ecklonia cava fat burner",
                    "nootropic fat burner",
                    "brain and body supplement"
                ]
            },
            "charged_amino": {
                "unique_ingredient": "Complete EAA profile",
                "differentiator": "Perfect intra-workout formula",
                "proof_points": [
                    "All 9 essential amino acids",
                    "Optimal recovery ratio",
                    "Great taste, no bloat"
                ],
                "target_keywords": [
                    "essential amino acids",
                    "intra workout amino",
                    "muscle recovery supplement"
                ]
            },
            "marine_phytoplankton": {
                "unique_ingredient": "Phytoplankton + Ecklonia cava stack",
                "differentiator": "Ultimate cellular nutrition from the ocean",
                "proof_points": [
                    "Contains all amino acids",
                    "Rich in omega-3 fatty acids",
                    "Natural source of chlorophyll"
                ],
                "target_keywords": [
                    "marine phytoplankton supplement",
                    "algae nutrition",
                    "ocean superfood"
                ]
            }
        }
    
    def generate_blog_post(self, topic: str, target_keywords: List[str] = None, word_count: int = 1500) -> str:
        """Generate SEO-optimized blog post"""
        
        keywords_str = ", ".join(target_keywords) if target_keywords else topic
        
        prompt = f"""Write a comprehensive, SEO-optimized blog post about: {topic}

Target keywords to include naturally: {keywords_str}

Requirements:
- {word_count} words approximately
- Include H2 and H3 headers
- Write in authoritative but accessible tone
- Include a compelling introduction
- Add practical takeaways
- End with call-to-action
- Natural keyword placement (don't stuff)

Format as Markdown.

---

# {topic}

"""
        
        if HAS_OLLAMA:
            try:
                response = ollama.generate(model=self.model, prompt=prompt)
                return response.get("response", "")
            except Exception as e:
                print(f"Ollama error: {e}")
        
        # Fallback template
        return self._template_blog_post(topic, target_keywords)
    
    def _template_blog_post(self, topic: str, keywords: List[str] = None) -> str:
        """Template-based blog post when AI unavailable"""
        return f"""# {topic}

## Introduction

[Opening paragraph introducing the topic and why it matters...]

## What You Need to Know

[Core content explaining the main concepts...]

### Key Benefits

1. [Benefit 1]
2. [Benefit 2]
3. [Benefit 3]

### The Science Behind It

[Evidence-based explanation...]

## How to Choose the Right Product

[Buying guide content...]

## Conclusion

[Summary and call-to-action...]

---
*Shop premium supplements at Suppz.com*
"""
    
    def generate_product_description(self, product_name: str, features: List[str], target_keywords: List[str]) -> Dict:
        """Generate optimized product descriptions"""
        
        features_str = "\n".join(f"- {f}" for f in features)
        keywords_str = ", ".join(target_keywords)
        
        prompt = f"""Write product page content for: {product_name}

Features:
{features_str}

Target keywords: {keywords_str}

Generate:
1. Short description (50 words, punchy)
2. Full description (200 words, detailed)
3. Bullet points (5 key benefits)
4. Meta title (60 chars)
5. Meta description (155 chars)

Format as JSON.
"""
        
        if HAS_OLLAMA:
            try:
                response = ollama.generate(model=self.model, prompt=prompt)
                # Try to parse JSON from response
                text = response.get("response", "")
                # Find JSON in response
                import re
                json_match = re.search(r'\{[\s\S]*\}', text)
                if json_match:
                    return json.loads(json_match.group())
            except Exception as e:
                print(f"Generation error: {e}")
        
        # Fallback
        return {
            "short_description": f"Premium {product_name} for your health goals.",
            "full_description": f"{product_name} delivers results with quality ingredients.",
            "bullet_points": features[:5] if features else ["Quality ingredients", "Fast shipping"],
            "meta_title": f"{product_name} | Premium Supplements | Suppz",
            "meta_description": f"Shop {product_name} at Suppz. Premium quality, fast shipping. Get results today."
        }
    
    def generate_social_content(self, product: str, platform: str = "instagram") -> Dict:
        """Generate social media content"""
        
        angle = self.product_angles.get(product.lower(), {})
        
        prompts = {
            "instagram": f"""Create an Instagram post for {product}:
- Unique angle: {angle.get('differentiator', 'premium quality')}
- Include emojis
- Engaging hook
- Call-to-action
- 3-5 relevant hashtags

Post:""",
            "twitter": f"""Create a Twitter thread (3 tweets) about {product}:
- Hook in first tweet
- Value in second
- CTA in third
- Under 280 chars each

Thread:""",
            "email": f"""Create an email subject line and preview text for {product}:
- Subject: attention-grabbing
- Preview: compelling reason to open

Email:"""
        }
        
        prompt = prompts.get(platform, prompts["instagram"])
        
        if HAS_OLLAMA:
            try:
                response = ollama.generate(model=self.model, prompt=prompt)
                return {
                    "platform": platform,
                    "content": response.get("response", ""),
                    "product": product
                }
            except Exception as e:
                print(f"Generation error: {e}")
        
        # Fallback
        return {
            "platform": platform,
            "content": f"🔥 {product} is here! Premium quality, real results. Shop now at suppz.com #supplements #fitness",
            "product": product
        }
    
    def generate_content_calendar(self, weeks: int = 4) -> List[Dict]:
        """Generate content calendar for the month"""
        
        calendar = []
        
        # Rotate through content pillars
        pillars = list(self.content_pillars.keys())
        
        for week in range(weeks):
            pillar = pillars[week % len(pillars)]
            pillar_data = self.content_pillars[pillar]
            
            week_content = {
                "week": week + 1,
                "pillar": pillar,
                "blog_post": pillar_data["spokes"][week % len(pillar_data["spokes"])],
                "social_posts": [
                    f"Instagram: Teaser for {pillar_data['spokes'][week % len(pillar_data['spokes'])]}",
                    f"Twitter: Quick tip about {pillar.replace('_', ' ')}",
                    f"Email: New blog post announcement"
                ],
                "product_focus": list(self.product_angles.keys())[week % len(self.product_angles)]
            }
            
            calendar.append(week_content)
        
        return calendar
    
    def export_content_plan(self, output_file: str = "content_plan.json"):
        """Export full content plan"""
        
        plan = {
            "generated": datetime.now().isoformat(),
            "content_pillars": self.content_pillars,
            "product_angles": self.product_angles,
            "calendar": self.generate_content_calendar(8),  # 2 months
            "priority_keywords": [
                "ecklonia cava supplement",
                "ecklonia cava fat burner",
                "korean brown algae",
                "phlorotannin benefits",
                "marine phytoplankton",
                "best thermogenic 2026",
                "natural fat burner"
            ]
        }
        
        Path(output_file).write_text(json.dumps(plan, indent=2))
        print(f"✅ Content plan saved to: {output_file}")
        
        return plan


def main():
    """Generate content plan"""
    print("""
╔═══════════════════════════════════════════════════════════╗
║           SUPPZ CONTENT ENGINE v1.0                       ║
║           AI-Powered SEO Content Generation               ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    engine = ContentEngine()
    
    # Export content plan
    plan = engine.export_content_plan("suppz_content_plan.json")
    
    print("\n📅 CONTENT CALENDAR (8 Weeks)")
    print("=" * 60)
    
    for week in plan["calendar"]:
        print(f"\nWeek {week['week']}: {week['pillar'].replace('_', ' ').title()}")
        print(f"   📝 Blog: {week['blog_post']}")
        print(f"   📦 Product Focus: {week['product_focus']}")
    
    print("\n" + "=" * 60)
    print("🎯 PRIORITY KEYWORDS TO TARGET")
    print("=" * 60)
    for kw in plan["priority_keywords"]:
        print(f"   • {kw}")
    
    # Generate sample content
    print("\n" + "=" * 60)
    print("📄 SAMPLE BLOG POST OUTLINE")
    print("=" * 60)
    
    # Just show the structure
    pillar = plan["content_pillars"]["ecklonia_cava"]
    print(f"\n🏛️ HUB: {pillar['hub']}")
    print("   SPOKES:")
    for spoke in pillar["spokes"]:
        print(f"   → {spoke}")
    
    print("\n✅ Ready to generate full content!")
    print("   Run: python content_engine.py --generate-blog 'topic'")


if __name__ == "__main__":
    main()
