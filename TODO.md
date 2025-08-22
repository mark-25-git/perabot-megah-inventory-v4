# TODO - Admin Page Updates

## Connection Section
- [x] Make connection section minimal and less prominent
- [x] Keep only essential connection status info

## Receiving Section
- [x] Make "Refresh Product List" button tiny and less prominent
- [x] Remove "Refresh Product List" button entirely
- [x] Hide search tips by default, show only info icon
- [x] Make info icon clickable to toggle tips display on/off
- [x] Remove the detailed search result count display

## Transfer Section
- [x] Change transfer icon in section header to two arrows switching icon

## Adjustment Section
- [x] Remove mention of negative adjustments
- [x] Add frontend validation to prevent negative input values
- [x] Add current stock level display above "New Stock Level" input
- [x] Show current stock after user selects SKU and location
- [x] Fix current stock indicator positioning (between location and new stock level)
- [x] Add loading indicator while fetching current stock data
- [x] Position current stock display correctly between location buttons and New Stock Level label

## Implementation Notes
- Focus on user experience improvements
- Keep interface clean and minimal
- Ensure proper validation without mentioning negative values
- Make search tips toggleable for better UX

## Search Form Unification
- [x] Unify search SKU form groups across all sections
- [x] Remove search tips from all sections for cleaner interface
- [x] Unify search input field placeholders across all sections
- [x] Make all sections' search form groups dynamic like receiving section
- [x] Maintain consistent structure and styling

## Performance Optimization - Product Loading Refactor
- [x] Refactor product loading to load SKU list once for all sections
- [x] Remove duplicate API calls to getProducts
- [x] Create centralized product loading function
- [x] Update all sections to use shared product data
- [x] Enhance page performance by reducing API calls
- [x] Maintain dynamic loading states for all sections
- [x] Ensure all sections still show loading/error states appropriately

## Completed Changes ✅
- Connection section is now minimal with just status indicator and refresh button
- Refresh Product List button is now tiny and less prominent
- Search tips are hidden by default with toggleable info icon
- Transfer section uses swap-horiz icon (two arrows switching)
- Adjustment section no longer mentions negative values
- Frontend validation prevents negative input (min="0")
- Current stock level display shows after SKU and location selection
- Sales section has sales channel buttons (Shopee, Lazada, Tiktok, Live, Website)
- All changes maintain the existing design system and styling

## Sales Section Redesign - Bulk Processing
- [x] Redesign sales section to support bulk sales records
- [x] Replace multiple input rows with single input row + dynamic table
- [x] Add dynamic table to display added sales records
- [x] Implement "Add to Table" button functionality
- [x] Add delete button for each table row
- [x] Hide table when empty (no records)
- [x] Make product name column responsive (hidden on mobile)
- [x] Ensure product names wrap properly to save vertical space
- [x] Maintain existing sales channel buttons functionality
- [x] Keep batch-level fields (User Name, Sales Details) at top
- [x] Implement bulk submission to existing API endpoint
- [x] Add proper validation before adding records to table
- [x] Ensure responsive design for all screen sizes
- [x] Test bulk processing with existing backend (no Code.gs changes needed)
