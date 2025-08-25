**Perabot Megah Dashboard Layout (Refined)**

### **Header**

* **Title:** Perabot Megah Dashboard
* **Date & Time of Last Update** 

---

## **Section 1: Overview**

**Purpose:** Quick glance at sales + stock health.

* **KPI Cards:**

  * Total Sales Today (Shop only) → from *Sales Snapshot*
  * Units Sold Today (Shop only) → from *Sales Snapshot*
  * Total Inventory Value (RM) = Σ(CurrentStock × Price) → *Inventory Snapshot + Product Master*
  * Number of Out-of-Stock SKUs → from *Inventory Snapshot*
* **Sales Trend (Toggle 7/30 Days):**

  * Line chart with 2 metrics: Sales (RM) & Units Sold → from *Sales Snapshot*

---

## **Section 2: Shop Information**

**Purpose:** Monitor daily sales & shop stock status.

* **Top 5 Selling SKUs Today**

  * Donut chart, breakdown by SKU
  * “Category 6 = Other”
  * Labels = SKU + Qty Sold
* **Cumulative Sales by SKU**

  * Table: SKU | Product Name | Total Units Sold | Total Sales Value
  * Sorted by Total Sales (descending)
  * Search/filter bar for quick lookup
* **Shop Inventory + Low Stock Alerts** (merged table)

  * Table: SKU | Product Name | Current Stock | Last 7 Days Sales | Status
  * Conditional formatting:

    * Red = Out of Stock
    * Yellow = Low Stock (<20)
    * Green = Healthy

---

## **Section 3: Warehouse**

**Purpose:** Monitor warehouse inventory & stock movement.

* **Warehouse Inventory + Low Stock Alerts** (merged table)

  * Table: SKU | Product Name | Current Stock | Last 7 Days Sales | Status
  * Same conditional formatting as Shop
* **Stock Movement (Last 30 Days)**

  * Summary (counts by Mode: In, Out, Transfer, Adjustment) → from *Inventory Log*
  * Expandable detail table: TransactionID | Timestamp | SKU | Quantity | Mode | Source | Destination | User | Notes

---

## **Section 4: Dead Stock (No Sales in 14+ Days)**

**Purpose:** Identify stock tying up cash without selling.

* **Table:** SKU | Product Name | Current Stock | Days Since Last Sale

  * Derived from *Inventory Snapshot* + *Sales Snapshot.LastSoldDate*
* **Optional Bar Chart:** Current Stock vs Days Since Last Sale (visual spotting of problem SKUs)

---

## 🔑 Notes on Implementation

* **Join Key:** All sheets joined via `SKU`.
* **Update Frequency:** Daily (manual refresh or automated).
* **User Experience:**

  * Filters: Date range, SKU, Location
  * Conditional formatting for alerts
  * Tables searchable and scrollable

---

👉 This refined layout keeps your **4-section flow**, avoids duplication, and makes the dashboard both **action-oriented** (alerts, bestsellers at risk) and **investigative** (drill-down into logs).

