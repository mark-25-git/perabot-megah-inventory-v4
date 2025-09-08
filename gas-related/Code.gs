/*************************************************
 * CONFIG
 *************************************************/
var SPREADSHEET_ID = "1t8eqdoMh9_1l6DnvD_tqagMWWz0Ctci-_0nz4tqP86g";
var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

var logSheet = ss.getSheetByName("Inventory Log");
var snapshotSheet = ss.getSheetByName("Inventory Snapshot");
var salesSnapshotSheet = ss.getSheetByName("Sales Snapshot");
var productMasterSheet = ss.getSheetByName("Product Master");

/*************************************************
 * GLOBAL LOG COLLECTION
 *************************************************/
var debugLogs = [];

function addLog(message) {
  var timestamp = new Date().toISOString();
  var logEntry = timestamp + " - " + message;
  Logger.log(logEntry);
  debugLogs.push(logEntry);
}

function getLogs() {
  return debugLogs;
}

function clearLogs() {
  debugLogs = [];
}

/*************************************************
 * API ENTRY POINT
 *************************************************/
function doGet(e) {
  var action = e.parameter.action;

  if (action === "getInventorySnapshot") return sendJSON(getInventorySnapshotData());
  if (action === "getSalesSnapshot") return sendJSON(getSalesSnapshotData());
  if (action === "getProducts") return sendJSON(getProductMasterData());
  if (action === "addInventoryLog") return addInventoryLog(e);
  if (action === "testSheets") return sendJSON(testSheetConnections());
  if (action === "resetTodaySales") return sendJSON(resetTodaySales());
  if (action === "setupDailyReset") return sendJSON(setupDailyReset());
  if (action === "updateSnapshots") return sendJSON(updateSnapshots());
  if (action === "testSalesOperation") return sendJSON(testSalesOperation());
  if (action === "testSalesSnapshotStructure") return sendJSON(testSalesSnapshotStructure());
  if (action === "fixCorruptedTodaySales") return sendJSON(fixCorruptedTodaySales());
  if (action === "getLogs") return sendJSON({status:"success", logs: getLogs()});
  if (action === "clearLogs") {
    clearLogs();
    return sendJSON({status:"success", message:"Logs cleared"});
  }

  return sendJSON({status:"error", message:"Unknown action"});
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;

    if (action === "addTransaction") {
      return sendJSON(addTransaction(data));
    }

    return sendJSON({status:"error", message:"Invalid POST action"});
  } catch (error) {
    addLog("Error in doPost: " + error.toString());
    return sendJSON({status:"error", message:"Invalid JSON data"});
  }
}

/*************************************************
 * HELPERS
 *************************************************/
function sendJSON(obj) {
  return ContentService.createTextOutput(
    JSON.stringify(obj)
  ).setMimeType(ContentService.MimeType.JSON);
}

function formatDateForSheet(date) {
  if (!date) return new Date();
  
  // If it's already a Date object, use it; otherwise create one
  var dateObj = date instanceof Date ? date : new Date(date);
  var today = new Date();
  
  // If the date is today, use current time; otherwise use 08:00:00
  var hours, minutes, seconds;
  if (dateObj.toDateString() === today.toDateString()) {
    // Use current time for today's date
    hours = String(today.getHours()).padStart(2, '0');
    minutes = String(today.getMinutes()).padStart(2, '0');
    seconds = String(today.getSeconds()).padStart(2, '0');
  } else {
    // Use 08:00:00 for backdated dates
    hours = '08';
    minutes = '00';
    seconds = '00';
  }
  
  // Format date part
  var day = String(dateObj.getDate()).padStart(2, '0');
  var month = String(dateObj.getMonth() + 1).padStart(2, '0');
  var year = dateObj.getFullYear();
  
  return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
}

function getSheetData(sheet) {
  if (!sheet) return [];
  var range = sheet.getDataRange();
  var values = range.getValues();
  if (values.length === 0) return [];
  
  var headers = values.shift();
  return values.map(function (row) {
    var obj = {};
    headers.forEach(function (h, i) {
      obj[h] = row[i];
    });
    return obj;
  });
}

/*************************************************
 * TEST SHEET CONNECTIONS
 *************************************************/
function testSheetConnections() {
  addLog("Testing sheet connections...");
  
  var results = {
    logSheet: logSheet ? "Connected" : "NULL - Check sheet name 'Inventory Log'",
    snapshotSheet: snapshotSheet ? "Connected" : "NULL - Check sheet name 'Inventory Snapshot'",
    salesSnapshotSheet: salesSnapshotSheet ? "Connected" : "NULL - Check sheet name 'Sales Snapshot'",
    productMasterSheet: productMasterSheet ? "Connected" : "NULL - Check sheet name 'Product Master'"
  };
  
  if (logSheet) addLog("Inventory Log sheet has " + logSheet.getLastRow() + " rows");
  if (snapshotSheet) addLog("Inventory Snapshot sheet has " + snapshotSheet.getLastRow() + " rows");
  if (salesSnapshotSheet) addLog("Sales Snapshot sheet has " + salesSnapshotSheet.getLastRow() + " rows");
  if (productMasterSheet) addLog("Product Master sheet has " + productMasterSheet.getLastRow() + " rows");
  
  return {
    status: "success", 
    message: "Sheet connection test completed",
    results: results,
    logs: getLogs()
  };
}

/*************************************************
 * INVENTORY SNAPSHOT
 *************************************************/
function getInventorySnapshotData() {
  if (!snapshotSheet) return {status:"error", message:"Inventory Snapshot sheet not found"};
  
  try {
    var data = getSheetData(snapshotSheet);
    addLog("Retrieved " + data.length + " inventory snapshot records");
    return {status:"success", data: data, count: data.length};
  } catch (error) {
    addLog("Error getting inventory snapshot: " + error.toString());
    return {status:"error", message:"Failed to retrieve inventory snapshot"};
  }
}

/*************************************************
 * SALES SNAPSHOT
 *************************************************/
function getSalesSnapshotData() {
  if (!salesSnapshotSheet) return {status:"error", message:"Sales Snapshot sheet not found"};
  
  try {
    var data = getSheetData(salesSnapshotSheet);
    addLog("Retrieved " + data.length + " sales snapshot records");
    return {status:"success", data: data, count: data.length};
  } catch (error) {
    addLog("Error getting sales snapshot: " + error.toString());
    return {status:"error", message:"Failed to retrieve sales snapshot"};
  }
}

/*************************************************
 * PRODUCT MASTER
 *************************************************/
function getProductMasterData() {
  if (!productMasterSheet) return {status:"error", message:"Product Master sheet not found"};
  
  try {
    var data = getSheetData(productMasterSheet);
    var products = data.filter(product => product.SKU && String(product.SKU).trim() !== "");
    
    addLog("Retrieved " + products.length + " products from Product Master sheet");
    return {status:"success", data: products, count: products.length};
  } catch (error) {
    addLog("Error getting products: " + error.toString());
    return {status:"error", message:"Failed to retrieve products"};
  }
}

/*************************************************
 * ADD INVENTORY LOG (LEGACY SUPPORT)
 *************************************************/
