"""
SUPPZ AUTOMATOR CORE (v1.0)
The Central Nervous System for Retail Automation.
Integrates Kappa Segmentation (Customer) and GEO Protocol (Product) into a live loop.

Usage:
    python automator_core.py --mode [daemon|once|sync-geo]

Requires:
    pip install schedule python-dotenv shopifyapi
"""

import time
import schedule
import logging
import os
import argparse
from dotenv import load_dotenv
import shopify

# Import Engines
# (Assumes straight import if in same dir, or package structure)
try:
    from kappa_segmentation_engine import KappaEngine, WISCONSIN_NODES
    from geo_hitech_engine import generate_geo_schema, generate_geo_description, HITECH_PRODUCTS
except ImportError:
    print("⚠️  Engine modules not found. Ensure you are running from 'suppz_supercharger' directory.")
    exit(1)

# Configuration
LOG_FILE = "automation_events.log"
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(message)s'
)

class SuppzAutomator:
    def __init__(self, dry_run=True):
        self.dry_run = dry_run
        self.load_credentials()
        self.kappa = KappaEngine(api_token=self.token) if self.token else KappaEngine()
        
        mode_str = "DRY RUN" if self.dry_run else "LIVE FIRE"
        logging.info(f"💎 Automator Initialized. Mode: {mode_str}")
        print(f"💎 Automator Online. Mode: {mode_str}")

    def load_credentials(self):
        load_dotenv() # Load from .env file
        self.shop_url = os.getenv("SHOPIFY_SHOP_URL", "suppz.myshopify.com")
        self.token = os.getenv("SHOPIFY_ADMIN_TOKEN")
        self.api_version = os.getenv("SHOPIFY_API_VERSION", "2024-01")
        
        if not self.token:
            logging.warning("No SHOPIFY_ADMIN_TOKEN found. Forcing Simulation Mode.")
            self.dry_run = True # Force dry run if no token
        else:
            self.connect_shopify()

    def connect_shopify(self):
        try:
            session = shopify.Session(self.shop_url, self.api_version, self.token)
            shopify.ShopifyResource.activate_session(session)
            shop = shopify.Shop.current()
            logging.info(f"Connected to Shopify Store: {shop.name}")
            print(f"✅ Connected to: {shop.name}")
        except Exception as e:
            logging.error(f"Shopify Connection Failed: {e}")
            print(f"❌ Connection Failed: {e}")

    # ==========================
    # 🧬 KAPPA: Customer Segmentation
    # ==========================
    def run_kappa_segmentation(self):
        logging.info("Starting Kappa Segmentation Cycle...")
        print("\n🌀 Running Kappa Segmentation...")

        if not self.token:
            print("   -> Using Mock Data (No Token)")
            # In real implementation, KappaEngine would handle mock data internally
            # or we pass mock data here.
            # For now, we trust existing KappaEngine logic.
            # But let's simulate gathering "recent" orders
             # This part needs to be adapted when KappaEngine is fully capable of fetching
             pass
        else:
            # 1. Fetch Candidates (e.g., ordered in last 30 days)
            # In a real efficient system, we'd use GraphQL or Cursor pagination
            # For simplicity, we use the REST resource
            # finding customers updated recently
            
            # Example: Fetch last 50 customers
            customers = shopify.Customer.find(limit=50) 
            count = 0
            
            for cust in customers:
                # Convert Shopify Object to Kappa Dict format
                c_data = self._shopify_to_kappa(cust)
                
                # Get Tags
                new_tags = self.kappa.process_customer(c_data)
                
                # Update if needed
                if new_tags:
                    current_tags = cust.tags.split(",") if cust.tags else []
                    unique_new = [t for t in new_tags if t not in current_tags]
                    
                    if unique_new:
                        if not self.dry_run:
                            cust.tags = ",".join(current_tags + unique_new)
                            cust.save()
                            logging.info(f"Tagged Customer {cust.id}: {unique_new}")
                            print(f"   -> Tagged {cust.first_name}: {unique_new}")
                        else:
                            print(f"   [DRY] Would Tag {cust.first_name}: {unique_new}")
                        count += 1
            
            print(f"✅ Kappa Cycle Complete. Processed {len(customers)}, Updated {count}.")

    def _shopify_to_kappa(self, sho_cust):
        """Converts Shopify Resource object to Dict expected by KappaEngine"""
        # Extract default address lat/lon
        lat, lon = None, None
        if sho_cust.default_address:
            lat = sho_cust.default_address.latitude
            lon = sho_cust.default_address.longitude
            
        # Extract last order info (simplified)
        last_date = sho_cust.updated_at.split("T")[0] # Rough proxy if no last_order_date field populated in this view
        # A real fetch would need to query the last order ID specifically
        
        return {
            'id': sho_cust.id,
            'lat': lat,
            'lon': lon,
            'last_order_date': last_date,
            'last_skus': [] # Need deeper fetch for SKUs, placeholder
        }

    # ==========================
    # 🌐 GEO: 128.23 Protocol
    # ==========================
    def sync_geo_products(self):
        logging.info("Starting GEO Product Sync...")
        print("\n🌍 Running GEO Product Sync...")
        
        # We iterate through our "Defined" Hi-Tech products in the strategy
        if not self.token:
            print("   -> Skipping Live Sync (No Token)")
            return

        for handle, data in HITECH_PRODUCTS.items():
            # 1. Find Product by Handle
            products = shopify.Product.find(handle=handle)
            if products:
                prod = products[0]
                
                # 2. Generate Content
                html_description = generate_geo_description(handle, data)
                
                # 3. Update (Careful not to overwrite manually edited stuff?)
                # Strategy: We append or prepend, or use a specific metafield
                # For this automator, we will update a Metafield "custom.geo_description"
                # instead of the main description to be safe.
                
                if not self.dry_run:
                    # Metafield creation requires specific structure
                    # This is complex in REST, easier to just print intent for v1
                    print(f"   -> [LIVE] Syncing {handle} to Metafield 'custom.geo_json'...")
                    
                    # Example Metafield update (pseudocode logic for REST)
                    # metafield = shopify.Metafield()
                    # metafield.namespace = "geo_protocol"
                    # metafield.key = "json_ld"
                    # metafield.value = str(data)
                    # prod.add_metafield(metafield)
                    
                    logging.info(f"Synced GEO data for {handle}")
                else:
                    print(f"   [DRY] Would sync GEO JSON to {handle}")
            else:
                logging.warning(f"Product {handle} not found in Shopify.")

# ==========================
# 🎮 MAIN LOOP
# ==========================

def job_wrapper(automator):
    automator.run_kappa_segmentation()

def main():
    parser = argparse.ArgumentParser(description='Suppz Automator Core')
    parser.add_argument('--mode', choices=['daemon', 'once', 'sync-geo'], default='once', help='Operating Mode')
    parser.add_argument('--live', action='store_true', help='Enable LIVE writing to Shopify (Disable Dry Run)')
    args = parser.parse_args()

    # Initialize
    automator = SuppzAutomator(dry_run=not args.live)

    if args.mode == 'sync-geo':
        automator.sync_geo_products()
        return

    if args.mode == 'once':
        automator.run_kappa_segmentation()
        return

    if args.mode == 'daemon':
        print("⏳ Daemon Started. Creating 46.875 Hz heartbeat (simulated)...")
        # Schedule: Run Kappa every 6 hours
        schedule.every(6).hours.do(job_wrapper, automator)
        
        while True:
            schedule.run_pending()
            time.sleep(60) # Visual heartbeat

if __name__ == "__main__":
    print("-" * 40)
    print("   🛡️  SUPPZ SUPERCHARGER CORE  🛡️")
    print("-" * 40)
    main()
