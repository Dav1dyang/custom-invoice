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
- Automatic text color generation based ohn background luminance
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

**Logo Upload UI** (index.html ~line 267-298, styles.css ~line 1026-1100)

- Compact row layout: 40x40 thumbnail + stretch "Select Logo" button
- Controls grid appears below upload row only when a logo is loaded
- Tint pill toggle (`.pill-toggle.logo-tint-btn`, wraps hidden checkbox, inverts bg/fg when active)
- Align buttons (Top/Mid/Bot), Scale %, Rotate ° in 2x2 grid
- CSS classes: `.logo-upload-row`, `.logo-thumb`, `.pill-toggle.logo-tint-btn`, `.logo-controls-grid`
- Tint `.active` class synced on checkbox change and template load

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
5. More items fit on page 1 (~~8-10 items) vs Option B (~~5-7 items)
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

### Auto-Abbreviation Generation (script.js:7-21)

**Smart abbreviation from company name:**

- `generateAbbreviation(name)` creates abbreviation from "BILL TO" company name
- Removes common words (the, a, an, and, of, for, to, in, on, at, foundation)
- Takes first letter of each significant word
- Maximum 6 characters
- Auto-fills on company name blur event (only if abbreviation field is empty)

**Examples:**

- "Can Art Change The World? Foundation" → "CACTW"
- "Tech Client Inc." → "TCI"
- "Sample Client" → "SC"

## Invoice Title/Date Range Field

**Purpose**: Add descriptive title or date range to invoice for reference

**Field** (index.html:193-196):

- Located in Invoice Details section, right after invoice number
- Text input: "TITLE/DATES"
- Placeholder: "e.g., October Services, Q4 2025"

**Display:**

- Appears in preview under invoice number (smaller font, 9px, opacity 0.8)
- Appears in PDF under invoice number (9pt font)
- Only shows if filled (conditional rendering)
- Saves with template

## Notes Section with Position Control

**Purpose**: Add additional notes or special instructions to invoice

**Field** (index.html:226-245):

- Located after Payment Instructions, before PDF Settings
- Position radio buttons: "Above Items" (default) or "Below Items"
- Textarea input with 3 rows
- Placeholder: "Additional notes or special instructions..."

**Position Options:**

- **Above Items**: Notes appear between FROM/BILL TO grid and line items
- **Below Items**: Notes appear between line items and payment/totals section

**Display:**

- Preview: Notes position changes based on selected radio button
- PDF: Notes render in selected position (page 1 only, not repeated on page 2+)
- Only shows if filled (conditional rendering)
- Saves position preference with template
- Dynamic height calculation in PDF based on content
- Multi-line support with proper wrapping

**PDF Layout Impact:**

- Above: Takes space after grid, reduces items on page 1
- Below: Takes space before payment, reduces items on page 1
- Long notes: Significantly fewer items on page 1 (~5-7 vs ~8-10)
- Pagination automatically adjusts for either position

## Type/Category Column (Conditional Display)

**Purpose**: Categorize line items by type (Labor, Materials, Equipment, etc.)

**Field** (index.html:402, script.js:75):

- First column in line items table
- Text input with datalist suggestions
- Suggestions: Labor, Materials, Equipment, Consulting, Design, Development
- Optional - can be left blank

**Conditional Display Logic:**

- `hasAnyTypes(items)` checks if any line item has a type filled
- **If any type exists**: TYPE column shows in preview and PDF
- **If no types**: TYPE column hidden, description column wider

**Column Widths** (must total 100% for proper alignment):

- **With TYPE**: TYPE 13%, DESC 42%, QTY 10%, RATE 15%, AMT 20% (Total: 100%)
- **Without TYPE**: DESC 50%, QTY 15%, RATE 15%, AMT 20% (Total: 100%)

**Column Alignment** (professional invoice standards):

- **TYPE**: Center-aligned (categorical data, balanced in narrow column)
- **DESCRIPTION**: Left-aligned (text content, natural reading flow)
- **QTY/HRS**: Center-aligned (numeric but not money, balanced appearance)
- **RATE**: Right-aligned (money/currency, financial standard for decimal alignment)
- **AMOUNT**: Right-aligned + Bold (money/currency, emphasized totals)

**Implementation:**

- PDF: Alignment set with jsPDF `{ align: 'center' }` or `{ align: 'right' }` (script.js:2380-2442)
- Preview: CSS nth-child selectors for conditional alignment (styles.css:1390-1434)
- Both preview and PDF use identical alignment for consistency

**Behavior:**

- Saves with line items in templates
- Restores when loading templates
- Type field optional - works with or without categorization
- Type dropdown constrained to column width (no overlap)

