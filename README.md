# Invoice Tool

A professional invoice generator that creates technical-style PDF invoices with dynamic color systems, multiple rendering modes, and smart automation. Built with vanilla JavaScript and jsPDF -- runs entirely in the browser.

## Features

### Triple Style System
- **Outline Mode**: Technical drawing style -- white background, accent-colored borders, black text
- **Filled Mode**: Datasheet style -- colored backgrounds with automatic contrast text
- **ASCII Mode**: Retro terminal aesthetic -- black background, accent-colored text and borders

### Smart Color System
- Dynamic WCAG-compliant contrast calculation for text readability
- 3 curated color presets: Technical Black, Blueprint Blue, Alert Red
- Custom accent color picker with hex input
- Automatic text hierarchy: contrasting colors outside boxes, black text inside for readability

### Client Template Management
- Save/load client templates with all form data
- Star up to 3 templates for quick access via chips
- Recent template tracking
- Optional Firebase cloud sync with Google Sign-In
- Export/import templates as JSON files
- Optional line item persistence per template (pill toggle)

### Invoice Features
- Split invoice number format: IN-{ABBREVIATION}-{SEQUENCE}
- Auto-abbreviation from company name (filters common words, max 6 chars)
- Title/date range field for descriptive reference
- Due date calculator with quick buttons (1 Week, 15 Days, 30 Days)
- Notes section with position control (above or below items)
- Type/category column with conditional display and subtotals
- Custom type management (add/remove/reset categories)

### Line Item Import
- **CSV Import**: File upload or paste, auto-delimiter detection (comma, tab, semicolon)
- **Google Calendar**: Import events as billable line items with configurable hourly rate
- Flexible formats: 2-column (description, amount) or 3-column (description, qty, rate)
- Drag-to-reorder rows

### Invoice Attachments
- Attach PDFs and images (PNG, JPG) to append after the generated invoice
- Upload local files or browse Google Drive via Google Picker
- Drag-to-reorder attachments, preview thumbnails
- Merged into final PDF download using pdf-lib
- 10 MB per file limit, session-only (not saved with templates)

### Professional PDF Output
- IBM Plex Mono typography with Helvetica fallback
- Logo upload with tint, alignment (top/mid/bot), scale, and rotation controls
- Letter/A4 paper sizes, portrait/landscape orientation
- Multi-page support with intelligent pagination and perfect page alignment
- PREVIEW watermark toggle
- Dynamic payment section with type subtotals

### Cloud Features (Optional)
- Firebase Authentication with Google Sign-In
- Firestore cloud template sync (merge local + cloud)
- Google Calendar event import
- Google Drive file picker for attachments
- Graceful offline fallback -- app works fully without Firebase

### Responsive Design
- Mobile-friendly interface with touch-optimized controls
- Adaptive layouts for all screen sizes
- Dark/light theme toggle

## Quick Start

1. Open `index.html` in your browser (or deploy to Vercel)
2. Select a style mode and accent color in PDF Settings
3. Fill in sender/recipient information
4. Add line items manually, via CSV import, or from Google Calendar
5. Optionally attach supporting documents (receipts, orders)
6. Preview and download your PDF

## File Structure

```
├── index.html              # Main application interface
├── script.js               # Core logic, PDF generation, integrations
├── styles.css              # Complete styling system with theme support
├── api/
│   └── config.js           # Vercel serverless function for Firebase config
├── fonts/
│   ├── IBM_Plex_Mono/      # Bold and Regular TTF
│   ├── Rubik/              # Multiple weight variants
│   └── DM_Mono/            # Multiple weight variants
├── CLAUDE.md               # Technical documentation for developers
├── README.md               # This file
└── vercel.json             # Deployment config with font caching
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported

## Technical Details

- **Pure JavaScript** -- No framework dependencies
- **jsPDF 2.4.0** -- Invoice PDF generation
- **pdf-lib 1.17.1** -- PDF merging for attachments
- **Firebase 10.12.0** -- Optional cloud sync and Google Auth
- **LocalStorage** -- Client template persistence
- **Responsive CSS Grid** -- Modern layout system
- **IBM Plex Mono** -- Monospace typography throughout

## License

Open source -- feel free to modify and use for your invoicing needs.

---

**Built for freelancers, agencies, and businesses who want professional, technical-style invoices with modern design and smart automation.**
