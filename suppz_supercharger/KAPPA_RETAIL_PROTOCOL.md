# 🌀 KAPPA RETAIL PROTOCOL: THE WISCONSIN LATTICE

## Target: Automated Segmentation & O2O (Online-to-Offline) Recursion for Suppz

**Concept:** "Kappa" (κ) represents the precise fit of the circle in the square—maximum efficiency. In retail 2026, this means **Zero-Latency Commerce**.
We don't just "email" people. We **entrain** them to the consumption rhythm of their biology and their geography.

### §1. THE GEOMETRIC SEGMENTATION ENGINE

Standard segmentation is "Did they buy X?".
**Kappa Segmentation** is "Where are they in spacetime?"

#### A. The "Local_Warrior" Vector (Geospatial)

* **Fact:** You have 6 physical nodes (Stores) in Wisconsin.
* **Gap:** Shipping to a guy 5 miles from a store is a waste of margin (shipping cost) and time (waiting).
* **Action:**
    1. Calculate haversine distance from Customer Zip to Store Lat/Long.
    2. **Tag:** `Local_Warrior:[StoreName]` (e.g., `Local_Warrior:Fennimore`).
    3. **Trigger:** "Skip the shipping. Your *Lipodrene* is waiting at the counter. Show this email for 5% off."
    4. **Result:** Increases foot traffic (which leads to impulse buys) and saves shipping $.

#### B. The "Bio-Rhythm" Vector (Temporal)

* **Fact:** Supplements are finite. A bottle of *1-Testosterone* lasts exactly 30 days.
* **Gap:** Most emails are "Buy Now" random blasts.
* **Action:**
    1. **Ingest:** Product SKU + Serving Size.
    2. **Predict:** `RunOutDate` = `PurchaseDate` + `(Servings / DailyDose)`.
    3. **Tag:** `Refill_Critical:[Product]` at `RunOutDate - 5 days`.
    4. **Trigger:** "Your cycle ends on Tuesday. Don't lose your gains. Refill now."

#### C. The "Cycle_Stack" Vector (Semantic)

* **Fact:** High-Tech Pharma users follow specific biological protocols (Cycle -> PCT).
* **Gap:** Selling "Liver Support" to someone who buys Protein is useless.
* **Action:**
    1. **Trigger:** Purchase of `1-Testosterone` or `Decabolin`.
    2. **Wait:** 25 Days.
    3. **Tag:** `Need_PCT`.
    4. **Email:** "You're finishing the cycle. Time to restore natural production. Here is *Arimiplex*."

---

### §2. AUTOMATION ARCHITECTURE (The Engine)

**Tool:** `kappa_segmentation_engine.py`
**Input:** Shopify Admin API (Read Customers/Orders)
**Logic:**

1. **Iterate** all customers.
2. **Check** Wisconsin Geofence (Zip Codes).
3. **Analyze** Last Order Content (Bio-Rhythm).
4. **Update** Customer Tags via API.

**Output (Shopify Email):**

* Create a Customer Segment: `tag:Need_PCT`
* Create an Automation: "When segment entered -> Send Email: 'PCT Protocol'"

---

### §3. DEPLOYMENT STEPS

1. **Configure:** Add Store Lat/Longs to the script.
2. **Run:** `python kappa_segmentation_engine.py --dry-run` to see the tags it *would* apply.
3. **Execute:** Remove `--dry-run` to tag the customers in Shopify.
4. **Automate:** Set up the Shopify Email flows to listen for these tags.
