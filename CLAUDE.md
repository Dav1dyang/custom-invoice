# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Invoice Tool** - A client-side invoice generator that creates professional, technical-style PDF invoices with customizable styling. Built with vanilla JavaScript, jsPDF, and no framework dependencies. The application runs entirely in the browser with localStorage for client template persistence.

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

PDF generation uses **Option A layout** with condensed headers and perfect alignment:

### Fixed Layout Constants (script.js:1834-1851)
**Single positioning system for all pages:**
- `HEADER_END_Y = 30mm`: Header separator line (all pages)
- `CONTENT_START_Y = 35mm`: Where content begins (all pages - PERFECT ALIGNMENT!)
  - Page 1: FROM/BILL TO grid starts at 35mm
  - Page 2+: Line items table starts at 35mm (same position!)
- `DATA_GRID_HEIGHT = 35mm`: Height of FROM/BILL TO/SPECS grid
- `SECTION_SPACER = 8mm`: Gap between sections
- `ROW_HEIGHT = 10mm`: Line item row height
- `TABLE_HEADER_HEIGHT = 8mm`: Line items table header

**Visual Distinction:**
- Page 1: Logo 35mm × 15mm, INVOICE text **16pt** (larger for first page)
- Page 2+: No logo, INVOICE text **11pt** (condensed)
- Both pages: Header ends at 30mm, content starts at 35mm

### Page Layout
1. **Page 1**: Condensed header (30mm) → FROM/BILL TO grid at y=35mm → line items → payment (bottom)
2. **Page 2+**: Condensed header (30mm) → line items at y=35mm → payment (bottom)
3. **Perfect alignment**: Both pages have content starting at y=35mm
4. Page 1 visually distinct with larger INVOICE text (16pt vs 11pt)
5. More items fit on page 1 (~8-10 items) vs Option B (~5-7 items)
6. Payment section always anchored at bottom with fixed margin

Key variables:
- `maxRowsFitFirstPage`: Items that fit on page 1 (~8-10 items)
- `maxRowsFitContinuationPage`: Items per continuation page (~12-15 items)
- `yItemsTopContinuation`: Fixed position for line items on page 2+ (35mm - same as page 1 grid!)

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

**Checkbox Control** (index.html:337-342):
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

### Invoice Date Defaults

**DATE ISSUED** (script.js:500-508):
- Automatically set to today's date on page load
- Uses JavaScript Date() to calculate current date
- Format: YYYY-MM-DD

**DUE DATE** (index.html:197-207, script.js:460-496):
- Button selection interface: "1 Week", "15 Days", "30 Days"
- Calculates due date from invoice date + selected days
- Default: 30 days (highlighted on load)
- Readonly date field shows calculated result
- Active button gets inverted colors (background/text swap)

**Function:** `setDueDate(days)` - Calculates and sets due date based on invoice date

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

## Design System

### Typography Scale (styles.css:18-26)

**CSS Variables for consistent font sizing - Minimum 10px for readability**:
- `--font-size-h1: 20px` - Page title (INVOICE TOOL)
- `--font-size-h3: 12px` - Section headers (FROM, BILL TO, LINE ITEMS)
- `--font-size-h4: 11px` - Subsection headers (Page Setup, File Upload)
- `--font-size-body: 12px` - Input fields, normal text, form content
- `--font-size-label: 10px` - Form labels, helper text (MINIMUM SIZE)
- `--font-size-button: 11px` - Buttons, interactive elements

**Design Philosophy**:
- All font sizes use CSS variables for consistency
- Clear hierarchy: 20px → 12px → 11px → 10px
- **No text smaller than 10px anywhere** for accessibility and readability
- Monospace font (IBM Plex Mono) throughout entire app
- Increased from previous scale for better readability on all devices

### Button Height System

**Unified 40px height system** (improved from previous multi-tier):
- **All buttons**: 40px height (primary, tertiary)
- **Template action icons**: 40px × 40px (square buttons)
- **Exception - Secondary**: Template icons slightly smaller for visual balance

**Includes**:
- "+ ADD LINE ITEM", "Preview Invoice", "Download PDF" → 40px
- "Import File", "Import Pasted", "Clear All Items" → 40px
- "Load", "1 Week", "15 Days", "30 Days" → 40px
- Template chips (APOSSIBLE, MORAKANA, etc.) → 40px
- Template action icons (💾 ⭐ 🗑️) → 40px × 40px

**Standardization**:
- Primary buttons: `min-height: 40px`, `max-height: 40px`, `padding: 10px 20px`
- All use `font-size: var(--font-size-button)` (11px)
- Consistent typography, spacing, and hover states
- Touch-friendly on mobile (40px minimum target)

### Input Dimensions

**All inputs standardized**:
- Text/Date/Number/File/Select: 36px min-height
- Textareas: 60px min-height
- Consistent padding: 8px-10px
- All use `font-size: var(--font-size-body)` (12px - improved readability)

## CSV Import Interface

**Collapsible Dropdown** (index.html:346-383):
- Matches PDF Settings style exactly
- `<details>` element with "Import Line Items" summary
- Three groups: File Upload, Paste Data, Manage
- Uses settings-grid layout (2 columns desktop, 1 column mobile)
- Full-width action buttons (40px height)

**Styling** (styles.css:135-233):
- Identical to PDF Settings styling
- Same summary hover states
- Same content padding (20px 16px)
- Responsive grid system

## UI/UX Consistency

**Standardized Dimensions:**
- All inputs: 36px height
- All primary buttons: 40px height
- All cards: 16px padding
- Consistent border: 1px solid var(--border)
- Monospace font throughout (IBM Plex Mono)

**Line Items Footer** (index.html:400-406):
- "+ ADD LINE ITEM" button on left
- "Save with template" checkbox on far right (`margin-left: auto`)
- Flex layout with space-between
- Stacks vertically on mobile (button first, checkbox centered)

**Line Items Table**:
- ACTION column cells have no padding (script.js:1079-1082)
- Remove button (×) fills entire cell (`width: 100%`, `height: 100%`, `min-height: 44px`)
- Black background with white × symbol (18px font)
- Hover state turns red (#dc2626)
- No white space above/below button

**Removed Elements:**
- "REV: A" removed from all PDFs and preview (meaningless revision marker)

## Mobile Responsiveness (styles.css:1443-1533)

**Breakpoint**: < 768px

**Mobile Behavior**:
- Template chips/load button stack vertically, full-width
- Due date buttons stack vertically
- Items footer stacks (button, then checkbox centered)
- Preview actions stack
- Settings grids become single column
- Table scrolls horizontally
- All buttons remain 40px height (touch-friendly)

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
1. Adjust layout constants at top of `downloadPDF()` (script.js:1834-1851)
   - **Shared constants**: `HEADER_END_Y`, `CONTENT_START_Y` (all pages use same!)
   - **Other constants**: `DATA_GRID_HEIGHT`, `SECTION_SPACER`, `ROW_HEIGHT`, `TABLE_HEADER_HEIGHT`
2. Update header rendering for visual distinction (script.js:1853-1908)
   - Page 1: INVOICE 16pt (visually distinct), logo 35mm×15mm
   - Page 2+: INVOICE 11pt (condensed)
   - Both: Header ends at 30mm, content starts at 35mm
3. Update `renderLineItems()` for table styling (script.js:~2000+)
4. **Important**: Option A layout - all pages aligned at y=35mm, page 1 distinguished by larger INVOICE text

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
