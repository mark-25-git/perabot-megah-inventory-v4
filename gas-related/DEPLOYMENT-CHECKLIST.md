# Deployment Checklist - Inventory Management System

## Pre-Deployment Setup

### 1. Google Sheets Preparation
- [ ] Create or verify Google Sheet with ID: `1t8eqdoMh9_1l6DnvD_tqagMWWz0Ctci-_0nz4tqP86g`
- [ ] Ensure sheet names match exactly:
  - [ ] "Inventory Log"
  - [ ] "Inventory Snapshot"
- [ ] Verify column headers in Inventory Log:
  - [ ] TransactionID
  - [ ] Timestamp
  - [ ] SKU
  - [ ] Quantity
  - [ ] Mode
  - [ ] SourceLocation
  - [ ] DestinationLocation
  - [ ] User
  - [ ] Notes
- [ ] Verify column headers in Inventory Snapshot:
  - [ ] SnapshotID
  - [ ] SKU
  - [ ] Location
  - [ ] CurrentStock
  - [ ] LastUpdated
- [ ] Verify location support:
  - [ ] System supports "Shop" and "Warehouse" locations
  - [ ] Each SKU will have separate entries for both locations

### 2. Google Apps Script Setup
- [ ] Go to [script.google.com](https://script.google.com)
- [ ] Create new project or open existing one
- [ ] Replace entire Code.gs content with the updated code
- [ ] Save the project with a descriptive name (e.g., "Inventory Management System v2 - Location Based")

## Deployment Steps

### 3. Deploy as Web App
- [ ] Click "Deploy" → "New deployment"
- [ ] Select type: "Web app"
- [ ] Set description: "Inventory Management API v2 - Location Based"
- [ ] Set execute as: "Me" (your Google account)
- [ ] Set who has access: "Anyone" or "Anyone with Google Account"
- [ ] Click "Deploy"
- [ ] Copy the Web App URL for use in your frontend

### 4. Test the Backend
- [ ] Open the Google Apps Script editor
- [ ] Copy test functions from `test-functions.gs` to your Code.gs
- [ ] Run `testSheetStructure()` to verify sheet setup
- [ ] Run `testCompleteWorkflow()` to test the entire system including location transfers
- [ ] Run `testLocationStockCalculation()` to verify location-specific tracking
- [ ] Check execution logs for any errors
- [ ] Remove test functions from Code.gs after successful testing

### 5. Frontend Integration
- [ ] Update your HTML dashboard to use the new Web App URL
- [ ] Ensure the `addLog` API call includes all required parameters:
  - [ ] sku
  - [ ] quantity
  - [ ] mode (IN/OUT/TRANSFER)
  - [ ] source (location: Shop/Warehouse/Supplier/Customer)
  - [ ] destination (location: Shop/Warehouse/Supplier/Customer)
  - [ ] user (optional)
  - [ ] notes (optional)
- [ ] Test adding a new inventory log entry
- [ ] Verify the snapshot table automatically refreshes
- [ ] Verify stock levels are displayed separately for Shop and Warehouse

## Post-Deployment Verification

### 6. System Testing
- [ ] Add a test inventory log entry via frontend
- [ ] Verify entry appears in Inventory Log sheet
- [ ] Verify Inventory Snapshot automatically updates for both locations
- [ ] Test all three modes:
  - [ ] IN mode (stock added to location)
  - [ ] OUT mode (stock removed from location)
  - [ ] TRANSFER mode (stock moved between locations)
- [ ] Verify stock calculations are correct for each location
- [ ] Test with multiple SKUs and location combinations
- [ ] Verify location-specific stock tracking:
  - [ ] Shop location stock updates correctly
  - [ ] Warehouse location stock updates correctly
  - [ ] Transfers between locations work properly

### 7. Location Transfer Testing
- [ ] Test Warehouse → Shop transfer:
  - [ ] Add stock to Warehouse (IN mode)
  - [ ] Transfer stock from Warehouse to Shop (TRANSFER mode)
  - [ ] Verify Warehouse stock decreases
  - [ ] Verify Shop stock increases
- [ ] Test Shop → Warehouse transfer:
  - [ ] Transfer stock from Shop to Warehouse (TRANSFER mode)
  - [ ] Verify Shop stock decreases
  - [ ] Verify Warehouse stock increases
- [ ] Test mixed scenarios:
  - [ ] Multiple transfers in both directions
  - [ ] Sales from both locations
  - [ ] New stock additions to both locations

### 8. Performance Monitoring
- [ ] Monitor execution time for large datasets
- [ ] Check Google Apps Script execution logs
- [ ] Verify no timeout errors occur
- [ ] Monitor spreadsheet performance
- [ ] Test with realistic data volumes

## Troubleshooting Common Issues

### Sheet Not Found Errors
- [ ] Verify exact sheet names (including spaces)
- [ ] Check sheet exists in the specified spreadsheet
- [ ] Ensure you have edit access to the spreadsheet

### Column Not Found Errors
- [ ] Verify exact column names (case-sensitive)
- [ ] Check column order matches the expected structure
- [ ] Ensure no extra spaces in column headers
- [ ] Verify both SourceLocation and DestinationLocation columns exist

### Snapshot Not Updating
- [ ] Check browser console for JavaScript errors
- [ ] Verify the `addLog` API call is successful
- [ ] Check Google Apps Script execution logs
- [ ] Ensure the web app URL is correct

### Location Tracking Issues
- [ ] Verify SourceLocation and DestinationLocation are set to valid values
- [ ] Check that transfer transactions have different source and destination
- [ ] Ensure locations are exactly "Shop" or "Warehouse" (case-sensitive)
- [ ] Verify both locations are being updated in the snapshot

### Performance Issues
- [ ] Monitor execution time in Google Apps Script
- [ ] Consider reducing data size if processing is slow
- [ ] Check for infinite loops or memory issues
- [ ] Monitor location-specific calculations

## Security Considerations

### Access Control
- [ ] Review who has access to the web app
- [ ] Consider implementing authentication if needed
- [ ] Monitor API usage for unusual patterns
- [ ] Regularly review execution logs

### Data Validation
- [ ] Ensure frontend validates all input parameters
- [ ] Check that stock levels cannot go negative
- [ ] Validate SKU format and quantity values
- [ ] Verify location values are valid (Shop/Warehouse)
- [ ] Implement rate limiting if needed

## Maintenance

### Regular Tasks
- [ ] Monitor execution logs weekly
- [ ] Check for failed executions
- [ ] Verify data integrity monthly
- [ ] Check location-specific stock accuracy
- [ ] Update documentation as needed

### Backup Strategy
- [ ] Export spreadsheet data regularly
- [ ] Keep backup of Google Apps Script code
- [ ] Document any custom modifications
- [ ] Backup location-specific configurations

## Support Resources

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Google Sheets API Reference](https://developers.google.com/sheets/api)
- [Google Apps Script Community](https://developers.google.com/apps-script/community)

## Contact Information

For technical support or questions about this implementation, refer to the project documentation in the `gas-related` folder.

## Location-Specific Notes

### Important Location Rules
- [ ] Only "Shop" and "Warehouse" locations are supported
- [ ] Each SKU must have entries for both locations in the snapshot
- [ ] Transfers must have different source and destination locations
- [ ] Stock cannot go below 0 at any location
- [ ] All transactions automatically update both location snapshots
