# 📦 Inventory Admin Page - MVP

## Overview
This is the MVP (Minimum Viable Product) version of the Inventory Management System's Admin Page, focusing on the **Adjustment** functionality. The page allows staff to manually adjust inventory levels for stock counts, damage adjustments, or quality control corrections.

## 🎯 Current Features (MVP)

### ✅ Adjustment Mode (Fully Implemented)
- **Manual Inventory Correction**: Adjust stock levels up or down
- **Location Support**: Works with both Shop and Warehouse locations
- **Adjustment Types**: Increase or decrease stock
- **Form Validation**: Required fields and input validation
- **Real-time Feedback**: Success/error messages with transaction IDs
- **Google Apps Script Integration**: Automatically updates inventory snapshot

### 🔄 Other Modes (Placeholder)
- **Transfer Mode**: Move stock between locations (coming soon)
- **Receiving Mode**: Record new inventory arrivals (coming soon)
- **Sale Mode**: Record sales transactions (coming soon)

## 🚀 How to Use

### 1. Access the Admin Page
- Open `admin-page.html` in a web browser
- The page will automatically load with the Adjustment mode active

### 2. Perform an Inventory Adjustment
1. **Enter SKU**: Type the product's SKU code
2. **Set New Total Quantity**: Enter the new total stock level (not the change amount)
3. **Select Location**: Choose Shop or Warehouse
4. **Enter User Name**: Your name for audit trail
5. **Add Notes**: Optional reason for adjustment
6. **Submit**: Click "Submit Adjustment" button

### 3. View Results
- **Success**: Green message with transaction ID
- **Error**: Red message with error details
- **Form Reset**: Form automatically clears after successful submission

## 🔧 Technical Details

### API Integration
- **Endpoint**: Uses the existing Google Apps Script backend
- **Action**: `adminOperation` with `adminMode: "Adjustment"`
- **Auto-update**: Automatically updates Inventory Snapshot after each operation
- **Snapshot ID Format**: Uses meaningful composite IDs (SKU-LOCATION format) for easy tracking

### Data Flow
```
Admin Form → Google Apps Script → Inventory Log → Auto-Update → Inventory Snapshot
```

### Adjustment Calculation Logic
- **User Input**: New total quantity for the location
- **System Calculation**: Automatically determines the increase/decrease needed
- **Inventory Log**: Records the actual change (positive for increase, negative for decrease)
- **Example**: 
  - Current stock: 50 units
  - User sets new total: 45 units
  - System calculates: -5 units (decrease)
  - Inventory Log shows: -5 (negative number)
  - Final stock: 45 units

### Form Validation
- **Required Fields**: SKU, New Total Quantity, Location, User
- **New Total Quantity**: Must be 0 or greater (allows setting to zero)
- **Location**: Must be Shop or Warehouse

## 📱 User Interface

### Design Features
- **Clean, Modern Interface**: Professional appearance suitable for business use
- **Responsive Design**: Works on desktop and mobile devices
- **Tab Navigation**: Easy switching between operation modes
- **Visual Feedback**: Clear status messages and form validation
- **Accessibility**: Proper labels and form structure

### Color Scheme
- **Primary**: Blue (#3498db) for active elements
- **Success**: Green (#2e7d32) for positive feedback
- **Error**: Red (#721c24) for error messages
- **Info**: Blue (#0c5460) for informational messages

## 🔒 Security & Validation

### Input Validation
- **Client-side**: Form validation prevents invalid submissions
- **Server-side**: Google Apps Script validates all parameters
- **Stock Protection**: Prevents negative stock levels

### Audit Trail
- **User Tracking**: All operations logged with user name
- **Transaction IDs**: Unique identifier for each operation
- **Timestamp**: Automatic recording of operation time
- **Notes**: Optional documentation of adjustment reason

## 🚧 Future Enhancements

### Phase 2 (Next Priority)
- **Transfer Mode**: Move stock between Shop and Warehouse
- **Receiving Mode**: Record new inventory arrivals
- **Recent Activity**: Display actual operation history

### Phase 3 (Later)
- **Sale Mode**: Record customer sales
- **Bulk Operations**: Process multiple adjustments at once
- **User Authentication**: Role-based access control
- **Advanced Reporting**: Export and analytics features

## 🐛 Troubleshooting

### Common Issues

1. **"Network Error" Message**
   - Check internet connection
   - Verify Google Apps Script is deployed and accessible
   - Check browser console for detailed error messages

2. **"Error: [message]"**
   - Read the error message carefully
   - Ensure all required fields are filled
   - Check that location and adjustment type are selected

3. **Form Not Submitting**
   - Verify all required fields are completed
   - Check that quantity is greater than 0
   - Ensure location is selected

### Debug Information
- **Browser Console**: Check for JavaScript errors
- **Network Tab**: Monitor API requests and responses
- **Transaction ID**: Use this ID to track operations in Google Sheets

## 📋 Testing Checklist

### Basic Functionality
- [ ] Page loads without errors
- [ ] Adjustment form displays correctly
- [ ] Form validation works (required fields)
- [ ] Form submission processes successfully
- [ ] Success message displays with transaction ID
- [ ] Form resets after successful submission

### Error Handling
- [ ] Error messages display for invalid inputs
- [ ] Network errors are handled gracefully
- [ ] Form validation prevents invalid submissions

### User Experience
- [ ] Interface is responsive on different screen sizes
- [ ] Tab navigation works correctly
- [ ] Status messages are clear and informative
- [ ] Form fields are properly labeled

## 🔗 Related Files

- **`admin-page.html`**: Main admin page (this file)
- **`gas-related/Code.gs`**: Google Apps Script backend
- **`gas-related/README.md`**: Backend documentation
- **`FINAL-DELIVERABLES.md`**: Complete system specifications

## 📞 Support

For technical issues or questions:
1. Check the browser console for error messages
2. Verify Google Apps Script deployment
3. Review the Google Apps Script logs
4. Check the Google Sheets for data consistency

---

**Note**: This is an MVP version focusing on the Adjustment functionality. Additional features will be implemented in subsequent phases based on user feedback and business requirements.
