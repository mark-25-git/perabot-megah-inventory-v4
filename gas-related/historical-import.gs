/**
 * HISTORICAL IMPORT SCRIPT (Standalone)
 * - Parses summarized CSV (Date, SKU, Quantity, Mode, ...)
 * - Computes Inventory Snapshot and Sales Snapshot using rules compatible
 *   with existing backend, but SKIPS Last7Days/Last30Days and TodaySales.
 * - Writes results to a NEW spreadsheet (safe for copy/paste into main)
 * - Provides dry-run preview.
 */

/*************************************************
 * CONFIG
 *************************************************/
var SOURCE_CSV_FILE_ID = ""; // Set Drive file ID of the CSV to import (optional if using paste API)
var OUTPUT_SPREADSHEET_NAME = "Historical Import Output"; // A new Spreadsheet will be created

// Default assumptions since CSV lacks locations
var DEFAULT_SALE_SOURCE_LOCATION = "Shop";       // Sales are treated as from Shop
var DEFAULT_RECEIVING_DEST_LOCATION = "Warehouse"; // Receiving goes into Warehouse

// Thresholds (match existing heuristics)
var LOW_STOCK_THRESHOLD = 20; // Yellow if 1..19, Red if 0

/*************************************************
 * ENTRY POINTS
 *************************************************/
function runHistoricalImportFromDriveCsv() {
  if (!SOURCE_CSV_FILE_ID) {
    throw new Error("Please set SOURCE_CSV_FILE_ID to the Drive file ID of your CSV.");
  }
  var csvText = DriveApp.getFileById(SOURCE_CSV_FILE_ID).getBlob().getDataAsString();
  return runHistoricalImport(csvText);
}

function runHistoricalImportFromPaste(csvText) {
  if (!csvText || typeof csvText !== "string") {
    throw new Error("Please pass CSV text to runHistoricalImportFromPaste(csvText)");
  }
  return runHistoricalImport(csvText);
}

function dryRunHistoricalImportFromDriveCsv() {
  if (!SOURCE_CSV_FILE_ID) {
    throw new Error("Please set SOURCE_CSV_FILE_ID to the Drive file ID of your CSV.");
  }
  var csvText = DriveApp.getFileById(SOURCE_CSV_FILE_ID).getBlob().getDataAsString();
  return dryRunHistoricalImport(csvText);
}

function dryRunHistoricalImportFromPaste(csvText) {
  if (!csvText || typeof csvText !== "string") {
    throw new Error("Please pass CSV text to dryRunHistoricalImportFromPaste(csvText)");
  }
  return dryRunHistoricalImport(csvText);
}

/*************************************************
 * CORE
 *************************************************/
function runHistoricalImport(csvText) {
  var rows = parseCsv(csvText);
  var normalized = normalizeRecords(rows);
  var computed = computeSnapshots(normalized);
  var ss = SpreadsheetApp.create(OUTPUT_SPREADSHEET_NAME + " - " + new Date().toISOString());
  writeOutputs(ss, computed);
  return {
    status: "success",
    spreadsheetUrl: ss.getUrl(),
    inventoryCount: Object.keys(computed.inventorySnapshot).length,
    salesCount: Object.keys(computed.salesSnapshot).length
  };
}

function dryRunHistoricalImport(csvText) {
  var rows = parseCsv(csvText);
  var normalized = normalizeRecords(rows);
  var computed = computeSnapshots(normalized);
  return {
    status: "success",
    preview: {
      inventorySample: previewFirstN(Object.values(computed.inventorySnapshot), 10),
      salesSample: previewFirstN(Object.values(computed.salesSnapshot), 10)
    },
    totals: {
      inventoryCount: Object.keys(computed.inventorySnapshot).length,
      salesCount: Object.keys(computed.salesSnapshot).length
    }
  };
}

/*************************************************
 * PARSING / NORMALIZATION
 *************************************************/
function parseCsv(csvText) {
  // Expected headers example: Date,SKU,Quantity,Mode,cost,start date
  var data = Utilities.parseCsv(csvText);
  if (!data || data.length === 0) return [];
  var headers = (data[0] || []).map(function (h) { return String(h || "").trim(); });
  var rows = [];
  for (var i = 1; i < data.length; i++) {
    if (!data[i] || data[i].length === 0) continue;
    var obj = {};
    headers.forEach(function (h, idx) {
      obj[h] = data[i][idx];
    });
    // Skip blank separator lines
    var nonEmpty = Object.keys(obj).some(function (k) { return String(obj[k] || "").trim() !== ""; });
    if (nonEmpty) rows.push(obj);
  }
  return rows;
}