function addInventoryLog(e) {
  addLog("addInventoryLog called with parameters: " + JSON.stringify(e.parameter));
  
  if (!logSheet) {
    addLog("ERROR: Inventory Log sheet not found");
    return sendJSON({status:"error", message:"Inventory Log sheet not found"});
  }

  var bulkData = e.parameter.data;
  if (!bulkData) {
    addLog("ERROR: No data parameter provided");
    return sendJSON({status:"error", message:"No data provided"});
  }

  var entries;
  try {
    entries = JSON.parse(bulkData);
    addLog("Parsed bulk data: " + JSON.stringify(entries));
  } catch(err) {
    addLog("ERROR: Failed to parse JSON: " + err.message);
    return sendJSON({status:"error", message:"Invalid JSON"});
  }

  var newLogRows = [];
  var inventoryUpdates = [];
  var salesUpdates = [];

  // Get current snapshot data to calculate ADJUSTMENT changes
  var currentInventoryMap = new Map();
  if (snapshotSheet) {
    var snapshotData = snapshotSheet.getDataRange().getValues();
    if (snapshotData.length > 1) {
      var headers = snapshotData.shift();
      var skuIndex = headers.indexOf("SKU");
      var locationIndex = headers.indexOf("Location");
      var stockIndex = headers.indexOf("CurrentStock");
      if (skuIndex !== -1 && locationIndex !== -1 && stockIndex !== -1) {
        snapshotData.forEach(function(row) {
          currentInventoryMap.set(row[skuIndex] + "|" + row[locationIndex], parseInt(row[stockIndex], 10) || 0);
        });
      }
    }
  }

  entries.forEach(function(item){
    var logQuantity = parseInt(item.quantity, 10) || 0;
    
    // For ADJUSTMENT mode, calculate the actual change needed and log that
    if (item.mode === 'ADJUSTMENT' && item.source && (item.source === 'Shop' || item.source === 'Warehouse')) {
      var currentStock = currentInventoryMap.has(item.sku + "|" + item.source) ? currentInventoryMap.get(item.sku + "|" + item.source) : 0;
      var newTotal = parseInt(item.quantity, 10) || 0;
      logQuantity = newTotal - currentStock;
      addLog("ADJUSTMENT: New total=" + newTotal + ", Current stock=" + currentStock + ", Log quantity=" + logQuantity);
    }
    
    var newRow = [
      Utilities.getUuid(),
      formatDateForSheet(item.timestamp || new Date()),
      item.sku || "",
      logQuantity,
      item.mode || "",
      item.source || "",
      item.destination || "",
      item.user || "",
      item.notes || ""
    ];
    newLogRows.push(newRow);

    // Prepare data for snapshot updates - FIXED: Properly structure updates
    if (item.mode === 'SALE') {
      // For sales, add to sales updates and inventory updates
      salesUpdates.push({
        sku: item.sku,
        qty: Math.abs(logQuantity), // Sales quantity (positive for calculations)
        timestamp: item.timestamp || new Date() // Use provided timestamp or current date
      });
      
      // Add inventory update for source location (decrease stock)
      inventoryUpdates.push({
        sku: item.sku,
        location: item.source,
        qty: -Math.abs(logQuantity) // Negative for sales (decrease stock)
      });
      
      addLog("SALE processed: SKU=" + item.sku + ", Qty=" + Math.abs(logQuantity) + ", Location=" + item.source);
      
    } else if (item.mode === 'TRANSFER') {
      // For transfers, decrease source and increase destination
      inventoryUpdates.push({
        sku: item.sku,
        location: item.source,
        qty: -Math.abs(logQuantity)
      });
      inventoryUpdates.push({
        sku: item.sku,
        location: item.destination,
        qty: Math.abs(logQuantity)
      });
      
    } else if (item.mode === 'RECEIVING') {
      // For receiving, increase destination location
      inventoryUpdates.push({
        sku: item.sku,
        location: item.destination,
        qty: Math.abs(logQuantity)
      });
      
    } else if (item.mode === 'ADJUSTMENT') {
      // For adjustments, set exact stock level
      inventoryUpdates.push({
        sku: item.sku,
        location: item.source,
        qty: logQuantity // This is the actual change needed
      });
    }
  });

  // Append all logs at once
  if (newLogRows.length > 0) {
    logSheet.getRange(logSheet.getLastRow() + 1, 1, newLogRows.length, newLogRows[0].length).setValues(newLogRows);
    addLog("Added " + newLogRows.length + " rows to Inventory Log sheet");
  }

  // FIXED: Update snapshots with proper data
  if (inventoryUpdates.length > 0) {
    addLog("Updating inventory snapshot with " + inventoryUpdates.length + " updates");
    updateInventorySnapshot(inventoryUpdates);
  }
  
  if (salesUpdates.length > 0) {
    addLog("Updating sales snapshot with " + salesUpdates.length + " updates");
    updateSalesSnapshot(salesUpdates);
    
    // Also update inventory sales fields for Shop locations
    addLog("Updating inventory sales fields");
    updateInventorySalesFields(salesUpdates);
  }

  addLog("addInventoryLog completed successfully");
  return sendJSON({status:"success", message:"Logs added and snapshots updated", count:newLogRows.length});
}

/*************************************************
 * UPDATE INVENTORY SNAPSHOT
 *************************************************/
function updateInventorySnapshot(inventoryUpdates) {
  if (!snapshotSheet) {
    addLog("ERROR: Inventory Snapshot sheet not found");
    return;
  }

  if (inventoryUpdates.length === 0) {
    addLog("No inventory updates to process.");
    return;
  }

  addLog("Starting updateInventorySnapshot with " + inventoryUpdates.length + " updates");

  var snapshotData = snapshotSheet.getDataRange().getValues();
  var headers = snapshotData.shift();
  var skuIndex = headers.indexOf("SKU");
  var locationIndex = headers.indexOf("Location");
  var stockIndex = headers.indexOf("CurrentStock");
  var updatedIndex = headers.indexOf("LastUpdated");
  
  if (skuIndex === -1 || locationIndex === -1 || stockIndex === -1 || updatedIndex === -1) {
    addLog("ERROR: Required columns not found in Inventory Snapshot.");
    return;
  }

  // Create a map of existing snapshot data
  var snapshotMap = new Map();
  snapshotData.forEach((row, i) => {
    var key = row[skuIndex] + "|" + row[locationIndex];
    snapshotMap.set(key, {
      stock: parseInt(row[stockIndex], 10) || 0, 
      rowIndex: i + 2,
      sku: row[skuIndex],
      location: row[locationIndex]
    });
  });

  // Process all inventory updates
  var pendingUpdates = new Map();
  inventoryUpdates.forEach(update => {
    var key = update.sku + "|" + update.location;
    var current = pendingUpdates.has(key) ? pendingUpdates.get(key) : {stock: snapshotMap.has(key) ? snapshotMap.get(key).stock : 0};
    current.stock += update.qty;
    current.sku = update.sku;
    current.location = update.location;
    pendingUpdates.set(key, current);
    
    addLog("Processing update: SKU=" + update.sku + ", Location=" + update.location + ", Change=" + update.qty + ", New Total=" + current.stock);
  });

  var rowsToUpdate = [];
  var rowsToAppend = [];
  
  pendingUpdates.forEach((data, key) => {
    var sku = data.sku;
    var location = data.location;
    var newStock = Math.max(0, data.stock); // Prevent negative stock
    
    var existingRecord = snapshotMap.get(key);
    
    if (existingRecord) {
      // Update existing row
      rowsToUpdate.push({
        rowIndex: existingRecord.rowIndex,
        values: [newStock, formatDateForSheet(new Date())]
      });
      addLog("Will update existing row for " + sku + " at " + location + ": Stock=" + newStock);
    } else {
      // Append new row - need to create full row data
      var newRow = [
        key, // SnapshotID
        sku, 
        location, 
        newStock, 
        formatDateForSheet(new Date()), // LastUpdated
        0, // InventoryValue (will be calculated later)
        "", // DaysSinceLastSale
        "Green", // StockStatus (will be calculated later)
        0 // Last7DaysSales (will be replaced with formula)
      ];
      rowsToAppend.push(newRow);
      addLog("Will append new row for " + sku + " at " + location + ": Stock=" + newStock);
    }
  });

  // Batch update existing rows
  if (rowsToUpdate.length > 0) {
    addLog("Updating " + rowsToUpdate.length + " existing rows");
    rowsToUpdate.forEach(row => {
      snapshotSheet.getRange(row.rowIndex, stockIndex + 1, 1, 2).setValues([row.values]);
    });
  }
  
  // Batch append new rows
  if (rowsToAppend.length > 0) {
    addLog("Appending " + rowsToAppend.length + " new rows");
    var startRow = snapshotSheet.getLastRow() + 1;
    snapshotSheet.getRange(startRow, 1, rowsToAppend.length, rowsToAppend[0].length).setValues(rowsToAppend);
    
    // Auto-fill Last7DaysSales formulas for new rows
    rowsToAppend.forEach((row, index) => {
      var sku = row[1]; // SKU is in column B (index 1)
      var rowIndex = startRow + index;
      autoFillInventoryFormulas(sku, rowIndex);
    });
  }

  // Now update calculated columns (InventoryValue, StockStatus) for affected rows
  updateInventoryCalculatedColumns(pendingUpdates);

  addLog("Inventory Snapshot updated successfully. " + rowsToUpdate.length + " rows updated, " + rowsToAppend.length + " rows appended.");
}