## Type Subtotals Feature

**Purpose**: Show subtotals grouped by type before final total

**Logic** (script.js:1471-1492):

- `calculateSubtotalsByType(items)` groups items by type
- Returns: `typeGroups` (object), `uncategorizedTotal`, `hasTypes` (boolean)

**Display:**

- **Only shows if any items have types filled**
- Subtotals sorted alphabetically by type name
- Uncategorized items shown as "Other:" (if mixed typed/untyped items)
- No subtotals if no types exist (just shows TOTAL)

**Example output:**

```
Labor: $650.00
Materials: $350.00
Other: $100.00
TOTAL (USD): $1100.00
```

**PDF Layout Impact:**

- Payment section height dynamically adjusts based on number of type subtotals
- More types = taller payment section = slightly fewer items on page 1
- Fully flexible and adaptive

## Template System

Templates store:

- Sender/recipient information
- Invoice details (including `companyAbbrev`, `invoiceSequence`, `invoiceTitle`) and payment instructions
- Notes (`invoiceNotes`)
- PDF settings (paper size, orientation, style mode, accent color)
- **Optional line items with types** (controlled by checkbox)
- Checkbox preference (`saveLineItems` boolean)
- Logo data as base64 dataURL

Storage keys:

- `invoice_templates`: All saved templates
- `starred_templates`: Array of starred template names (max 3, increased from 2)
- `recent_template`: Last loaded template name

### Optional Line Items Feature

**Pill Toggle Control** (index.html, items footer):

- Located in Line Items footer (far right)
- Checked by default, uses `.pill-toggle.active` pattern
- Label: "Save items"

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

### Two-Tier Button Height System

**CSS Variables**: `--btn-primary-height: 40px`, `--btn-compact-height: 32px`

**PRIMARY (40px)** — main action buttons:

- "+ ADD LINE ITEM", "Download PDF", "Load", "1 Week / 15 Days / 30 Days"
- "Import File", "Import Pasted", "Clear All Items"
- Template action icons (💾 ⭐ 🗑️) → 40px × 40px
- Export/Import JSON buttons
- Auth button, theme toggle

**COMPACT (32px)** — secondary/filter controls:

- Template chips (starred/recent)
- Color preset buttons
- Google Calendar select/deselect buttons
- Logo tint, align, scale/rotate controls
- Pill toggles (see below)

### Pill Toggle Pattern

**`.pill-toggle`** — unified on/off control replacing all checkbox labels:

- 32px height, rounded pill shape (`border-radius: 16px`)
- `.active` class inverts bg/fg when checked
- Hidden checkbox inside (`position: absolute; opacity: 0`)
- JS syncs `.active` class on `change` event and template load

**Used for**: "Save items", "Watermark", "Group titles", Logo "Tint"

### Border System

- **UI chrome** (cards, buttons, section borders): `1px solid var(--border)`
- **Invoice preview** elements (`.out`, `.invoice-grid`, `.invoice-table`, `.invoice-summary`): `0.5px` — mimics PDF aesthetics

### Template Deletion Cleanup

When a template is deleted, both starred and recent references are cleared:
- `removeStarredTemplate(name)` — removes from starred array
- `clearRecentTemplate(name)` — removes from recent if it matches

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
- "Save items" pill toggle on far right (`margin-left: auto`)
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
- "TAX (0%): $0.00" removed from all PDFs and preview (unused, all amounts are final)

## Flexible PDF Layout System

**Dynamic Sections** (all adapt based on content):

1. **Notes Section** (script.js:1495-1512, 2277-2313):
  - `calculateNotesHeight()` computes height based on content
  - 0 height if no notes (no section rendered)
  - Up to ~30mm for long notes
  - Automatically wraps text and calculates lines
2. **Payment/Totals Section** (script.js:2028-2061):
  - `calculatePaymentHeight()` dynamically sizes based on:
    - Payment instruction length
    - Number of type subtotals (0 to many)
  - Minimum 25mm, grows as needed
  - Returns larger of payment or totals section height
3. **Pagination** (script.js:2066-2093):
  - Calculates available space accounting for all dynamic sections
  - Page 1: Grid + Notes + Line Items + Payment
  - Page 2+: Line Items + Payment (no grid/notes)
  - Automatically adjusts items per page

**Robustness:**

- No notes + no types: Maximum items on page 1 (~10-12)
- Long notes: Fewer items on page 1 (~5-7), overflow to page 2
- Many type subtotals: Larger payment section, auto-adjusts
- All combinations work without layout breaking
- Maintains consistent margins and spacing

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

