var SPREADSHEET_ID = "1t8eqdoMh9_1l6DnvD_tqagMWWz0Ctci-_0nz4tqP86g";
var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

var logSheet = ss.getSheetByName("Inventory Log");
var snapshotSheet = ss.getSheetByName("Inventory Snapshot");
var salesSnapshotSheet = ss.getSheetByName("Sales Snapshot");

// ---------------------------
// Global log collection
// ---------------------------
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

// ---------------------------
// WebApp Entry
// ---------------------------
function doGet(e) {
  var action = e.parameter.action;

  if (action === "getInventorySnapshot") return getInventorySnapshot();
  if (action === "addInventoryLog") return addInventoryLog(e);
  if (action === "testSheets") return testSheetConnections();
  if (action === "getLogs") return outputJSON({status:"success", logs: getLogs()});
  if (action === "clearLogs") {
    clearLogs();
    return outputJSON({status:"success", message:"Logs cleared"});
  }

  return outputJSON({status:"error", message:"Unknown action"});
}

// ---------------------------
// Test Sheet Connections
// ---------------------------
function testSheetConnections() {
  addLog("Testing sheet connections...");
  
  var results = {
    logSheet: logSheet ? "Connected" : "NULL - Check sheet name 'Inventory Log'",
    snapshotSheet: snapshotSheet ? "Connected" : "NULL - Check sheet name 'Inventory Snapshot'",
    salesSnapshotSheet: salesSnapshotSheet ? "Connected" : "NULL - Check sheet name 'Sales Snapshot'"
  };
  
  addLog("Sheet connection test results: " + JSON.stringify(results));
  
  if (logSheet) {
    var logRowCount = logSheet.getLastRow();
    addLog("Inventory Log sheet has " + logRowCount + " rows");
  }
  
  if (snapshotSheet) {
    var snapshotRowCount = snapshotSheet.getLastRow();
    addLog("Inventory Snapshot sheet has " + snapshotRowCount + " rows");
    if (snapshotRowCount > 0) {
      var headers = snapshotSheet.getRange(1, 1, 1, snapshotSheet.getLastColumn()).getValues()[0];
      addLog("Inventory Snapshot headers: " + JSON.stringify(headers));
    }
  }
  
  if (salesSnapshotSheet) {
    var salesRowCount = salesSnapshotSheet.getLastRow();
    addLog("Sales Snapshot sheet has " + salesRowCount + " rows");
  }
  
  return outputJSON({
    status: "success", 
    message: "Sheet connection test completed",
    results: results
  });
}

// ---------------------------
// Get Inventory Snapshot
// ---------------------------
function getInventorySnapshot() {
  if (!snapshotSheet) return outputJSON({status:"error", message:"Inventory Snapshot sheet not found"});
  var data = snapshotSheet.getDataRange().getValues();
  return outputJSON({status:"success", data:data});
}