/*************************************************
 * UPDATE INVENTORY CALCULATED COLUMNS
 *************************************************/
function updateInventoryCalculatedColumns(inventoryUpdates) {
  if (!snapshotSheet || !productMasterSheet) {
    addLog("ERROR: Required sheets not found for calculated columns update");
    return;
  }

  addLog("Starting updateInventoryCalculatedColumns for " + inventoryUpdates.size + " inventory items");

  // Get product master data for pricing
  var productData = getSheetData(productMasterSheet);
  var productMap = new Map();
  productData.forEach(product => {
    if (product.SKU) {
      productMap.set(product.SKU, Number(product.Price) || 0);
    }
  });

  // Get current snapshot data
  var snapshotData = snapshotSheet.getDataRange().getValues();
  var headers = snapshotData.shift();
  var skuIndex = headers.indexOf("SKU");
  var locationIndex = headers.indexOf("Location");
  var stockIndex = headers.indexOf("CurrentStock");
  var valueIndex = headers.indexOf("InventoryValue");
  var statusIndex = headers.indexOf("StockStatus");
  
  if (skuIndex === -1 || stockIndex === -1 || valueIndex === -1 || statusIndex === -1) {
    addLog("ERROR: Required calculated columns not found in Inventory Snapshot");
    return;
  }

  // Update calculated columns for affected inventory items
  inventoryUpdates.forEach((data, key) => {
    var [sku, location] = key.split('|');
    
    // Find the row in snapshot sheet
    for (var i = 0; i < snapshotData.length; i++) {
      var row = snapshotData[i];
      if (row[skuIndex] === sku && row[locationIndex] === location) {
        var rowIndex = i + 2; // +2 because we shifted headers and arrays are 0-indexed
        var currentStock = parseInt(row[stockIndex], 10) || 0;
        var unitPrice = productMap.get(sku) || 0;
        
        // Calculate InventoryValue
        var inventoryValue = currentStock * unitPrice;
        snapshotSheet.getRange(rowIndex, valueIndex + 1).setValue(inventoryValue);
        
        // Calculate StockStatus
        var stockStatus = "Green";
        if (currentStock === 0) {
          stockStatus = "Red";
        } else if (currentStock < 20) {
          stockStatus = "Yellow";
        }
        snapshotSheet.getRange(rowIndex, statusIndex + 1).setValue(stockStatus);
        
        // Auto-fill Last7DaysSales formula if it doesn't exist
        autoFillInventoryFormulas(sku, rowIndex);
        
        addLog("Updated calculated columns for " + sku + " at " + location + ": Value=" + inventoryValue + ", Status=" + stockStatus);
        break;
      }
    }
  });

  addLog("Inventory calculated columns update completed");
}

/*************************************************
 * FORMULA DETECTION AND AUTO-FILL FUNCTIONS
 *************************************************/

/**
 * Check if a cell contains a formula
 * @param {Sheet} sheet - The Google Sheet
 * @param {number} row - Row number (1-based)
 * @param {number} col - Column number (1-based)
 * @return {boolean} True if cell contains formula
 */
function hasFormula(sheet, row, col) {
  try {
    var cell = sheet.getRange(row, col);
    var formula = cell.getFormula();
    return formula.startsWith('=');
  } catch (error) {
    addLog("Error checking formula in cell " + row + "," + col + ": " + error.toString());
    return false;
  }
}

/**
 * Create Last7Days formula for a specific SKU
 * @param {string} sku - The SKU to create formula for
 * @return {string} The formula string
 */
function createLast7DaysFormula(sku) {
  return '=SUMIFS(\'Inventory Log\'!D:D, \'Inventory Log\'!E:E, "SALE", \'Inventory Log\'!F:F, "Shop", \'Inventory Log\'!C:C, "' + sku + '", \'Inventory Log\'!B:B, ">="&TODAY()-7)';
}

/**
 * Create Last30Days formula for a specific SKU
 * @param {string} sku - The SKU to create formula for
 * @return {string} The formula string
 */
function createLast30DaysFormula(sku) {
  return '=SUMIFS(\'Inventory Log\'!D:D, \'Inventory Log\'!E:E, "SALE", \'Inventory Log\'!F:F, "Shop", \'Inventory Log\'!C:C, "' + sku + '", \'Inventory Log\'!B:B, ">="&TODAY()-30)';
}

/**
 * Create CumulativeValue formula for a specific row
 * @param {number} rowIndex - Row index in Sales Snapshot (1-based)
 * @return {string} The formula string
 */
function createCumulativeValueFormula(rowIndex) {
  return '=VLOOKUP(B' + rowIndex + ', \'Product Master\'!B:E, 4, FALSE) * C' + rowIndex;
}

/**
 * Create Last7DaysSales formula for Inventory Snapshot
 * Looks up Last7Days from Sales Snapshot for the same SKU
 * @param {string} sku - The SKU to create formula for
 * @return {string} The formula string
 */
function createLast7DaysSalesFormula(sku) {
  return '=IFERROR(VLOOKUP("' + sku + '", \'Sales Snapshot\'!B:D, 3, FALSE), 0)';
}

/**
 * Auto-fill formulas for Last7Days, Last30Days, and CumulativeValue columns
 * Only inserts formulas if they don't already exist
 * @param {string} sku - The SKU to create formulas for
 * @param {number} rowIndex - Row index in Sales Snapshot (1-based)
 */
function autoFillFormulas(sku, rowIndex) {
  if (!salesSnapshotSheet) {
    addLog("ERROR: Sales Snapshot sheet not found for auto-fill");
    return;
  }
  
  try {
    var last7DaysCol = 4; // Column D
    var last30DaysCol = 5; // Column E
    var cumulativeValueCol = 9; // Column I
    
    addLog("Auto-filling formulas for SKU: " + sku + " at row: " + rowIndex);
    
    // Only insert Last7Days formula if no formula exists
    if (!hasFormula(salesSnapshotSheet, rowIndex, last7DaysCol)) {
      var last7DaysFormula = createLast7DaysFormula(sku);
      salesSnapshotSheet.getRange(rowIndex, last7DaysCol).setFormula(last7DaysFormula);
      addLog("Inserted Last7Days formula for SKU: " + sku);
    } else {
      addLog("Last7Days formula already exists for SKU: " + sku + ", skipping");
    }
    
    // Only insert Last30Days formula if no formula exists
    if (!hasFormula(salesSnapshotSheet, rowIndex, last30DaysCol)) {
      var last30DaysFormula = createLast30DaysFormula(sku);
      salesSnapshotSheet.getRange(rowIndex, last30DaysCol).setFormula(last30DaysFormula);
      addLog("Inserted Last30Days formula for SKU: " + sku);
    } else {
      addLog("Last30Days formula already exists for SKU: " + sku + ", skipping");
    }
    
    // Only insert CumulativeValue formula if no formula exists
    if (!hasFormula(salesSnapshotSheet, rowIndex, cumulativeValueCol)) {
      var cumulativeValueFormula = createCumulativeValueFormula(rowIndex);
      salesSnapshotSheet.getRange(rowIndex, cumulativeValueCol).setFormula(cumulativeValueFormula);
      addLog("Inserted CumulativeValue formula for SKU: " + sku);
    } else {
      addLog("CumulativeValue formula already exists for SKU: " + sku + ", skipping");
    }
    
  } catch (error) {
    addLog("Error auto-filling formulas for SKU " + sku + ": " + error.toString());
  }
}