## Toast Notification System

**Non-blocking notifications** replace all browser `alert()`, `confirm()`, and `prompt()` dialogs.

**Functions:**

- `showToast(message, type, duration)` - Types: `'success'` (green), `'error'` (red), `'info'` (neutral), `'warning'` (orange). Default duration 3000ms, errors 5000ms.
- `showConfirmToast(message, onConfirm, onCancel)` - Non-blocking confirm with Yes/Cancel buttons. No auto-dismiss.
- `dismissToast(toast)` - Manually dismiss a toast.

**CSS:** `.toast-container` fixed at bottom-center, toasts stack upward via `flex-direction: column-reverse`. Slide-in/out animations via `@keyframes`.

## PREVIEW Watermark

**Dual watermark** appears in both HTML preview and downloaded PDF.

- **HTML**: CSS `::after` pseudo-element on `.out.show-watermark`, rotated -45deg, semi-transparent
- **PDF**: `renderPDFWatermark()` called on every page, uses jsPDF GState for opacity 0.06, 60pt text at 45 degrees
- **Toggle**: Pill toggle `#showWatermark` in PDF Settings (default: checked/active). Preference saved with template.

## Invoice Attachments

**Purpose**: Attach supporting documents (receipts, order confirmations, etc.) that get appended as additional pages after the generated invoice in the final PDF download.

### Architecture

- **pdf-lib 1.17.1** (CDN) handles merging — jsPDF 2.4.0 cannot merge existing PDFs
- **Flow**: jsPDF generates invoice → `doc.output('arraybuffer')` → pdf-lib loads invoice → appends attachments → saves merged PDF
- **Google Picker API** (`apis.google.com/js/api.js`) for Drive file selection
- **Session-only**: Attachments are NOT saved with templates (too large for localStorage/Firestore)

### UI Section (index.html, between Notes and PDF Settings)

- Collapsible `<details class="attachment-settings">` matching existing pattern
- Two-column grid: Local Upload (file input, multi-select) | Google Drive (Browse Drive button)
- Attachment list with drag-to-reorder, thumbnails, file size, type badges, remove buttons
- Clear All button with confirm toast
- File count and total size display

### Supported File Types

- **PDF** (application/pdf): All pages copied and appended
- **PNG** (image/png): Embedded on a new page, centered and scaled to fit
- **JPG** (image/jpeg): Embedded on a new page, centered and scaled to fit
- **Max size**: 10 MB per file

### Key Functions (script.js)

- `handleAttachmentUpload(event)` — Process local file input, validate, generate thumbnails for images
- `addAttachmentFromData(name, mimeType, arrayBuffer, thumbnailUrl)` — Add to `invoiceAttachments[]` array
- `renderAttachmentList()` — Build attachment list DOM with drag-to-reorder
- `removeAttachment(id)` / `clearAllAttachments()` — Remove with confirm toast
- `openDrivePicker()` — Open Google Picker for Drive file selection (requires sign-in)
- `downloadDriveFile(fileId, name, mimeType, sizeBytes)` — Download file from Drive API
- `mergeAttachmentsIntoPDF(invoiceBytes)` — Core merge function using pdf-lib
- `validateAttachment(file)` — Check type and size constraints

### Google Drive Integration

- Reuses existing Firebase OAuth token (`gcalAccessToken`)
- Added `drive.readonly` scope to both auth entry points (main sign-in and calendar connect)
- **Picker API key**: Uses optional dedicated Picker API key (`FIREBASE_CONFIG.googlePickerApiKey` from `GOOGLE_PICKER_API_KEY` env var); OAuth token alone is sufficient when no key is configured. **Do NOT pass the Firebase API key** (`FIREBASE_CONFIG.apiKey`) to the Picker — it causes an uncatchable "The API developer key is invalid" error dialog because Firebase keys typically don't have the Picker API enabled.
- Google Picker handles folder navigation, search, multi-select
- Files downloaded via Drive API v3 (`/files/{id}?alt=media&supportsAllDrives=true`)
- **Requires Google Drive API v3 enabled** in the Google Cloud project (APIs & Services > Library). The Picker API is separate and works without it, but file download requires the Drive API.

#### Drive Download Error Handling (script.js `downloadDriveFile`)

- **401**: Token expired — automatically re-authenticates with `drive.readonly` scope via popup, retries download once
- **403**: Parses the Google API JSON error response body for the actual reason:
  - "has not been used in project" / "it is disabled" → shows actionable message to enable Drive API
  - Other reasons → shows Google's error message directly
