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

PDF generation uses **fixed top-down positioning** for consistent alignment across pages:

### Fixed Layout Constants (script.js:1630-1644)
- `HEADER_END_Y = 30mm`: Where header separator line appears on all pages
- `CONTENT_START_Y = 35mm`: Fixed position where content begins on ALL pages
  - Page 1: FROM/BILL TO grid starts here
  - Page 2+: Line items table starts here (same alignment!)
- `DATA_GRID_HEIGHT = 35mm`: Height of FROM/BILL TO/SPECS grid
- `SECTION_SPACER = 8mm`: Gap between sections
- `ROW_HEIGHT = 10mm`: Line item row height

### Page Layout
1. **Page 1**: Compact header → FROM/BILL TO grid at y=35mm → line items → payment (bottom)
2. **Page 2+**: Compact header → line items at y=35mm (aligned with page 1 grid) → payment (bottom)
3. All pages use same `CONTENT_START_Y` for perfect vertical alignment
4. Payment section always anchored at bottom with fixed margin
5. Forward calculation (top-down) instead of backward calculation

Key variables:
- `maxRowsFitFirstPage`: Items that fit on page 1 (calculated from available space)
- `maxRowsFitContinuationPage`: Items per continuation page
- `yItemsTopContinuation`: Fixed position for line items on page 2+ (equals CONTENT_START_Y)

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
- Logo data as base64 dataURL

Storage keys:
- `invoice_templates`: All saved templates
- `starred_templates`: Array of starred template names (max 3, increased from 2)
- `recent_template`: Last loaded template name

Backwards compatibility: `loadTemplateData()` converts old `invoiceNumber` format to new split fields

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
1. Adjust fixed layout constants at top of `downloadPDF()` (script.js:1630-1644)
   - `HEADER_END_Y`: Header separator line position
   - `CONTENT_START_Y`: Where content begins on all pages (critical for alignment!)
   - `DATA_GRID_HEIGHT`, `SECTION_SPACER`, `ROW_HEIGHT`: Section dimensions
2. Update `renderLineItems()` for table styling (script.js:1990-2041)
3. **Important**: Maintain `CONTENT_START_Y` consistency across all pages for alignment

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