function normalizeRecords(rows) {
  // Output a uniform structure expected by computeSnapshots
  // { date: Date, sku: string, qty: number, mode: 'SALE'|'RECEIVING', source: string, destination: string, price?: number }
  var normalized = [];
  rows.forEach(function (r) {
    var mode = String(r.Mode || r.mode || "").toUpperCase();
    if (!mode || (mode !== "SALE" && mode !== "RECEIVING")) return; // skip unsupported

    var sku = String(r.SKU || r.sku || "").trim();
    if (!sku) return;

    var qty = parseFloat(r.Quantity || r.qty || 0) || 0;
    if (qty <= 0) return;

    var date = parseFlexibleDate(r.Date || r.date || "");

    // Optional unit cost/price if given; we don't overwrite Product Master here, but keep for value hints
    var price = r.cost ? parseFloat(r.cost) || 0 : null;

    if (mode === "SALE") {
      normalized.push({
        date: date,
        sku: sku,
        qty: qty,
        mode: "SALE",
        source: DEFAULT_SALE_SOURCE_LOCATION,
        destination: "",
        price: price
      });
    } else if (mode === "RECEIVING") {
      normalized.push({
        date: date,
        sku: sku,
        qty: qty,
        mode: "RECEIVING",
        source: "",
        destination: DEFAULT_RECEIVING_DEST_LOCATION,
        price: price
      });
    }
  });
  return normalized;
}

function parseFlexibleDate(value) {
  // Support dd/MM/yyyy or yyyy-MM-dd or Sheets Date
  if (value instanceof Date) return value;
  var s = String(value || "").trim();
  if (!s) return new Date();
  // Try dd/MM/yyyy
  var m = s.match(/^([0-3]?\d)\/(0?\d|1[0-2])\/(\d{4})$/);
  if (m) {
    return new Date(parseInt(m[3], 10), parseInt(m[2], 10) - 1, parseInt(m[1], 10));
  }
  // Try Date.parse
  var t = Date.parse(s);
  if (!isNaN(t)) return new Date(t);
  return new Date();
}

/*************************************************
 * COMPUTATION (compatible with existing rules, historical-safe)
 *************************************************/
function computeSnapshots(records) {
  var inventory = {}; // key: SKU|Location
  var sales = {};     // key: SKU

  // Accumulate inventory stock changes and sales totals
  records.forEach(function (rec) {
    var qty = Number(rec.qty) || 0;
    var sku = rec.sku;
    var ts = rec.date || new Date();

    if (rec.mode === "RECEIVING") {
      var destKey = sku + "|" + (rec.destination || DEFAULT_RECEIVING_DEST_LOCATION);
      if (!inventory[destKey]) inventory[destKey] = newInventoryRow(destKey, sku, rec.destination || DEFAULT_RECEIVING_DEST_LOCATION);
      inventory[destKey].CurrentStock += qty;
      inventory[destKey].LastUpdated = ts;
    } else if (rec.mode === "SALE") {
      // Inventory (decrement at source, e.g., Shop)
      var sourceKey = sku + "|" + (rec.source || DEFAULT_SALE_SOURCE_LOCATION);
      if (!inventory[sourceKey]) inventory[sourceKey] = newInventoryRow(sourceKey, sku, rec.source || DEFAULT_SALE_SOURCE_LOCATION);
      inventory[sourceKey].CurrentStock -= qty;
      inventory[sourceKey].LastUpdated = ts;

      // Sales (cumulative only; skip rolling windows and TodaySales)
      if (!sales[sku]) sales[sku] = newSalesRow(sku);
      sales[sku].TotalSold += qty;
      sales[sku].LastSoldDate = moreRecentDate(sales[sku].LastSoldDate, ts);
    }
  });

  // Calculate InventoryValue and StockStatus (Price looked up later by user sheet; here set 0)
  Object.keys(inventory).forEach(function (key) {
    var row = inventory[key];
    var stockLevel = Number(row.CurrentStock) || 0;
    row.InventoryValue = 0; // Keep 0; user can paste and let backend fill via Product Master or edit later
    if (stockLevel === 0) {
      row.StockStatus = "Red";
    } else if (stockLevel < LOW_STOCK_THRESHOLD) {
      row.StockStatus = "Yellow";
    } else {
      row.StockStatus = "Green";
    }
  });

  // Derive DaysSinceLastSale for Shop rows only, using LastSoldDate from sales snapshot
  Object.keys(inventory).forEach(function (key) {
    var row = inventory[key];
    if (row.Location === DEFAULT_SALE_SOURCE_LOCATION) {
      var s = sales[row.SKU];
      if (s && s.LastSoldDate) {
        var days = Math.floor((new Date() - s.LastSoldDate) / (1000 * 60 * 60 * 24));
        row.DaysSinceLastSale = days;
      } else {
        row.DaysSinceLastSale = "";
      }
    } else {
      row.DaysSinceLastSale = "";
    }
  });

  // Complete Sales calculated columns (CumulativeValue, TopSellerRank)
  // We cannot compute value without price; set 0, compute rank based on TotalSold descending
  var salesArray = Object.keys(sales).map(function (sku) { return sales[sku]; });
  salesArray.sort(function (a, b) { return (b.TotalSold || 0) - (a.TotalSold || 0); });
  salesArray.forEach(function (rec, idx) {
    rec.CumulativeValue = 0; // price unavailable here
    rec.TopSellerRank = idx < 10 ? String(idx + 1) : "";
  });
  // Map back ranks
  salesArray.forEach(function (rec) { sales[rec.SKU] = rec; });

  return {
    inventorySnapshot: inventory,
    salesSnapshot: sales
  };
}