- **No re-auth on 403**: Unlike 401, a 403 does not trigger re-auth popup (avoids bad UX when the real issue is API not enabled, not missing scope)
- `supportsAllDrives=true` query param included for files in shared/team drives

### PDF Merge Logic (downloadPDF modification)

```
1. doc.output('arraybuffer') → invoiceBytes
2. PDFLib.PDFDocument.load(invoiceBytes) → mergedPdf
3. For each attachment:
   - PDF: PDFDocument.load(data) → copyPages → addPage
   - Image: embedPng/embedJpg → addPage → drawImage (centered, scaled to fit with margins)
4. mergedPdf.save() → Blob → download
5. Fallback: if merge fails, download invoice without attachments
```

### CSS Classes

- `.attachment-settings` — Collapsible details (same pattern as pdf-settings, csv-import-settings)
- `.attachment-content` — Content area (same pattern as pdf-content)
- `.attachment-list` — Flex column container for attachment items
- `.attachment-item` — Individual attachment row (draggable)
- `.attachment-thumb` / `.attachment-pdf-icon` — 36x36 thumbnail or PDF text icon
- `.attachment-name` / `.attachment-size` / `.attachment-type-badge` — Item metadata
- `.attachment-remove` — 28x28 remove button (red on hover)
- `.attachment-drag-handle` — Drag handle indicator

### Error Handling

- File too large: Toast with size limit
- Invalid file type: Toast with accepted types
- PDF parse failure: Per-attachment try/catch, skips failed files, continues others
- Drive auth expired (401): Auto re-auth popup with drive scope, then retry
- Drive API not enabled (403): Parses Google error response, shows specific message to enable Drive API in Cloud Console
- Drive download forbidden (403, other): Shows Google's actual error message (e.g., file restrictions, domain policy)
- pdf-lib not loaded: Falls back to invoice-only download with warning toast
- Merge failure: Falls back to invoice-only download with warning toast

## Cloud Template System (Firebase)

**Optional** Firebase integration for cloud template sync and unified Google Sign-In.

### Setup

1. Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
2. Enable Google Sign-In in Authentication > Sign-in method
3. Create a Firestore database in production mode
4. Add security rules: `allow read, write: if request.auth.uid == userId`
5. Fill in `FIREBASE_CONFIG` in `script.js` with your project settings

### Architecture

- Firebase SDK loaded via CDN (compat mode): firebase-app, firebase-auth, firebase-firestore
- **Graceful fallback**: App works fully offline with localStorage when Firebase is not configured
- **Unified Auth**: Single Google sign-in provides both Firestore access AND Google Calendar API access
- **Firestore structure**: `users/{uid}/templates/{name}` - each user has their own template collection

### Functions

- `initFirebase()` - Initialize Firebase, set up auth listener
- `handleAuthClick()` - Toggle sign-in/sign-out
- `saveTemplateToCloud(name, data)` - Save template to Firestore
- `loadTemplateFromCloud(name)` - Load single template from Firestore
- `listCloudTemplates()` - List all user templates from Firestore
- `deleteTemplateFromCloud(name)` - Delete template from Firestore
- `syncTemplates()` - Merge local + cloud templates and starred list (adds missing from each side)
- `saveStarredToCloud()` - Push starred templates list to Firestore (`users/{uid}/meta/preferences`)
- `loadStarredFromCloud()` - Fetch starred templates list from Firestore
- `exportTemplatesJSON()` - Download all templates as JSON file
- `importTemplatesJSON(event)` - Upload and merge JSON template file

### Firestore Security Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/templates/{templateId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /users/{userId}/meta/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Firebase Config via Vercel API

Firebase config is **not** hardcoded in `script.js`. Instead:

- `api/config.js` — Vercel serverless function that reads env vars and returns Firebase config as JSON
- `loadFirebaseConfig()` — Fetches `/api/config` on page load before `initFirebase()`
- **Graceful fallback**: If the API route is unavailable (local dev without Vercel), Firebase is simply disabled and the app works fully offline with localStorage
- **Env vars** must be set in Vercel dashboard (Settings > Environment Variables): `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_APP_ID`
- **Optional env var**: `GOOGLE_PICKER_API_KEY` — dedicated API key with the Picker API enabled (for Google Drive file picker). If not set, the Picker works with OAuth token alone. **Do not reuse `FIREBASE_API_KEY` for the Picker** — Firebase keys lack Picker API access and cause an uncatchable error dialog.

## Development Notes

- No build process required - open index.html directly in browser
- Uses jsPDF from CDN (version 2.4.0)
- LocalStorage for all persistence - no backend required
- Optional Firebase for cloud sync (config served via Vercel API route; graceful fallback when not configured)
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

