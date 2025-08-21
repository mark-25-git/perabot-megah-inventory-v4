/**
 * Test Functions for Inventory Management System
 * 
 * These functions can be run manually in Google Apps Script to test the system
 * Copy these functions to your Code.gs file temporarily for testing
 */

/**
 * Test function to add sample inventory log entries
 * Run this function to populate your system with test data
 */
function testAddSampleData() {
  try {
    // Test data for different scenarios including location transfers
    var testEntries = [
      {
        sku: "TEST001",
        quantity: 100,
        mode: "IN",
        source: "Supplier",
        destination: "Warehouse",
        user: "Test User",
        notes: "Initial stock to warehouse"
      },
      {
        sku: "TEST002",
        quantity: 50,
        mode: "IN",
        source: "Supplier",
        destination: "Shop",
        user: "Test User",
        notes: "Initial stock to shop"
      },
      {
        sku: "TEST001",
        quantity: 25,
        mode: "TRANSFER",
        source: "Warehouse",
        destination: "Shop",
        user: "Test User",
        notes: "Transfer from warehouse to shop"
      },
      {
        sku: "TEST002",
        quantity: 10,
        mode: "TRANSFER",
        source: "Shop",
        destination: "Warehouse",
        user: "Test User",
        notes: "Transfer from shop to warehouse"
      },
      {
        sku: "TEST001",
        quantity: 15,
        mode: "OUT",
        source: "Shop",
        destination: "Customer",
        user: "Test User",
        notes: "Sale from shop"
      },
      {
        sku: "TEST002",
        quantity: 5,
        mode: "OUT",
        source: "Warehouse",
        destination: "Customer",
        user: "Test User",
        notes: "Direct sale from warehouse"
      }
    ];
    
    var logSheet = SpreadsheetApp.openById("1t8eqdoMh9_1l6DnvD_tqagMWWz0Ctci-_0nz4tqP86g").getSheetByName("Inventory Log");
    
    if (!logSheet) {
      Logger.log("Error: Inventory Log sheet not found");
      return;
    }
    
    // Add test entries
    for (var i = 0; i < testEntries.length; i++) {
      var entry = testEntries[i];
      var transactionId = Utilities.getUuid();
      var timestamp = new Date();
      
      logSheet.appendRow([
        transactionId,
        timestamp,
        entry.sku,
        entry.quantity,
        entry.mode,
        entry.source,
        entry.destination,
        entry.user,
        entry.notes
      ]);
      
      Logger.log("Added test entry: " + entry.sku + " - " + entry.mode + " " + entry.quantity + 
                 " (" + entry.source + " → " + entry.destination + ")");
    }
    
    Logger.log("Test data added successfully. Run updateInventorySnapshot() to update the snapshot.");
    
  } catch (error) {
    Logger.log("Error adding test data: " + error.toString());
  }
}

/**
 * Test function to add specific location transfer scenarios
 * Tests the core functionality of stock movement between Shop and Warehouse
 */
function testLocationTransfers() {
  try {
    var logSheet = SpreadsheetApp.openById("1t8eqdoMh9_1l6DnvD_tqagMWWz0Ctci-_0nz4tqP86g").getSheetByName("Inventory Log");
    
    if (!logSheet) {
      Logger.log("Error: Inventory Log sheet not found");
      return;
    }
    
    // Test specific transfer scenarios
    var transferTests = [
      {
        sku: "TRANSFER001",
        quantity: 100,
        mode: "IN",
        source: "Supplier",
        destination: "Warehouse",
        user: "Test User",
        notes: "Initial warehouse stock"
      },
      {
        sku: "TRANSFER001",
        quantity: 30,
        mode: "TRANSFER",
        source: "Warehouse",
        destination: "Shop",
        user: "Test User",
        notes: "Move 30 to shop"
      },
      {
        sku: "TRANSFER001",
        quantity: 20,
        mode: "TRANSFER",
        source: "Shop",
        destination: "Warehouse",
        user: "Test User",
        notes: "Return 20 to warehouse"
      },
      {
        sku: "TRANSFER001",
        quantity: 10,
        mode: "OUT",
        source: "Shop",
        destination: "Customer",
        user: "Test User",
        notes: "Sell 10 from shop"
      }
    ];
    
    // Add transfer test entries
    for (var i = 0; i < transferTests.length; i++) {
      var entry = transferTests[i];
      var transactionId = Utilities.getUuid();
      var timestamp = new Date();
      
      logSheet.appendRow([
        transactionId,
        timestamp,
        entry.sku,
        entry.quantity,
        entry.mode,
        entry.source,
        entry.destination,
        entry.user,
        entry.notes
      ]);
      
      Logger.log("Added transfer test: " + entry.sku + " - " + entry.mode + " " + entry.quantity + 
                 " (" + entry.source + " → " + entry.destination + ")");
    }
    
    Logger.log("Transfer tests added. Expected final stock: Warehouse=90, Shop=20");
    
  } catch (error) {
    Logger.log("Error adding transfer tests: " + error.toString());
  }
}

/**
 * Test function to manually trigger snapshot update
 * Run this after adding test data to see the snapshot update
 */
function testUpdateSnapshot() {
  try {
    var result = updateInventorySnapshot();
    Logger.log("Snapshot update result: " + JSON.stringify(result));
  } catch (error) {
    Logger.log("Error updating snapshot: " + error.toString());
  }
}

