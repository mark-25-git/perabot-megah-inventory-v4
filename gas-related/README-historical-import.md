# Historical Import (Standalone)

This standalone Google Apps Script lets you import summarized historical records (one total per SKU) and produce complete snapshots into a NEW spreadsheet. It does NOT modify your existing backend or current Sheets.

What it does:
- Parses CSV with columns like: `Date,SKU,Quantity,Mode,cost,start date`.
- Supports `SALE` and `RECEIVING`.
- Computes Inventory Snapshot and Sales Snapshot using rules compatible with your backend, but:
  - Skips `Last7Days`, `Last30Days`, `TodaySales` (historical imports should not affect rolling windows).
  - Keeps `InventoryValue` and `CumulativeValue` as 0 here; your main backend can recompute from Product Master after you paste.
- Outputs to a brand new spreadsheet for safe copy/paste.

Files:
- `gas-related/historical-import.gs`

## Setup
1) Open `Apps Script` (can be a new project). Copy the contents of `gas-related/historical-import.gs` into the editor.
2) If you want to load from Drive, set:
   - `SOURCE_CSV_FILE_ID` to your uploaded CSV file ID.
   Or call the paste-based function with your CSV text.

Default assumptions (editable in the script):
- Sales come from `Shop` (`DEFAULT_SALE_SOURCE_LOCATION`).
- Receiving goes to `Warehouse` (`DEFAULT_RECEIVING_DEST_LOCATION`).

## Usage

Option A: From Drive file ID
- Run `runHistoricalImportFromDriveCsv()`
- It creates a new spreadsheet named `Historical Import Output - <timestamp>`
- Returns the URL in the execution log / response.

Option B: Paste CSV text
- Run `dryRunHistoricalImportFromPaste(csvText)` to preview counts and samples.
- Run `runHistoricalImportFromPaste(csvText)` to generate the output spreadsheet.

CSV example header:
```
Date,SKU,Quantity,Mode,cost,start date
```

Notes:
- Blank separator rows are ignored.
- Modes accepted: `SALE`, `RECEIVING`.
- Dates support `dd/MM/yyyy`, ISO strings, or native Date.

## Output Structure
- Sheet `Inventory Snapshot` with headers:
  `SnapshotID,SKU,Location,CurrentStock,LastUpdated,InventoryValue,DaysSinceLastSale,StockStatus,Last7DaysSales`
- Sheet `Sales Snapshot` with headers:
  `SnapshotID,SKU,TotalSold,Last7Days,Last30Days,LastSoldDate,LastUpdated,TodaySales,CumulativeValue,TopSellerRank`

You can copy/paste these into your main workbook’s sheets. After pasting, your existing backend can recompute price-based fields and rolling windows as needed.

## Dry Run
Use `dryRunHistoricalImportFromDriveCsv()` or `dryRunHistoricalImportFromPaste(csvText)` to preview:
- Sample rows for inventory and sales
- Totals per snapshot

## Safety
- Prevents changing your main data; output goes to a new spreadsheet only.
- Rolling windows and TodaySales are intentionally left at zero.

## Customization
- Change default locations.
- If you have known unit prices during import, you can extend `computeSnapshots` to multiply `TotalSold`/`CurrentStock` appropriately, but we recommend letting the main backend compute values from `Product Master` after paste for consistency.


