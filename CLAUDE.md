# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A client-side invoice generator that creates professional, technical-style PDF invoices with customizable styling. Built with vanilla JavaScript, jsPDF, and no framework dependencies. The application runs entirely in the browser with localStorage for client template persistence.

## Architecture

### Single-Page Application Structure
- **index.html**: Main UI with form inputs, line items table, template management, and live preview
- **script.js**: All application logic including template system, PDF generation, color calculations, and CSV import
- **styles.css**: Complete styling system with theme support and responsive layouts

### Key Systems

**Color System** (script.js:90-313)
- Dynamic contrast calculation using WCAG luminance formulas
- Three style modes: Outline (technical drawing), Filled (datasheet), ASCII (retro terminal)
- Automatic text color generation based on background luminance
- Preset color schemes with live preview synchronization

**Template Management** (script.js:456-1098)
- LocalStorage-based template persistence
- Starred templates (max 2) with quick access chips
- Recent template tracking
- Predefined templates: default-client, tech-company, sample-client, freelance
- Save/load/delete operations with logo data preservation

**PDF Generation** (script.js:1557-2148)
- Multi-page support with intelligent pagination
- Dynamic section height calculation based on content
- Three rendering modes: outline, filled, ASCII art
- Logo aspect ratio preservation
- System font fallback (Helvetica) with optional custom font upload

**CSV Import** (script.js:1101-1228)
- Auto-delimiter detection (comma, tab, semicolon)
- Two-column (description, amount) and three-column (description, qty, rate) formats
- Header row detection and skipping
- File upload and paste-based import

## Color Calculation Logic

The color system ensures readable text by calculating relative luminance and contrast ratios:

1. **Outline Mode**: White background, accent-colored borders, black text
2. **Filled Mode**: Accent background with contrasting text outside boxes, black text inside boxes for readability
3. **ASCII Mode**: Black background, accent-colored text and borders for terminal aesthetic

Critical functions:
- `getLuminance()` (script.js:150): WCAG luminance calculation
- `getContrastRatio()` (script.js:160): Contrast ratio between two colors
- `getComputedColors()` (script.js:223): Returns complete color scheme for current mode

## PDF Multi-Page Logic

PDF generation uses **Option B layout** with page-specific positioning for optimal presentation:

### Fixed Layout Constants (script.js:1669-1690)
**Page 1 - Prominent cover page aesthetic:**
- `PAGE1_HEADER_END_Y = 50mm`: Larger header separator line
- `PAGE1_CONTENT_START_Y = 55mm`: FROM/BILL TO grid starts here (pushed down for visual impact)
- Logo: 50mm × 25mm (larger, professional size)
- INVOICE text: 20pt (prominent)
- Invoice number: 11pt

**Page 2+ - Compact for maximum content:**
- `PAGE2_HEADER_END_Y = 30mm`: Compact header separator
- `PAGE2_CONTENT_START_Y = 35mm`: Line items start here (maximizes space)
- More items fit per page than page 1

**Shared constants:**
- `DATA_GRID_HEIGHT = 35mm`: Height of FROM/BILL TO/SPECS grid
- `SECTION_SPACER = 8mm`: Gap between sections
- `ROW_HEIGHT = 10mm`: Line item row height
- `TABLE_HEADER_HEIGHT = 8mm`: Line items table header

### Page Layout
1. **Page 1**: Large header (50mm) → FROM/BILL TO grid at y=55mm → line items → payment (bottom)
2. **Page 2+**: Compact header (30mm) → line items at y=35mm → payment (bottom)
3. Page 1 emphasizes branding, page 2+ maximizes content efficiency
4. Payment section always anchored at bottom with fixed margin
5. Forward calculation (top-down) for all positioning

Key variables:
- `maxRowsFitFirstPage`: Items that fit on page 1 (~5-7 items)
- `maxRowsFitContinuationPage`: Items per continuation page (~12-15 items)
- `yItemsTopContinuation`: Fixed position for line items on page 2+ (35mm)

## Invoice Number Format