// ---------------------------
// Add Inventory Log (supports bulk)
// ---------------------------
function addInventoryLog(e) {
  addLog("addInventoryLog called with parameters: " + JSON.stringify(e.parameter));
  
  if (!logSheet) {
    addLog("ERROR: Inventory Log sheet not found");
    return outputJSON({status:"error", message:"Inventory Log sheet not found"});
  }

  // Expect bulk data as JSON string
  var bulkData = e.parameter.data; // JSON array: [{sku, quantity, mode, source, destination, user, notes}, ...]
  if (!bulkData) {
    addLog("ERROR: No data parameter provided");
    return outputJSON({status:"error", message:"No data provided"});
  }

  var entries;
  try {
    entries = JSON.parse(bulkData);
    addLog("Parsed bulk data: " + JSON.stringify(entries));
  } catch(err) {
    addLog("ERROR: Failed to parse JSON: " + err.message);
    return outputJSON({status:"error", message:"Invalid JSON"});
  }

  var newLogRows = entries.map(function(item){
    var logQuantity = item.quantity;
    
    // For ADJUSTMENT mode, calculate the actual change needed instead of logging the new total
    if (item.mode === 'ADJUSTMENT' && item.source && (item.source === 'Shop' || item.source === 'Warehouse')) {
      // Get current stock from snapshot to calculate the change
      var currentStock = 0;
      if (snapshotSheet) {
        var snapshotData = snapshotSheet.getDataRange().getValues();
        var headers = snapshotData.shift();
        var skuIndex = headers.indexOf("SKU");
        var locationIndex = headers.indexOf("Location");
        var stockIndex = headers.indexOf("CurrentStock");
        
        if (skuIndex !== -1 && locationIndex !== -1 && stockIndex !== -1) {
          for (var i = 0; i < snapshotData.length; i++) {
            if (snapshotData[i][skuIndex] === item.sku && snapshotData[i][locationIndex] === item.source) {
              currentStock = parseInt(snapshotData[i][stockIndex], 10) || 0;
              break;
            }
          }
        }
      }
      
      var adjustment = parseInt(item.quantity, 10) - currentStock;
      logQuantity = adjustment;
      
      addLog("ADJUSTMENT: Current stock=" + currentStock + ", New total=" + item.quantity + ", Adjustment=" + adjustment + " at location " + item.source);
      addLog("ADJUSTMENT: Logging adjustment quantity " + adjustment + " (not new total " + item.quantity + ")");
      addLog("ADJUSTMENT: User entered " + item.quantity + " but log will show " + adjustment + " (the actual change)");
    }
    
    return [
      Utilities.getUuid(),
      new Date(),
      item.sku || "",
      logQuantity, // Use calculated adjustment quantity for ADJUSTMENT mode
      item.mode || "",
      item.source || "",
      item.destination || "",
      item.user || "",
      item.notes || ""
    ];
  });

  addLog("Prepared log rows: " + JSON.stringify(newLogRows));

  // Append all logs at once
  logSheet.getRange(logSheet.getLastRow()+1, 1, newLogRows.length, newLogRows[0].length).setValues(newLogRows);
  addLog("Added " + newLogRows.length + " rows to Inventory Log sheet");

  // Update Snapshots in batch
  addLog("Calling updateInventorySnapshot...");
  updateInventorySnapshot(newLogRows);
  
  addLog("Calling updateSalesSnapshot...");
  updateSalesSnapshot(newLogRows);

  addLog("addInventoryLog completed successfully");
  return outputJSON({status:"success", message:"Logs added and snapshots updated", count:newLogRows.length});
}

