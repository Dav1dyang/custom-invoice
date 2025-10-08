# Invoice Tool

A professional invoice generator that creates clean, datasheet-style PDF invoices with dynamic color systems and technical drawing aesthetics.

## Features

### 🎨 **Dual Style System**
- **Clean Outline Mode**: Technical drawing style with no fills, pure outlines only
- **Filled Background Mode**: Vibrant datasheet style with bright fills and color hierarchy

### 🌈 **Smart Color System**
- **Dynamic contrast calculation** - Text automatically adapts to background luminance
- **6 curated color presets**: Technical Black, Blueprint Blue, Neon Green, Hi-Fi Orange, Tech Purple, Alert Red
- **Intelligent text hierarchy**: Contrasting colors outside boxes, black text inside boxes for readability

### 👥 **Client Template Management**
- Save and load client information templates
- Store contact details, payment instructions, and company info
- Local storage persistence across sessions

### 📊 **CSV/Spreadsheet Import**
- Import line items from CSV files or Google Sheets
- Copy/paste support for direct spreadsheet data
- Auto-detection of delimiters (comma, tab, semicolon)
- Flexible formats: 2-column (description, amount) or 3-column (description, qty, rate)

### 📄 **Professional PDF Output**
- Embeddable custom fonts (Rubik Mono One headers, DM Mono Light body)
- Logo upload with automatic aspect ratio preservation
- Letter/A4 paper sizes with portrait/landscape orientation
- High-quality technical typography

### 📱 **Responsive Design**
- Mobile-friendly interface
- Touch-optimized controls
- Adaptive layouts for all screen sizes

## Quick Start

1. **Open** `index.html` in your browser
2. **Select style mode**: Choose between Clean Outline or Filled Background
3. **Pick accent color**: Use presets or custom color picker
4. **Fill in details**: Add sender/recipient information and invoice parameters
5. **Add line items**: Manual entry or CSV import
6. **Generate**: Preview and download your professional PDF

## File Structure

```
├── index.html          # Main application interface
├── styles.css          # Complete styling system
├── script.js           # Core functionality and PDF generation
└── README.md          # This file
```

## Color System Logic

### Outline Mode (Technical Drawing)
- White background, no fills
- Accent-colored borders and headers
- Black text throughout
- Clean, minimal aesthetic

### Filled Mode (Datasheet)
- **Background**: User-selected accent color
- **Text outside boxes**: Automatically calculated contrasting shade
  - Dark backgrounds → Light text in same color family
  - Light backgrounds → Dark text in same color family
- **Text inside boxes**: Always black for maximum readability
- **Box fills**: Bright version (60% lightness) for info panels
- **Table fills**: Subtle version (85% lightness) for line items

## CSV Import Format

Supports multiple formats:
```csv
Description, Quantity, Rate
Web Development, 40, 75.00
Consulting, 5, 150.00
```

Or simplified:
```csv
Description, Amount
Project Setup, 500.00
Monthly Maintenance, 200.00
```

## Browser Compatibility

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers supported

## Technical Details

- **Pure JavaScript** - No framework dependencies
- **jsPDF** - Professional PDF generation
- **Local Storage** - Client template persistence
- **Responsive CSS Grid** - Modern layout system
- **Web Fonts** - IBM Plex Mono UI typography

## License

Open source - feel free to modify and use for your invoicing needs.

---

**Perfect for freelancers, agencies, and businesses who want professional, technical-style invoices with modern design and smart automation.**