/**
 * Auto-fill Last7DaysSales formula for Inventory Snapshot
 * Only inserts formula if it doesn't already exist
 * @param {string} sku - The SKU to create formula for
 * @param {number} rowIndex - Row index in Inventory Snapshot (1-based)
 */
function autoFillInventoryFormulas(sku, rowIndex) {
  if (!snapshotSheet) {
    addLog("ERROR: Inventory Snapshot sheet not found for auto-fill");
    return;
  }
  
  try {
    var last7DaysSalesCol = 9; // Column I (Last7DaysSales)
    
    addLog("Auto-filling Last7DaysSales formula for SKU: " + sku + " at row: " + rowIndex);
    
    // Only insert Last7DaysSales formula if no formula exists
    if (!hasFormula(snapshotSheet, rowIndex, last7DaysSalesCol)) {
      var last7DaysSalesFormula = createLast7DaysSalesFormula(sku);
      snapshotSheet.getRange(rowIndex, last7DaysSalesCol).setFormula(last7DaysSalesFormula);
      addLog("Inserted Last7DaysSales formula for SKU: " + sku);
    } else {
      addLog("Last7DaysSales formula already exists for SKU: " + sku + ", skipping");
    }
    
  } catch (error) {
    addLog("Error auto-filling Last7DaysSales formula for SKU " + sku + ": " + error.toString());
  }
}

/**
 * Check if a row needs formula processing
 * @param {string} sku - The SKU to check
 * @param {number} rowIndex - Row index in Sales Snapshot (1-based)
 * @return {boolean} True if row needs GAS processing
 */
function needsFormulaProcessing(sku, rowIndex) {
  if (!salesSnapshotSheet) {
    return true; // Fall back to GAS processing if sheet not found
  }
  
  try {
    var last7DaysCol = 4; // Column D
    var last30DaysCol = 5; // Column E
    var cumulativeValueCol = 9; // Column I
    
    // If all three columns have formulas, skip GAS processing
    if (hasFormula(salesSnapshotSheet, rowIndex, last7DaysCol) && 
        hasFormula(salesSnapshotSheet, rowIndex, last30DaysCol) &&
        hasFormula(salesSnapshotSheet, rowIndex, cumulativeValueCol)) {
      addLog("SKU " + sku + " has all formulas, skipping GAS processing");
      return false;
    }
    
    addLog("SKU " + sku + " needs GAS processing (missing formulas)");
    return true;
    
  } catch (error) {
    addLog("Error checking formula status for SKU " + sku + ": " + error.toString());
    return true; // Fall back to GAS processing on error
  }
}


/*************************************************
 * UPDATE SALES SNAPSHOT
 *************************************************/
function updateSalesSnapshot(salesUpdates) {
  if (!salesSnapshotSheet) {
    addLog("ERROR: Sales Snapshot sheet not found");
    return;
  }
  
  if (salesUpdates.length === 0) {
    addLog("No sales updates to process");
    return;
  }

  addLog("Starting updateSalesSnapshot with " + salesUpdates.length + " entries");

  var salesData = salesSnapshotSheet.getDataRange().getValues();
  var headers = salesData.shift();
  
  // Find column indices dynamically
  var skuIndex = headers.indexOf("SKU");
  var totalSoldIndex = headers.indexOf("TotalSold");
  var last7DaysIndex = headers.indexOf("Last7Days");
  var last30DaysIndex = headers.indexOf("Last30Days");
  var lastSoldDateIndex = headers.indexOf("LastSoldDate");
  var lastUpdatedIndex = headers.indexOf("LastUpdated");
  var todaySalesIndex = headers.indexOf("TodaySales");
  var cumulativeValueIndex = headers.indexOf("CumulativeValue");
  var topSellerRankIndex = headers.indexOf("TopSellerRank");
  
  if (skuIndex === -1) {
    addLog("ERROR: SKU column not found in Sales Snapshot sheet");
    return;
  }
  
  // Create a map of existing sales data
  var salesMap = new Map();
  salesData.forEach((row, i) => {
    var sku = row[skuIndex];
    if (sku && sku.trim() !== "") {
      salesMap.set(sku, {
        total: parseInt(row[totalSoldIndex], 10) || 0,
        last7: parseInt(row[last7DaysIndex], 10) || 0,
        last30: parseInt(row[last30DaysIndex], 10) || 0,
        lastSold: row[lastSoldDateIndex] || null,
        todaySales: parseFloat(row[todaySalesIndex]) || 0,
        cumulativeValue: parseFloat(row[cumulativeValueIndex]) || 0,
        topSellerRank: row[topSellerRankIndex] || "",
        rowIndex: i + 2
      });
    }
  });

  var today = new Date();
  var todayStr = today.toDateString();

  // Process each sales update
  salesUpdates.forEach(update => {
    var sku = update.sku;
    var qty = update.qty;
    var ts = update.timestamp ? new Date(update.timestamp) : today;
    var saleDateStr = ts.toDateString();

    addLog("Processing SALE entry: SKU=" + sku + ", Qty=" + qty + ", Date=" + saleDateStr + ", Today=" + todayStr + ", Timestamp=" + ts);

    var rec = salesMap.has(sku) ? salesMap.get(sku) : {
      total: 0, 
      last7: 0, 
      last30: 0, 
      lastSold: null, 
      todaySales: 0, 
      cumulativeValue: 0,
      topSellerRank: "",
      rowIndex: -1
    };
    
    // Update total sold (cumulative)
    rec.total += qty;
    
    // Update last sold date - only if more recent than existing
    var newSaleDate = new Date(ts);
    if (!rec.lastSold || newSaleDate > rec.lastSold) {
      rec.lastSold = newSaleDate;
    }
    
    // Handle TodaySales - only update if the sale is from today
    if (saleDateStr === todayStr) {
      // Ensure todaySales is always a number
      rec.todaySales = (parseInt(rec.todaySales) || 0) + qty;
      addLog("Today's sale detected: Adding " + qty + " to todaySales. New todaySales: " + rec.todaySales + " (type: " + typeof rec.todaySales + ")");
    } else {
      // For non-today sales, keep existing todaySales (don't add to it)
      // Ensure it's a number
      rec.todaySales = parseInt(rec.todaySales) || 0;
      addLog("Non-today sale detected: Keeping existing todaySales: " + rec.todaySales + " (type: " + typeof rec.todaySales + ")");
    }

    // Update the sales map
    salesMap.set(sku, rec);
  });

  // All rolling window calculations now use formulas - no GAS processing needed
  addLog("All rolling window calculations now use formulas - no GAS processing needed");

  // Create a filtered map containing only affected SKUs for batch update
  var affectedSKUsForUpdate = new Map();
  salesUpdates.forEach(update => {
    if (salesMap.has(update.sku)) {
      affectedSKUsForUpdate.set(update.sku, salesMap.get(update.sku));
    }
  });
  
  // Now update the actual sheet with changes for affected SKUs only
  affectedSKUsForUpdate.forEach((rec, sku) => {
    if (rec.rowIndex !== -1) {
      // Update existing row
      var updateValues = [];
      var updateColumns = [];
      
      if (totalSoldIndex !== -1) {
        updateValues.push(rec.total);
        updateColumns.push(totalSoldIndex + 1);
      }
      // Last7Days and Last30Days are now handled by formulas - no GAS updates needed
      if (lastSoldDateIndex !== -1) {
        // Ensure the date is properly formatted for Google Sheets
        var formattedDate = rec.lastSold instanceof Date ? rec.lastSold : new Date(rec.lastSold);
        updateValues.push(formattedDate);
        updateColumns.push(lastSoldDateIndex + 1);
      }
      if (todaySalesIndex !== -1) {
        // Ensure todaySales is explicitly treated as a number
        var todaySalesValue = parseInt(rec.todaySales) || 0;
        updateValues.push(todaySalesValue);
        updateColumns.push(todaySalesIndex + 1);
        addLog("Setting TodaySales for " + sku + " to: " + todaySalesValue + " (type: " + typeof todaySalesValue + ")");
      }
      if (lastUpdatedIndex !== -1) {
        updateValues.push(formatDateForSheet(new Date()));
        updateColumns.push(lastUpdatedIndex + 1);
      }
      
      // Update each column individually
      updateValues.forEach((value, i) => {
        var colIndex = updateColumns[i];
        salesSnapshotSheet.getRange(rec.rowIndex, colIndex).setValue(value);
      });
      
      addLog("Updated existing sales record for affected SKU " + sku + ": Total=" + rec.total + ", TodaySales=" + rec.todaySales + " (Last7Days/Last30Days handled by formulas)");
      
      // AUTO-FILL FORMULAS: Check if this existing row needs formulas
      if (needsFormulaProcessing(sku, rec.rowIndex)) {
        addLog("Auto-filling formulas for existing SKU that needs them: " + sku);
        autoFillFormulas(sku, rec.rowIndex);
      }
    } else {
      // Append new row
      var newRow = [
        sku, // SnapshotID
        sku, // SKU
        rec.total, // TotalSold
        0, // Last7Days (will be replaced with formula)
        0, // Last30Days (will be replaced with formula)
        formatDateForSheet(rec.lastSold instanceof Date ? rec.lastSold : new Date(rec.lastSold)), // LastSoldDate - ensure proper Date object
        formatDateForSheet(new Date()), // LastUpdated
        parseInt(rec.todaySales) || 0, // TodaySales - ensure it's a number
        0, // CumulativeValue (will be replaced with formula)
        "" // TopSellerRank (will be calculated below)
      ];
      salesSnapshotSheet.appendRow(newRow);
      
      // Get the row index of the newly appended row
      var newRowIndex = salesSnapshotSheet.getLastRow();
      rec.rowIndex = newRowIndex;
      
      addLog("Appended new sales record for affected SKU " + sku + " at row " + newRowIndex + " (Last7Days/Last30Days will be handled by formulas)");
      
      // AUTO-FILL FORMULAS: Insert formulas for Last7Days and Last30Days
      addLog("Auto-filling formulas for new SKU: " + sku);
      autoFillFormulas(sku, newRowIndex);
    }
  });
  
  // Now update calculated columns (CumulativeValue, TopSellerRank) for affected rows only
  var affectedSKUs = new Map();
  salesUpdates.forEach(update => {
    affectedSKUs.set(update.sku, salesMap.get(update.sku));
  });
  updateSalesCalculatedColumns(affectedSKUs);
  
  addLog("updateSalesSnapshot completed successfully");
}