// ---------------------------
// Update Inventory Snapshot
// ---------------------------
function updateInventorySnapshot(latestEntries) {
  if (!snapshotSheet) {
    addLog("ERROR: Snapshot sheet is null - check sheet name 'Inventory Snapshot'");
    return;
  }

  addLog("Starting updateInventorySnapshot with " + latestEntries.length + " entries");

  // Load existing snapshot
  var snapshotData = snapshotSheet.getDataRange().getValues();
  var headers = snapshotData.shift();
  addLog("Snapshot headers: " + JSON.stringify(headers));
  
  // Find column indices dynamically
    var skuIndex = headers.indexOf("SKU");
    var locationIndex = headers.indexOf("Location");
    var stockIndex = headers.indexOf("CurrentStock");
  var updatedIndex = headers.indexOf("LastUpdated");
  
  addLog("Column indices - SKU: " + skuIndex + ", Location: " + locationIndex + ", Stock: " + stockIndex + ", Updated: " + updatedIndex);
  
  if (skuIndex === -1 || locationIndex === -1 || stockIndex === -1 || updatedIndex === -1) {
    addLog("ERROR: Required columns not found in Inventory Snapshot");
    return;
  }

  var snapshotMap = new Map();

  snapshotData.forEach((row,i)=>{
    var key = row[skuIndex] + "|" + row[locationIndex]; // SKU|Location
    snapshotMap.set(key, {stock:parseInt(row[stockIndex],10)||0, rowIndex:i+2});
    addLog("Existing snapshot entry: " + key + " = " + row[stockIndex] + " (row " + (i+2) + ")");
  });

  var pendingUpdates = new Map();

  latestEntries.forEach(entry=>{
    var [id, ts, sku, qty, mode, source, dest, user, notes] = entry;
    qty = parseInt(qty,10) || 0;
    
    addLog("Processing entry: SKU=" + sku + ", Mode=" + mode + ", Qty=" + qty + ", Source=" + source + ", Dest=" + dest);
    
    // Validate required data for each mode
    if (!sku) {
      addLog("ERROR: SKU is missing for entry");
      return;
    }
    
    if (!mode) {
      addLog("ERROR: Mode is missing for SKU " + sku);
      return;
    }
    
    // Remove global quantity validation - handle it per mode instead
    // if (qty <= 0) {
    //   addLog("ERROR: Quantity must be greater than 0 for SKU " + sku);
    //   return;
    // }

    var applyChange = function(s, loc, change, isAdjustment = false){
      if(!s || !loc) {
        addLog("Skipping change - SKU or Location is empty: SKU=" + s + ", Location=" + loc);
        return;
      }
      var key = s+"|"+loc;
      var newStock = change;
      if(pendingUpdates.has(key)) newStock += pendingUpdates.get(key).stock;
      else if(snapshotMap.has(key)) newStock += snapshotMap.get(key).stock;
      
      // For ADJUSTMENT mode, allow the exact stock level (even negative)
      // For other modes, ensure stock doesn't go below 0
      if (!isAdjustment) {
        newStock = Math.max(0, newStock);
        addLog("Non-adjustment mode: Ensuring stock doesn't go below 0");
      } else {
        addLog("Adjustment mode: Allowing exact stock level (including negative if needed)");
      }
      
      addLog("Applying change: SKU=" + s + ", Location=" + loc + ", Change=" + change + ", New Stock=" + newStock);
      
      pendingUpdates.set(key, {sku:s, location:loc, stock:newStock, rowIndex:snapshotMap.has(key)? snapshotMap.get(key).rowIndex:-1});
    };

    switch(mode){
      case 'RECEIVING':
        if (qty <= 0) {
          addLog("RECEIVING: Quantity must be greater than 0 for SKU " + sku);
          return;
        }
        if(dest && (dest === 'Shop' || dest === 'Warehouse')){
          addLog("RECEIVING: Adding " + qty + " to " + dest);
          applyChange(sku, dest, qty);
        } else {
          addLog("RECEIVING: Invalid destination " + dest + " for SKU " + sku);
          }
          break;
          
      case 'TRANSFER':
        if (qty <= 0) {
          addLog("TRANSFER: Quantity must be greater than 0 for SKU " + sku);
          return;
        }
        if(source && dest && source !== dest){
          addLog("TRANSFER: Moving " + qty + " from " + source + " to " + dest);
          applyChange(sku, source, -qty);
          applyChange(sku, dest, qty);
        } else {
          addLog("TRANSFER: Invalid source/destination - Source: " + source + ", Dest: " + dest);
          }
          break;
          
      case 'ADJUSTMENT':
        // For ADJUSTMENT, allow any quantity (positive, negative, or zero)
        // This allows reducing stock, increasing stock, or setting to zero
        // No quantity validation needed - negative adjustments are valid for corrections
        if(source && (source === 'Shop' || source === 'Warehouse')){
          addLog("ADJUSTMENT: Applying adjustment of " + qty + " at location " + source);
          if (qty < 0) {
            addLog("ADJUSTMENT: Negative adjustment detected - this will reduce stock");
          } else if (qty > 0) {
            addLog("ADJUSTMENT: Positive adjustment detected - this will increase stock");
          } else {
            addLog("ADJUSTMENT: Zero adjustment - no stock change");
          }
          
          // For ADJUSTMENT mode, we need to handle it differently than incremental changes
          // The qty is the adjustment amount, so we need to apply it to current stock
          var key = sku + "|" + source;
          var currentStock = snapshotMap.has(key) ? snapshotMap.get(key).stock : 0;
          var newStock = currentStock + qty; // Add the adjustment to current stock
          
          addLog("ADJUSTMENT: Current stock=" + currentStock + ", Adjustment=" + qty + ", New stock will be=" + newStock);
          
          // Directly update the pendingUpdates map for ADJUSTMENT mode
          pendingUpdates.set(key, {
            sku: sku, 
            location: source, 
            stock: newStock, 
            rowIndex: snapshotMap.has(key) ? snapshotMap.get(key).rowIndex : -1
          });
          
          addLog("ADJUSTMENT: Added to pending updates: " + key + " -> stock " + newStock);
        } else {
          addLog("ADJUSTMENT: Invalid source location " + source + " for SKU " + sku + " - must be Shop or Warehouse");
          }
          break;
          
      case 'SALE':
        if (qty <= 0) {
          addLog("SALE: Quantity must be greater than 0 for SKU " + sku);
          return;
        }
        // For SALE, use source location (where the sale is happening)
        if(source === 'Shop'){
          addLog("SALE: Reducing Shop stock by " + qty);
          applyChange(sku, 'Shop', -qty);
        } else {
          addLog("SALE: Invalid source " + source + " - sales must be from Shop");
          }
          break;
        
      default:
        addLog("Unknown mode: " + mode + " for SKU " + sku);
    }
  });

  addLog("Pending updates: " + JSON.stringify([...pendingUpdates]));

  // Batch write updates
  var rowsToAppend = [];
  var updateCount = 0;
  var appendCount = 0;
  
  pendingUpdates.forEach((data,key)=>{
    addLog("Processing update for " + key + ": stock=" + data.stock + ", rowIndex=" + data.rowIndex);
    
    if(data.rowIndex !== -1){
      addLog("Updating existing row " + data.rowIndex + " for " + key + " to stock " + data.stock);
      snapshotSheet.getRange(data.rowIndex, stockIndex + 1).setValue(data.stock);
      snapshotSheet.getRange(data.rowIndex, updatedIndex + 1).setValue(new Date());
      updateCount++;
    } else {
      addLog("Will append new row for " + key + " with stock " + data.stock);
      rowsToAppend.push([key, data.sku, data.location, data.stock, new Date()]);
      appendCount++;
    }
  });

  if(rowsToAppend.length > 0){
    addLog("Appending " + rowsToAppend.length + " new rows to snapshot");
    snapshotSheet.getRange(snapshotSheet.getLastRow()+1, 1, rowsToAppend.length, 5).setValues(rowsToAppend);
  }
  
  addLog("updateInventorySnapshot completed successfully");
  addLog("Summary: " + updateCount + " existing rows updated, " + appendCount + " new rows added");
}

