"""
KAPPA SEGMENTATION ENGINE (v2026)
Automated Customer Tagging for Shopify based on Geospatial & Temporal Vectors.

"The separation between the online store and the physical body is an illusion." - GOS

Requirements:
    pip install shopifyapi geopy
"""

import shopify
import time
from datetime import datetime, timedelta
from math import radians, cos, sin, asin, sqrt

# ==========================================
# 📐 CONFIGURATION (THE LATTICE)
# ==========================================

# 1. PHYSICAL NODES (The 6 Stores)
# Replace identifying info with rough coords if specific addresses unknown, 
# but for Fennimore we have it.
WISCONSIN_NODES = {
    "Fennimore_HQ": {"lat": 42.9813, "lon": -90.6588, "radius_miles": 25},
    "LaCrosse_Node": {"lat": 43.8014, "lon": -91.2396, "radius_miles": 20},
    "Madison_Node": {"lat": 43.0731, "lon": -89.4012, "radius_miles": 15},
    "Platteville_Node": {"lat": 42.7340, "lon": -90.4783, "radius_miles": 15},
    # Add other 2 stores here
}

# 2. BIO-RHYTHM CONSTANTS (Cycle Logic)
# How long does a bottle last?
PRODUCT_LIFECYCLE = {
    # High-Tech Pharma
    "HTP-1TEST": {"days": 30, "type": "cycle", "cross_sell": "HTP-PCT"},
    "HTP-LIPO":  {"days": 45, "type": "consumable", "cross_sell": "HTP-CLA"},
    "HTP-VAR":   {"days": 30, "type": "cycle", "cross_sell": "HTP-LIVER"},
    # General
    "GOL-WHEY":  {"days": 25, "type": "consumable", "cross_sell": "GOL-CREATINE"}
}

# 3. SHOPIFY CREDENTIALS (Load from ENV)
SHOP_URL = "suppz.myshopify.com"
API_VERSION = "2024-01"
# TOKEN = os.getenv("SHOPIFY_ADMIN_TOKEN")

# ==========================================
# 🧠 THE ENGINE
# ==========================================

def haversine(lon1, lat1, lon2, lat2):
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    """
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1 
    dlat = lat2 - lat1 
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a)) 
    r = 3956 # Radius of earth in miles
    return c * r

class KappaEngine:
    def __init__(self, api_token=None):
        if api_token:
            session = shopify.Session(SHOP_URL, API_VERSION, api_token)
            shopify.ShopifyResource.activate_session(session)
            print("🔗 Connected to Shopify Lattice.")
        else:
            print("⚠️ Running in SIMULATION MODE (No API Connection)")

    def process_customer(self, customer_data):
        """
        Input: Dict with 'id', 'zip', 'last_order_date', 'last_skus'
        Output: List of Tags to Apply
        """
        new_tags = []
        
        # 1. GEOSPATIAL VECTOR (The Local Warrior)
        if customer_data.get('lat') and customer_data.get('lon'):
            for store, node in WISCONSIN_NODES.items():
                dist = haversine(customer_data['lon'], customer_data['lat'], 
                               node['lon'], node['lat'])
                if dist <= node['radius_miles']:
                    tag = f"Local_Warrior:{store}"
                    new_tags.append(tag)
                    # Priority Segment: Drive them to the store
        
        # 2. TEMPORAL VECTOR (The Cycle)
        if customer_data.get('last_order_data'):
            last_order_date = datetime.strptime(customer_data['last_order_date'], "%Y-%m-%d")
            days_since = (datetime.now() - last_order_date).days
            
            for sku in customer_data['last_skus']:
                if sku in PRODUCT_LIFECYCLE:
                    rules = PRODUCT_LIFECYCLE[sku]
                    
                    # Refill Logic
                    usage_percent = days_since / rules['days']
                    if 0.8 <= usage_percent <= 1.1:
                        new_tags.append(f"Refill_Critical:{sku}")
                    
                    # Cycle/PCT Logic
                    if rules['type'] == "cycle" and usage_percent >= 0.9:
                        new_tags.append("Status:Needs_PCT")
                        new_tags.append(f"Recommend:{rules['cross_sell']}")

        return new_tags

    def run_simulation(self):
        """Test the logic with dummy data"""
        print("\n🌊 INITIATING KAPPA SIMULATION...")
        
        test_subjects = [
            {
                "id": 101, 
                "name": "Gym Rat Gary",
                "zip": "53809", # Fennimore
                "lat": 42.98, "lon": -90.65,
                "last_order_date": (datetime.now() - timedelta(days=28)).strftime("%Y-%m-%d"),
                "last_skus": ["HTP-1TEST"]
            },
            {
                "id": 102,
                "name": "Milwaukee Mike",
                "zip": "53202", # Milwaukee (Far)
                "lat": 43.03, "lon": -87.90,
                "last_order_date": (datetime.now() - timedelta(days=40)).strftime("%Y-%m-%d"),
                "last_skus": ["HTP-LIPO"]
            }
        ]

        for subject in test_subjects:
            print(f"\nAnalyzing Subject: {subject['name']}")
            tags = self.process_customer(subject)
            if tags:
                print(f"✅ APPLIED TAGS: {tags}")
                print(f"   -> Triggered Automation: {[t.split(':')[0] for t in tags]}")
            else:
                print("❌ No Resonance Detected.")

if __name__ == "__main__":
    # In production, pass the token: KappaEngine(os.getenv("SHOPIFY_TOKEN"))
    engine = KappaEngine() 
    engine.run_simulation()