function newInventoryRow(snapshotId, sku, location) {
  return {
    SnapshotID: snapshotId,
    SKU: sku,
    Location: location,
    CurrentStock: 0,
    LastUpdated: new Date(),
    InventoryValue: 0,
    DaysSinceLastSale: "",
    StockStatus: "Green",
    Last7DaysSales: 0 // left 0; historical import does not simulate rolling windows
  };
}

function newSalesRow(sku) {
  return {
    SnapshotID: sku,
    SKU: sku,
    TotalSold: 0,
    Last7Days: 0,
    Last30Days: 0,
    LastSoldDate: null,
    LastUpdated: new Date(),
    TodaySales: 0,
    CumulativeValue: 0,
    TopSellerRank: ""
  };
}

function moreRecentDate(a, b) {
  if (!a) return b;
  if (!b) return a;
  return a > b ? a : b;
}

/*************************************************
 * OUTPUT
 *************************************************/
function writeOutputs(ss, computed) {
  var invSheet = ss.insertSheet("Inventory Snapshot");
  var salesSheet = ss.insertSheet("Sales Snapshot");

  // Clear the default first sheet created by Sheets
  var first = ss.getSheets()[0];
  if (first && first.getName() === "Sheet1") ss.deleteSheet(first);

  // Inventory Snapshot headers
  var invHeaders = [
    "SnapshotID","SKU","Location","CurrentStock","LastUpdated","InventoryValue","DaysSinceLastSale","StockStatus","Last7DaysSales"
  ];
  invSheet.clearContents();
  invSheet.appendRow(invHeaders);
  var invRows = Object.keys(computed.inventorySnapshot).map(function (key) {
    var r = computed.inventorySnapshot[key];
    return [
      r.SnapshotID, r.SKU, r.Location, r.CurrentStock, r.LastUpdated, r.InventoryValue, r.DaysSinceLastSale, r.StockStatus, r.Last7DaysSales
    ];
  });
  if (invRows.length > 0) invSheet.getRange(2, 1, invRows.length, invHeaders.length).setValues(invRows);

  // Sales Snapshot headers
  var salesHeaders = [
    "SnapshotID","SKU","TotalSold","Last7Days","Last30Days","LastSoldDate","LastUpdated","TodaySales","CumulativeValue","TopSellerRank"
  ];
  salesSheet.clearContents();
  salesSheet.appendRow(salesHeaders);
  var salesRows = Object.keys(computed.salesSnapshot).map(function (sku) {
    var r = computed.salesSnapshot[sku];
    return [
      r.SnapshotID, r.SKU, r.TotalSold, r.Last7Days, r.Last30Days, r.LastSoldDate, r.LastUpdated, r.TodaySales, r.CumulativeValue, r.TopSellerRank
    ];
  });
  if (salesRows.length > 0) salesSheet.getRange(2, 1, salesRows.length, salesHeaders.length).setValues(salesRows);
}

/*************************************************
 * UTILS
 *************************************************/
function previewFirstN(arr, n) {
  var out = [];
  for (var i = 0; i < arr.length && i < n; i++) out.push(arr[i]);
  return out;
}