Invoice numbers use a split field format: **IN-{ABBREVIATION}-{SEQUENCE}**

- Example: `IN-CACTW-01` for "Can Art Change The World"
- UI has two separate input fields: `companyAbbrev` and `invoiceSequence`
- Fields are concatenated with "IN-" prefix in `renderPreview()` and `downloadPDF()`
- Template system handles both new format and legacy single-field format for backwards compatibility

## Template System

Templates store:
- Sender/recipient information
- Invoice details (including `companyAbbrev` and `invoiceSequence`) and payment instructions
- PDF settings (paper size, orientation, style mode, accent color)
- **Optional line items** (controlled by checkbox)
- Checkbox preference (`saveLineItems` boolean)
- Logo data as base64 dataURL

Storage keys:
- `invoice_templates`: All saved templates
- `starred_templates`: Array of starred template names (max 3, increased from 2)
- `recent_template`: Last loaded template name

### Optional Line Items Feature

**Checkbox Control** (index.html:316-321):
- Located in Line Items section header
- Checked by default
- Label: "Save items with template"

**Behavior:**
- **Checked**: Template saves current line items array
- **Unchecked**: Template saves empty line items array
- Checkbox state is saved with template
- Loading template restores both checkbox state and items

**Use Cases:**
- **Client templates**: Uncheck to save only client info (reusable for multiple invoices)
- **Complete invoices**: Check to save specific invoice with all items (for records/revisions)

Backwards compatibility: `loadTemplateData()` converts old `invoiceNumber` format to new split fields

### Custom Template Dropdown

**UI Components** (index.html:87-109):
- Input field for template name
- Dropdown toggle button (▼)
- Custom dropdown with sections

**Dropdown Sections** (with icons):
- **★ STARRED**: Up to 3 starred templates (gold stars)
- **⏱ RECENT**: Last loaded template (if not starred)
- **📁 ALL TEMPLATES**: All available templates (alphabetically sorted)

**Interaction:**
- Click ▼ button to open/close dropdown
- Click template name to select
- Click outside or press ESC to close
- Visual feedback on hover (inverted colors)

**Functions:**
- `toggleTemplateDropdown()`: Show/hide dropdown
- `populateTemplateDropdown()`: Build sections dynamically
- `createDropdownSection()`: Create section with title and items
- `selectTemplateFromDropdown()`: Handle template selection

## Development Notes

- No build process required - open index.html directly in browser
- Uses jsPDF from CDN (version 2.4.0)
- LocalStorage for all persistence - no backend
- Responsive design with mobile-optimized controls
- Dark/light theme toggle stored in localStorage

## Common Tasks

**Testing PDF Generation**
1. Fill form fields or load a template
2. Add line items manually or via CSV import
3. Click "Preview Invoice" to see live preview
4. Click "Download PDF" to generate PDF file

**Adding New Color Presets**
1. Add preset to `colorPresets` object (script.js:97-104)
2. Add button in HTML (index.html:273-297)
3. Preset automatically applies color calculations

**Modifying PDF Layout**
1. Adjust page-specific layout constants at top of `downloadPDF()` (script.js:1669-1690)
   - **Page 1 constants**: `PAGE1_HEADER_END_Y`, `PAGE1_CONTENT_START_Y`
   - **Page 2+ constants**: `PAGE2_HEADER_END_Y`, `PAGE2_CONTENT_START_Y`
   - **Shared constants**: `DATA_GRID_HEIGHT`, `SECTION_SPACER`, `ROW_HEIGHT`, `TABLE_HEADER_HEIGHT`
2. Update header rendering for page-specific sizing (script.js:1692-1751)
   - Page 1: Larger fonts (20pt, 11pt), bigger logo
   - Page 2+: Compact header for maximum content space
3. Update `renderLineItems()` for table styling (script.js:1990-2041)
4. **Important**: Page 1 and Page 2+ use different content start positions by design (Option B layout)

**CSV Import Format**
Supports flexible formats with auto-detection:
```
Description, Quantity, Rate
Web Development, 40, 75.00
```
or
```
Description, Amount
Project Setup, 500.00
```