// ---------------------------
// Update Sales Snapshot
// ---------------------------
function updateSalesSnapshot(latestEntries){
  if(!salesSnapshotSheet) return;

  // Load existing sales snapshot
  var data = salesSnapshotSheet.getDataRange().getValues();
  var headers = data.shift();
  var map = new Map();
  data.forEach((row,i)=>{
    map.set(row[1], {total:parseInt(row[2],10)||0, last7:parseInt(row[3],10)||0, last30:parseInt(row[4],10)||0, lastSold:row[5], rowIndex:i+2});
  });

  var today = new Date();

  latestEntries.forEach(entry=>{
    var [id, ts, sku, qty, mode, source, dest, user, notes] = entry;
    if(mode!=='SALE') return;
    qty = parseInt(qty,10)||0;
    ts = new Date(ts);

    var rec = map.has(sku)? map.get(sku) : {total:0,last7:0,last30:0,lastSold:null,rowIndex:-1};
    rec.total += qty;
    rec.last7 += qty; // 可以后续改为7天滚动窗口计算
    rec.last30 += qty; // 30天滚动窗口
    rec.lastSold = ts;

    if(rec.rowIndex!==-1){
      salesSnapshotSheet.getRange(rec.rowIndex,3).setValue(rec.total);
      salesSnapshotSheet.getRange(rec.rowIndex,4).setValue(rec.last7);
      salesSnapshotSheet.getRange(rec.rowIndex,5).setValue(rec.last30);
      salesSnapshotSheet.getRange(rec.rowIndex,6).setValue(rec.lastSold);
      salesSnapshotSheet.getRange(rec.rowIndex,7).setValue(new Date());
    } else {
      salesSnapshotSheet.appendRow([sku,sku,rec.total,rec.last7,rec.last30,rec.lastSold,new Date()]);
    }
  });
}

// ---------------------------
// Helper
// ---------------------------
function outputJSON(obj){
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