/*************************************************
 * UPDATE SALES CALCULATED COLUMNS
 *************************************************/
function updateSalesCalculatedColumns(salesMap) {
  if (!salesSnapshotSheet || !productMasterSheet) {
    addLog("ERROR: Required sheets not found for sales calculated columns update");
    return;
  }

  addLog("Starting updateSalesCalculatedColumns for " + salesMap.size + " sales items");

  // Get product master data for pricing
  var productData = getSheetData(productMasterSheet);
  var productMap = new Map();
  productData.forEach(product => {
    if (product.SKU) {
      productMap.set(product.SKU, Number(product.Price) || 0);
    }
  });

  // Get current sales snapshot data
  var salesData = salesSnapshotSheet.getDataRange().getValues();
  var headers = salesData.shift();
  var skuIndex = headers.indexOf("SKU");
  var totalSoldIndex = headers.indexOf("TotalSold");
  var cumulativeValueIndex = headers.indexOf("CumulativeValue");
  var topSellerRankIndex = headers.indexOf("TopSellerRank");
  
  if (skuIndex === -1 || totalSoldIndex === -1 || cumulativeValueIndex === -1) {
    addLog("ERROR: Required calculated columns not found in Sales Snapshot");
    return;
  }

  // CumulativeValue is now handled by formulas - only calculate TopSellerRank
  // Get all SKUs with their CumulativeValue from formulas for ranking
  var allSKUsWithValues = [];
  
  // Read all rows to get CumulativeValue from formulas
  for (var i = 1; i < salesData.length; i++) {
    var row = salesData[i];
    var sku = row[skuIndex];
    var totalSold = row[totalSoldIndex];
    var cumulativeValue = row[cumulativeValueIndex];
    
    if (sku && sku.trim() !== "") {
      allSKUsWithValues.push({
      sku: sku,
        totalSold: totalSold,
      cumulativeValue: cumulativeValue,
        rowIndex: i + 1
    });
    }
  }

  // Sort by cumulative value for ranking
  allSKUsWithValues.sort((a, b) => b.cumulativeValue - a.cumulativeValue);

  // Update TopSellerRank for all rows
  allSKUsWithValues.forEach((item, index) => {
    var rank = index + 1;
    var topSellerRank = rank <= 10 ? rank.toString() : ""; // Just the number, not "Top 1"
    
    if (item.rowIndex !== -1 && topSellerRankIndex !== -1) {
        salesSnapshotSheet.getRange(item.rowIndex, topSellerRankIndex + 1).setValue(topSellerRank);
      addLog("Updated TopSellerRank for SKU " + item.sku + " at row " + item.rowIndex + ": Rank=" + topSellerRank);
    }
  });

  addLog("Sales calculated columns update completed for " + allSKUsWithValues.length + " items");
}

/*************************************************
 * UPDATE INVENTORY SALES FIELDS (Shop locations only)
 *************************************************/