/**
 * Test function to get current snapshot data
 * Run this to see the current state of your inventory snapshot
 */
function testGetSnapshot() {
  try {
    var result = getSnapshot();
    Logger.log("Snapshot data: " + JSON.stringify(result));
  } catch (error) {
    Logger.log("Error getting snapshot: " + error.toString());
  }
}

/**
 * Test function to verify sheet structure
 * Run this to check if all required sheets and columns exist
 */
function testSheetStructure() {
  try {
    var ss = SpreadsheetApp.openById("1t8eqdoMh9_1l6DnvD_tqagMWWz0Ctci-_0nz4tqP86g");
    
    // Check Inventory Log sheet
    var logSheet = ss.getSheetByName("Inventory Log");
    if (logSheet) {
      var logHeaders = logSheet.getRange(1, 1, 1, logSheet.getLastColumn()).getValues()[0];
      Logger.log("Inventory Log headers: " + logHeaders.join(", "));
      
      var requiredColumns = ["TransactionID", "Timestamp", "SKU", "Quantity", "Mode", "SourceLocation", "DestinationLocation", "User", "Notes"];
      for (var i = 0; i < requiredColumns.length; i++) {
        if (logHeaders.indexOf(requiredColumns[i]) === -1) {
          Logger.log("WARNING: Missing column in Inventory Log: " + requiredColumns[i]);
        }
      }
    } else {
      Logger.log("ERROR: Inventory Log sheet not found");
    }
    
    // Check Inventory Snapshot sheet
    var snapshotSheet = ss.getSheetByName("Inventory Snapshot");
    if (snapshotSheet) {
      var snapshotHeaders = snapshotSheet.getRange(1, 1, 1, snapshotSheet.getLastColumn()).getValues()[0];
      Logger.log("Inventory Snapshot headers: " + snapshotHeaders.join(", "));
      
      var requiredSnapshotColumns = ["SnapshotID", "SKU", "Location", "CurrentStock", "LastUpdated"];
      for (var i = 0; i < requiredSnapshotColumns.length; i++) {
        if (snapshotHeaders.indexOf(requiredSnapshotColumns[i]) === -1) {
          Logger.log("WARNING: Missing column in Inventory Snapshot: " + requiredSnapshotColumns[i]);
        }
      }
    } else {
      Logger.log("ERROR: Inventory Snapshot sheet not found");
    }
    
  } catch (error) {
    Logger.log("Error checking sheet structure: " + error.toString());
  }
}

/**
 * Test function to simulate a complete inventory workflow with location transfers
 * Run this to test the entire system end-to-end including location management
 */
function testCompleteWorkflow() {
  try {
    Logger.log("=== Starting Complete Workflow Test with Location Management ===");
    
    // Step 1: Check current state
    Logger.log("Step 1: Checking current snapshot...");
    testGetSnapshot();
    
    // Step 2: Add test data with location transfers
    Logger.log("Step 2: Adding test data with location transfers...");
    testAddSampleData();
    
    // Step 3: Add specific transfer tests
    Logger.log("Step 3: Adding location transfer tests...");
    testLocationTransfers();
    
    // Step 4: Update snapshot
    Logger.log("Step 4: Updating snapshot...");
    testUpdateSnapshot();
    
    // Step 5: Check updated state
    Logger.log("Step 5: Checking updated snapshot...");
    testGetSnapshot();
    
    Logger.log("=== Complete Workflow Test Finished ===");
    Logger.log("Expected results:");
    Logger.log("- TEST001: Warehouse=75, Shop=10");
    Logger.log("- TEST002: Warehouse=45, Shop=35");
    Logger.log("- TRANSFER001: Warehouse=90, Shop=20");
    
  } catch (error) {
    Logger.log("Error in complete workflow test: " + error.toString());
  }
}

/**
 * Test function to verify location-specific stock calculations
 * Run this to check if stock is properly tracked for each location
 */
function testLocationStockCalculation() {
  try {
    Logger.log("=== Testing Location-Specific Stock Calculations ===");
    
    // Get current snapshot
    var result = getSnapshot();
    if (result.status === "success") {
      var snapshotData = result.data;
      
      // Group by SKU and location
      var stockBySku = {};
      for (var i = 1; i < snapshotData.length; i++) { // Skip header
        var row = snapshotData[i];
        var sku = row[1]; // SKU column
        var location = row[2]; // Location column
        var stock = parseFloat(row[3]) || 0; // CurrentStock column
        
        if (!stockBySku[sku]) {
          stockBySku[sku] = {};
        }
        stockBySku[sku][location] = stock;
      }
      
      // Display results
      for (var sku in stockBySku) {
        Logger.log("SKU: " + sku);
        Logger.log("  Shop: " + (stockBySku[sku]["Shop"] || 0));
        Logger.log("  Warehouse: " + (stockBySku[sku]["Warehouse"] || 0));
        Logger.log("  Total: " + ((stockBySku[sku]["Shop"] || 0) + (stockBySku[sku]["Warehouse"] || 0)));
        Logger.log("---");
      }
    }
    
  } catch (error) {
    Logger.log("Error testing location stock calculation: " + error.toString());
  }
}