function updateInventorySalesFields(salesUpdates) {
  if (!snapshotSheet) {
    addLog("ERROR: Inventory Snapshot sheet not found");
    return;
  }
  
  addLog("Starting updateInventorySalesFields with " + salesUpdates.length + " entries");
  
  // Only process SALE entries
  var saleEntries = salesUpdates.filter(update => update.sku); // Filter valid entries
  if (saleEntries.length === 0) {
    addLog("No valid sales entries found, skipping sales field updates");
    return;
  }
  
  // Load current inventory snapshot
  var snapshotData = snapshotSheet.getDataRange().getValues();
  var headers = snapshotData.shift();
  
  // Find column indices dynamically
  var skuIndex = headers.indexOf("SKU");
  var locationIndex = headers.indexOf("Location");
  var daysSinceLastSaleIndex = headers.indexOf("DaysSinceLastSale");
  var last7DaysSalesIndex = headers.indexOf("Last7DaysSales");
  var lastUpdatedIndex = headers.indexOf("LastUpdated");
  
  if (skuIndex === -1 || locationIndex === -1) {
    addLog("ERROR: Required columns not found in Inventory Snapshot");
    return;
  }
  
  // Group sales by SKU to calculate totals and last sale date
  var salesBySKU = new Map();
  var today = new Date();
  var todayStr = today.toDateString();
  
  saleEntries.forEach(entry => {
    var sku = entry.sku;
    var qty = entry.qty;
    var saleDate = entry.timestamp || today;
    var saleDateStr = saleDate.toDateString();
    
    if (!salesBySKU.has(sku)) {
      salesBySKU.set(sku, {
        totalQty: 0,
        lastSaleDate: saleDate,
        todayQty: 0
      });
    }
    
    var skuData = salesBySKU.get(sku);
    skuData.totalQty += qty;
    
    // Update last sale date if this sale is more recent
    if (saleDate > skuData.lastSaleDate) {
      skuData.lastSaleDate = saleDate;
    }
    
    // Add to today's quantity if sale is from today
    if (saleDateStr === todayStr) {
      skuData.todayQty += qty;
    }
  });
  
  addLog("Processed sales data for " + salesBySKU.size + " SKUs");
  
  // Get all logs for proper rolling window calculation
  var allLogs = getSheetData(logSheet);
  
  // Update inventory snapshot for Shop locations only
  salesBySKU.forEach((skuData, sku) => {
    addLog("Processing sales updates for SKU: " + sku + ", Total Qty: " + skuData.totalQty + ", Last Sale: " + skuData.lastSaleDate);
    
    // Find Shop location row for this SKU
    for (var i = 0; i < snapshotData.length; i++) {
      var row = snapshotData[i];
      var rowSku = row[skuIndex];
      var rowLocation = row[locationIndex];
      
      if (rowSku === sku && rowLocation === 'Shop') {
        var rowIndex = i + 2; // +2 because we shifted headers and arrays are 0-indexed
        
        // Calculate days since last sale
        var daysSinceLastSale = Math.floor((today - skuData.lastSaleDate) / (1000 * 60 * 60 * 24));
        
        // Update sales-related fields
        if (daysSinceLastSaleIndex !== -1) {
          snapshotSheet.getRange(rowIndex, daysSinceLastSaleIndex + 1).setValue(daysSinceLastSale);
          addLog("Updated DaysSinceLastSale for SKU " + sku + " (Shop): " + daysSinceLastSale);
        }
        
        if (last7DaysSalesIndex !== -1) {
          // Last7DaysSales is now handled by formula - auto-fill if needed
          autoFillInventoryFormulas(sku, rowIndex);
          addLog("Last7DaysSales handled by formula for SKU " + sku + " (Shop)");
        }
        
        if (lastUpdatedIndex !== -1) {
          snapshotSheet.getRange(rowIndex, lastUpdatedIndex + 1).setValue(today);
        }
        
        addLog("Updated sales fields for SKU " + sku + " at Shop location");
        break;
      }
    }
  });
  
  addLog("updateInventorySalesFields completed successfully");
}

/*************************************************
 * RESET TODAYSALES TO 0 (call this at start of each day)
 *************************************************/
function resetTodaySales() {
  if (!salesSnapshotSheet) return sendJSON({status:"error", message:"Sales Snapshot sheet not found"});
  
  try {
    var data = salesSnapshotSheet.getDataRange().getValues();
    var headers = data[0];
    var todaySalesIndex = headers.indexOf("TodaySales");
    
    if (todaySalesIndex === -1) {
      addLog("TodaySales column not found, skipping reset");
      return sendJSON({status:"error", message:"TodaySales column not found"});
    }
    
    addLog("Resetting all TodaySales to 0");
    
    // Reset all TodaySales to 0
    for (var i = 1; i < data.length; i++) { // Start from 1 to skip header
      var row = data[i];
      var sku = row[0]; // Assuming SKU is first column
      if (sku && sku.trim() !== "") {
        salesSnapshotSheet.getRange(i + 1, todaySalesIndex + 1).setValue(0);
      }
    }
    
    addLog("TodaySales reset completed - all values set to 0");
    return sendJSON({status:"success", message:"TodaySales reset to 0 for all SKUs"});
    
  } catch (error) {
    addLog("Error resetting TodaySales: " + error.toString());
    return sendJSON({status:"error", message:"Failed to reset TodaySales: " + error.toString()});
  }
}

/*************************************************
 * SETUP DAILY TRIGGER FOR RESETTING TODAYSALES
 *************************************************/
function setupDailyReset() {
  try {
    // Delete existing triggers
    var triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(function(trigger) {
      if (trigger.getHandlerFunction() === 'resetTodaySales') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new daily trigger at 00:00 (midnight)
    ScriptApp.newTrigger('resetTodaySales')
      .timeBased()
      .everyDays(1)
      .atHour(0)
      .create();
    
    addLog("Daily trigger created for resetTodaySales at 00:00");
    return sendJSON({status:"success", message:"Daily trigger created for resetting TodaySales at midnight"});
    
  } catch (error) {
    addLog("Error creating daily trigger: " + error.toString());
    return sendJSON({status:"error", message:"Failed to create daily trigger: " + error.toString()});
  }
}

/*************************************************
 * ADD TRANSACTION (NEW POST-BASED APPROACH)
 *************************************************/
function addTransaction(data) {
  // Expected data keys: SKU, Quantity, Mode, SourceLocation, DestinationLocation, User, Notes
  try {
    var newId = Utilities.getUuid();
    var timestamp = formatDateForSheet(new Date());

    logSheet.appendRow([
      newId,
      timestamp,
      data.SKU,
      Number(data.Quantity),
      data.Mode,
      data.SourceLocation,
      data.DestinationLocation,
      data.User,
      data.Notes || ""
    ]);

    addLog("Added transaction: " + JSON.stringify(data));

    // Trigger recalculation of snapshots
    updateSnapshots();

    return { status:"success", TransactionID: newId };
  } catch (error) {
    addLog("Error adding transaction: " + error.toString());
    return { status:"error", message: error.toString() };
  }
}

/*************************************************
 * UPDATE SNAPSHOTS (BUSINESS RULES)
 *************************************************/
function updateSnapshots() {
  addLog("Starting updateSnapshots...");
  
  try {
    var logs = getSheetData(logSheet);
    var productMaster = getSheetData(productMasterSheet);
    
    addLog("Processing " + logs.length + " log entries and " + productMaster.length + " products");
    
    // Log the sales entries for debugging
    var salesLogs = logs.filter(log => log["Mode"] === "SALE");
    addLog("Found " + salesLogs.length + " sales entries: " + JSON.stringify(salesLogs.map(log => ({sku: log["SKU"], qty: log["Quantity"], date: log["Timestamp"]}))));

    // === INVENTORY SNAPSHOT ===
    var snapshot = {};
    logs.forEach(function (log) {
      var qty = Number(log["Quantity"]) || 0;

      if (log["Mode"] == "RECEIVING") {
        // For receiving, create/update destination location
        var destKey = log["SKU"] + "|" + log["DestinationLocation"];
        if (!snapshot[destKey]) {
          snapshot[destKey] = {
            SnapshotID: destKey,
            SKU: log["SKU"],
            Location: log["DestinationLocation"],
            CurrentStock: 0,
            LastUpdated: log["Timestamp"],
            InventoryValue: 0,
            DaysSinceLastSale: "",
            StockStatus: "Green",
            Last7DaysSales: 0
          };
        }
        snapshot[destKey].CurrentStock += qty;
        snapshot[destKey].LastUpdated = log["Timestamp"];
        
      } else if (log["Mode"] == "SALE" && log["SourceLocation"] == "Shop") {
        // For sales, create/update source location (Shop)
        var sourceKey = log["SKU"] + "|" + log["SourceLocation"];
        if (!snapshot[sourceKey]) {
          snapshot[sourceKey] = {
            SnapshotID: sourceKey,
            SKU: log["SKU"],
            Location: log["SourceLocation"],
            CurrentStock: 0,
            LastUpdated: log["Timestamp"],
            InventoryValue: 0,
            DaysSinceLastSale: "",
            StockStatus: "Green",
            Last7DaysSales: 0
          };
        }
        snapshot[sourceKey].CurrentStock -= qty;
        snapshot[sourceKey].LastUpdated = log["Timestamp"];
        
      } else if (log["Mode"] == "TRANSFER") {
        // For transfers, create/update BOTH source and destination locations
        var sourceKey = log["SKU"] + "|" + log["SourceLocation"];
        var destKey = log["SKU"] + "|" + log["DestinationLocation"];
        
        // Handle source location (decrease stock)
        if (!snapshot[sourceKey]) {
          snapshot[sourceKey] = {
            SnapshotID: sourceKey,
            SKU: log["SKU"],
            Location: log["SourceLocation"],
            CurrentStock: 0,
            LastUpdated: log["Timestamp"],
            InventoryValue: 0,
            DaysSinceLastSale: "",
            StockStatus: "Green",
            Last7DaysSales: 0
          };
        }
        snapshot[sourceKey].CurrentStock -= qty;
        snapshot[sourceKey].LastUpdated = log["Timestamp"];
        
        // Handle destination location (increase stock)
        if (!snapshot[destKey]) {
          snapshot[destKey] = {
            SnapshotID: destKey,
            SKU: log["SKU"],
            Location: log["DestinationLocation"],
            CurrentStock: 0,
            LastUpdated: log["Timestamp"],
            InventoryValue: 0,
            DaysSinceLastSale: "",
            StockStatus: "Green",
            Last7DaysSales: 0
          };
        }
        snapshot[destKey].CurrentStock += qty;
        snapshot[destKey].LastUpdated = log["Timestamp"];
        
      } else if (log["Mode"] == "ADJUSTMENT") {
        // For adjustments, create/update the specified location
        var locationKey = log["SKU"] + "|" + log["SourceLocation"];
        if (!snapshot[locationKey]) {
          snapshot[locationKey] = {
            SnapshotID: locationKey,
            SKU: log["SKU"],
            Location: log["SourceLocation"],
            CurrentStock: 0,
            LastUpdated: log["Timestamp"],
            InventoryValue: 0,
            DaysSinceLastSale: "",
            StockStatus: "Green",
            Last7DaysSales: 0
          };
        }
        snapshot[locationKey].CurrentStock = qty; // Set to exact quantity
        snapshot[locationKey].LastUpdated = log["Timestamp"];
      }
    });

    // Add product price info and calculate inventory value
    productMaster.forEach(function (p) {
      for (var key in snapshot) {
        if (snapshot[key].SKU == p["SKU"]) {
          var unitPrice = Number(p["Price"]) || 0;
          snapshot[key].InventoryValue = snapshot[key].CurrentStock * unitPrice;
          
          // Calculate stock status based on stock level
          var stockLevel = snapshot[key].CurrentStock;
          if (stockLevel === 0) {
            snapshot[key].StockStatus = "Red";
          } else if (stockLevel < 5) {
            snapshot[key].StockStatus = "Red";
          } else if (stockLevel < 20) {
            snapshot[key].StockStatus = "Yellow";
          } else {
            snapshot[key].StockStatus = "Green";
          }
        }
      }
    });
    
    // Calculate sales-related fields for inventory snapshot
    var today = new Date();
    
    // Process sales logs to calculate DaysSinceLastSale and retrieve Last7DaysSales from sales snapshot
    logs.forEach(function (log) {
      if (log["Mode"] == "SALE" && log["SourceLocation"] == "Shop") {
        var sku = log["SKU"];
        var saleDate = log["Timestamp"] || today;
        
        // Update inventory snapshot for Shop locations only
        for (var key in snapshot) {
          if (snapshot[key].SKU === sku && snapshot[key].Location === "Shop") {
            // Calculate days since last sale
            var daysSinceLastSale = Math.floor((today - saleDate) / (1000 * 60 * 60 * 24));
            snapshot[key].DaysSinceLastSale = daysSinceLastSale;
            
            // Last7DaysSales is now handled by formula - no GAS calculation needed
            
            addLog("Updated sales fields for SKU " + sku + " at Shop location: DaysSinceLastSale=" + daysSinceLastSale + " (Last7DaysSales handled by formula)");
            break;
          }
        }
      }
    });

    // Write back to inventory snapshot
    snapshotSheet.clearContents();
    snapshotSheet.appendRow(["SnapshotID","SKU","Location","CurrentStock","LastUpdated","InventoryValue","DaysSinceLastSale","StockStatus","Last7DaysSales"]);
    
    addLog("Writing inventory snapshot with " + Object.keys(snapshot).length + " entries");
    for (var key in snapshot) {
      var s = snapshot[key];
      addLog("Inventory entry: " + s.SKU + " at " + s.Location + " - Stock: " + s.CurrentStock + ", Value: " + s.InventoryValue + ", DaysSinceLastSale: " + s.DaysSinceLastSale + " (Last7DaysSales handled by formula)");
      snapshotSheet.appendRow([
        s.SnapshotID, s.SKU, s.Location, s.CurrentStock, formatDateForSheet(s.LastUpdated), s.InventoryValue, s.DaysSinceLastSale, s.StockStatus, 0 // Last7DaysSales will be replaced with formula
      ]);
    }
    
    // Auto-fill Last7DaysSales formulas for all inventory rows
    addLog("Auto-filling Last7DaysSales formulas for all inventory rows");
    for (var i = 2; i <= snapshotSheet.getLastRow(); i++) { // Start from row 2 (skip header)
      var sku = snapshotSheet.getRange(i, 2).getValue(); // SKU is in column B
      if (sku && sku.trim() !== "") {
        autoFillInventoryFormulas(sku, i);
      }
    }

    // === SALES SNAPSHOT ===
    var sales = {};
    var today = new Date();
    var todayStr = today.toDateString();
    
    logs.forEach(function (log) {
      if (log["Mode"] == "SALE" && log["SourceLocation"] == "Shop") {
        var sku = log["SKU"];
        var qty = Number(log["Quantity"]);
        var saleDate = log["Timestamp"] || today;
        var saleDateStr = saleDate.toDateString();

        if (!sales[sku]) {
          sales[sku] = {
            SnapshotID: sku,
            SKU: sku,
            TotalSold: 0,
            Last7Days: 0,
            Last30Days: 0,
            LastSoldDate: "",
            LastUpdated: formatDateForSheet(new Date()),
            TodaySales: 0,
            CumulativeValue: 0,
            TopSellerRank: ""
          };
        }

        sales[sku].TotalSold += qty;
        sales[sku].LastSoldDate = formatDateForSheet(saleDate);
        
        // Calculate today's sales
        if (saleDateStr === todayStr) {
          sales[sku].TodaySales += qty;
        }
      }
    });
    
    // Calculate actual rolling windows for Last7Days and Last30Days
    for (var sku in sales) {
      var sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
      var thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      
      var last7DaysTotal = 0;
      var last30DaysTotal = 0;
      
      // Calculate sales in the last 7 and 30 days
      logs.forEach(function (log) {
        if (log["Mode"] == "SALE" && log["SourceLocation"] == "Shop" && log["SKU"] === sku) {
          var saleDate = log["Timestamp"] || today;
          var qty = Number(log["Quantity"]) || 0;
          
          // Last 7 days
          if (saleDate >= sevenDaysAgo) {
            last7DaysTotal += qty;
          }
          
          // Last 30 days
          if (saleDate >= thirtyDaysAgo) {
            last30DaysTotal += qty;
          }
        }
      });
      
      sales[sku].Last7Days = last7DaysTotal;
      sales[sku].Last30Days = last30DaysTotal;
      
      addLog("Calculated rolling windows for " + sku + ": Last7Days=" + last7DaysTotal + ", Last30Days=" + last30DaysTotal);
    }

    // Calculate cumulative value
    productMaster.forEach(function (p) {
      if (sales[p.SKU]) {
        var unitPrice = Number(p["Price"]) || 0;
        sales[p.SKU].CumulativeValue = sales[p.SKU].TotalSold * unitPrice;
      }
    });

    // Write back to sales snapshot
    salesSnapshotSheet.clearContents();
    salesSnapshotSheet.appendRow(["SnapshotID","SKU","TotalSold","Last7Days","Last30Days","LastSoldDate","LastUpdated","TodaySales","CumulativeValue","TopSellerRank"]);
    
    addLog("Writing sales snapshot with " + Object.keys(sales).length + " entries");
    for (var sku in sales) {
      var s = sales[sku];
      addLog("Sales entry: " + s.SKU + " - TotalSold: " + s.TotalSold + ", TodaySales: " + s.TodaySales + ", Last7Days: " + s.Last7Days + ", Last30Days: " + s.Last30Days);
      salesSnapshotSheet.appendRow([
        s.SnapshotID, s.SKU, s.TotalSold, s.Last7Days, s.Last30Days, formatDateForSheet(s.LastSoldDate), formatDateForSheet(s.LastUpdated), s.TodaySales, s.CumulativeValue, s.TopSellerRank
      ]);
    }

    addLog("updateSnapshots completed successfully");
    return { status:"success", message:"Snapshots updated successfully" };
    
  } catch (error) {
    addLog("Error in updateSnapshots: " + error.toString());
    return { status:"error", message:"Failed to update snapshots: " + error.toString() };
  }
}

/*************************************************
 * FIX CORRUPTED TODAYSALES VALUES
 *************************************************/
function fixCorruptedTodaySales() {
  addLog("Starting fixCorruptedTodaySales...");
  
  try {
    if (!salesSnapshotSheet) {
      addLog("ERROR: Sales Snapshot sheet not found");
      return {status:"error", message:"Sales Snapshot sheet not found"};
    }
    
    var data = salesSnapshotSheet.getDataRange().getValues();
    var headers = data[0];
    
    // Find column indices
    var skuIndex = headers.indexOf("SKU");
    var todaySalesIndex = headers.indexOf("TodaySales");
    var lastUpdatedIndex = headers.indexOf("LastUpdated");
    
    if (skuIndex === -1 || todaySalesIndex === -1) {
      addLog("ERROR: Required columns not found");
      return {status:"error", message:"Required columns not found"};
    }
    
    var today = new Date();
    var todayStr = today.toDateString();
    var fixedCount = 0;
    
    // Process each data row (skip header)
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var sku = row[skuIndex];
      var todaySalesValue = row[todaySalesIndex];
      
      if (sku && sku.trim() !== "") {
        // Check if TodaySales is corrupted (not a number)
        if (isNaN(parseInt(todaySalesValue)) || todaySalesValue instanceof Date) {
          addLog("Fixing corrupted TodaySales for SKU " + sku + ": was " + todaySalesValue + ", setting to 0");
          
          // Reset to 0
          salesSnapshotSheet.getRange(i + 1, todaySalesIndex + 1).setValue(0);
          
          // Update LastUpdated
          if (lastUpdatedIndex !== -1) {
            salesSnapshotSheet.getRange(i + 1, lastUpdatedIndex + 1).setValue(today);
          }
          
          fixedCount++;
        }
      }
    }
    
    addLog("Fixed " + fixedCount + " corrupted TodaySales values");
    
    // Now recalculate TodaySales based on actual today's sales
    var allLogs = getSheetData(logSheet);
    var todaySales = {};
    
    // Calculate today's sales from logs
    allLogs.forEach(log => {
      if (log["Mode"] === "SALE" && log["SourceLocation"] === "Shop") {
        var saleDate = log["Timestamp"] || new Date();
        var saleDateStr = saleDate.toDateString();
        
        if (saleDateStr === todayStr) {
          var sku = log["SKU"];
          var qty = parseInt(log["Quantity"]) || 0;
          
          if (!todaySales[sku]) {
            todaySales[sku] = 0;
          }
          todaySales[sku] += qty;
        }
      }
    });
    
    // Update TodaySales for SKUs that had sales today
    var updatedCount = 0;
    for (var sku in todaySales) {
      // Find the row for this SKU
      for (var i = 1; i < data.length; i++) {
        var row = data[i];
        if (row[skuIndex] === sku) {
          salesSnapshotSheet.getRange(i + 1, todaySalesIndex + 1).setValue(todaySales[sku]);
          addLog("Updated TodaySales for " + sku + " to " + todaySales[sku]);
          updatedCount++;
          break;
        }
      }
    }
    
    addLog("Updated " + updatedCount + " TodaySales values based on actual today's sales");
    
    return {
      status: "success",
      message: "Fixed corrupted TodaySales values",
      fixedCount: fixedCount,
      updatedCount: updatedCount,
      logs: getLogs()
    };
    
  } catch (error) {
    addLog("Error fixing corrupted TodaySales: " + error.toString());
    return {
      status: "error",
      message: "Failed to fix corrupted TodaySales: " + error.toString(),
      logs: getLogs()
    };
  }
}

/*************************************************
 * TEST SALES SNAPSHOT STRUCTURE
 *************************************************/
function testSalesSnapshotStructure() {
  addLog("Testing sales snapshot structure...");
  
  try {
    if (!salesSnapshotSheet) {
      addLog("ERROR: Sales Snapshot sheet not found");
      return {status:"error", message:"Sales Snapshot sheet not found"};
    }
    
    var data = salesSnapshotSheet.getDataRange().getValues();
    var headers = data[0];
    
    addLog("Sales Snapshot headers: " + JSON.stringify(headers));
    
    // Check if we have data rows
    if (data.length <= 1) {
      addLog("No data rows found in Sales Snapshot");
      return {status:"success", message:"No data rows found", headers: headers};
    }
    
    // Check first data row
    var firstRow = data[1];
    var rowData = {};
    headers.forEach((header, index) => {
      rowData[header] = firstRow[index];
    });
    
    addLog("First row data: " + JSON.stringify(rowData));
    
    // Check data types
    var dataTypes = {};
    headers.forEach((header, index) => {
      var value = firstRow[index];
      dataTypes[header] = {
        value: value,
        type: typeof value,
        isDate: value instanceof Date,
        isNumber: !isNaN(Number(value)) && value !== null && value !== ""
      };
    });
    
    addLog("Data types analysis: " + JSON.stringify(dataTypes, null, 2));
    
    return {
      status: "success",
      message: "Sales Snapshot structure analyzed",
      headers: headers,
      firstRow: rowData,
      dataTypes: dataTypes,
      totalRows: data.length - 1,
      logs: getLogs()
    };
    
  } catch (error) {
    addLog("Error testing sales snapshot structure: " + error.toString());
    return {
      status: "error",
      message: "Failed to test sales snapshot structure: " + error.toString(),
      logs: getLogs()
    };
  }
}

/*************************************************
 * TEST SALES OPERATION
 *************************************************/
function testSalesOperation() {
  addLog("Testing sales operation...");
  
  try {
    // Simulate a sales operation
    var testData = {
      action: "addInventoryLog",
      data: JSON.stringify([{
        sku: "TEST001",
        quantity: 5,
        mode: "SALE",
        source: "Shop",
        destination: "",
        user: "TestUser",
        notes: "Test sales operation"
      }])
    };
    
    addLog("Simulating sales operation with test data: " + JSON.stringify(testData));
    
    // Create a mock event object
    var mockEvent = {
      parameter: testData
    };
    
    // Call the function
    var result = addInventoryLog(mockEvent);
    
    addLog("Test sales operation completed. Result: " + JSON.stringify(result));
    
    return {
      status: "success",
      message: "Test sales operation completed",
      result: result,
      logs: getLogs()
    };
    
  } catch (error) {
    addLog("Error in test sales operation: " + error.toString());
    return {
      status: "error",
      message: "Test sales operation failed: " + error.toString(),
      logs: getLogs()
    };
  }
}

/*************************************************
 * MANUAL TRIGGERS FOR TESTING
 *************************************************/
function manualUpdateSnapshots() {
  addLog("Manual updateSnapshots triggered");
  return updateSnapshots();
}
