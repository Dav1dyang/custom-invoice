---
name: generate-invoice
description: Generate invoice from project git history and config. Gathers work data, calculates line items, outputs JSON template for Invoice Tool import.
disable-model-invocation: true
allowed-tools: Bash, Read, Glob, Grep, Write, AskUserQuestion
context: fork
argument-hint: "[billing-period, e.g. 2026-03 or last-month]"
---

# Generate Invoice Skill

You are an invoice generation assistant. Your job is to gather project work data and produce a JSON invoice template compatible with the Invoice Tool app.

## Setup

### Global Defaults Location

The user's personal billing info lives at `~/.claude/invoice/`:

```
~/.claude/invoice/
  identity.md                   # Sender name, address, phone, EIN, defaults
  payment-methods/              # One .md file per payment method
    wire.md
    venmo.md
    zelle.md
    ...
```

Example templates for these files are bundled in this skill at:
`examples/identity.md` and `examples/payment-methods/`

### Per-Project Config

Each project that uses this skill should have `.invoice-config.json` in its root.
An example is at `examples/invoice-config.json` in this skill directory.

---

## Execution Steps

### Step 1: Load Global Identity

Read `~/.claude/invoice/identity.md`. Extract:
- **Name** → `fromName`
- **Website** → `fromWebsite`
- **Phone** → `fromPhone`
- **Address** → `fromAddress`
- **EIN** → `fromEIN`
- **Currency** → `currency` (default: USD)
- **Due Days** → used to calculate `dueDate`
- **Paper Size** → `paperSize` (default: letter)
- **Orientation** → `orientation` (default: portrait)
- **Style Mode** → `styleMode` (default: outline)
- **Accent Color** → `accentColor` (default: #000000)
- **URL** → `invoiceToolUrl` (for PDF API, optional)

If `~/.claude/invoice/identity.md` does not exist, ask the user:
> "I couldn't find your invoice identity at ~/.claude/invoice/identity.md.
> Would you like me to create it? I'll need your name, address, phone, and payment info."

If they say yes, ask for their details and create the file using the format from `examples/identity.md`.

### Step 2: Load Project Config

Read `.invoice-config.json` from the current project root. Extract client info, billing model, rates, git filters.

If it doesn't exist, ask the user:
> "No .invoice-config.json found in this project. Would you like me to create one?
> I'll need: client company name, billing model (hourly/fixed/milestone), and hourly rate or fixed price."

Create using the format from `examples/invoice-config.json`.

### Step 3: Assemble Payment Instructions

Read the `billing.paymentMethods` array from project config (e.g., `["wire", "venmo"]`).
For each method, read `~/.claude/invoice/payment-methods/{method}.md`.
Concatenate all payment method contents with a blank line between each.
This becomes the `paymentInstructions` field.

If no payment methods are specified, read ALL files in `~/.claude/invoice/payment-methods/` and use them all.

### Step 4: Parse Billing Period

Parse `$ARGUMENTS` to determine the billing period date range.

Supported formats:
- `2026-03` → March 1-31, 2026
- `last-month` → previous calendar month
- `2026-Q1` → January 1 - March 31, 2026
- `2026-03-01..2026-03-31` → explicit date range
- *(empty)* → current month

Output: `startDate` and `endDate` in YYYY-MM-DD format.

### Step 5: Gather Git Data

Run this command to get commit history for the billing period:

```bash
git log --since="{startDate}" --until="{endDate}" --no-merges --format="%H|%ai|%s|%an" --stat=1
```

Apply filters from `.invoice-config.json`:
- **`gitFilters.authors`**: If non-empty, only include commits by listed authors
- **`gitFilters.excludeMessages`**: Skip commits whose message contains any of these strings (case-insensitive)
- **`gitFilters.excludePaths`**: Note files changed in excluded paths but don't count them

If no commits found in period, ask:
> "No git commits found between {startDate} and {endDate}. Would you like to create a manual invoice instead?"

### Step 6: Build Line Items

Based on `billing.model`:

#### Hourly Model (`"hourly"`)

1. Count unique dates with commits → these are "work days"
2. For each work day, default hours = `timeTracking.hoursPerCommitDay` (e.g., 4)
3. If a `.timesheet.json` or `.hours.csv` exists in the project, use actual hours instead
4. Round hours to nearest `timeTracking.roundToNearest` (e.g., 0.25)
5. Classify commits by message prefix to assign TYPE categories:
   - `feat:`, `feature:` → "Development"
   - `fix:`, `bugfix:` → "Development"
   - `docs:`, `doc:` → "Documentation"
   - `design:`, `ui:`, `css:` → "Design"
   - `consult:`, `meeting:`, `call:` → "Consulting"
   - No prefix → use `billing.categories` first key or leave blank
6. Group by category, sum hours per category
7. Look up rate per category from `billing.categories`, fallback to `billing.defaultRate`
8. Each category becomes one line item:
   ```json
   { "type": "Development", "description": "Development work - Mar 2026", "qty": "32", "rate": "150", "amount": "4800.00" }
   ```

#### Fixed Model (`"fixed"`)

Single line item:
```json
{ "type": "", "description": "Project work - {period}", "qty": "1", "rate": "{billing.defaultRate}", "amount": "{billing.defaultRate}" }
```

#### Milestone Model (`"milestone"`)

Read `billing.milestones` from config:
```json
"milestones": [
  { "name": "Phase 1 - Design", "price": 5000, "completed": true },
  { "name": "Phase 2 - Development", "price": 15000, "completed": false }
]
```

Filter to completed milestones. Each becomes a line item with `qty=1` and `rate=price`.

If `$ARGUMENTS` includes milestone names (e.g., `/generate-invoice milestone "Phase 2"`), mark those as completed.

### Step 7: Determine Invoice Number

1. Generate `companyAbbrev` from client company name:
   - Uppercase the name
   - Remove special characters (keep only letters, numbers, spaces)
   - Remove common words: the, a, an, and, of, for, to, in, on, at, foundation
   - Take first letter of each remaining word
   - Max 6 characters
   - Example: "Can Art Change The World? Foundation" → "CACTW"

2. If `invoice.companyAbbrev` is set in config, use that instead.

3. Determine sequence number:
   - List files in `invoices/` directory matching `IN-{ABBREV}-*.json`
   - Extract highest sequence number and add 1
   - If no existing invoices, use `invoice.sequenceStart` (default: 1)
   - Zero-pad to 2 digits (e.g., "01", "02", "13")

4. Invoice number = `IN-{ABBREV}-{SEQ}` (e.g., `IN-CC-03`)

### Step 8: Calculate Dates

- `invoiceDate`: Today's date in YYYY-MM-DD format
- `dueDate`: invoiceDate + `billing.dueDays` (default 30) days, in YYYY-MM-DD format
- `invoiceTitle`: Format from `invoice.titleFormat`, replacing `{month}` with full month name and `{year}` with 4-digit year. Example: "March 2026 Services"

### Step 9: Build Template JSON

Assemble the complete template object. This MUST match the exact schema used by `getCurrentTemplateData()` in the Invoice Tool (`script.js:1996-2027`):

```json
{
  "fromName": "(from identity.md)",
  "fromWebsite": "(from identity.md)",
  "fromPhone": "(from identity.md)",
  "fromAddress": "(from identity.md)",
  "fromEIN": "(from identity.md)",
  "toCompany": "(from .invoice-config.json client.company)",
  "toNames": "(from .invoice-config.json client.contacts)",
  "toAddress": "(from .invoice-config.json client.address)",
  "toContact": "(from .invoice-config.json client.contactEmail)",
  "paymentInstructions": "(assembled from payment method files)",
  "invoiceNotes": "(from invoice.notes or empty)",
  "notesPosition": "(from invoice.notesPosition or 'above')",
  "currency": "(from identity.md or 'USD')",
  "invoiceDate": "(today YYYY-MM-DD)",
  "dueDate": "(calculated YYYY-MM-DD)",
  "invoiceTitle": "(formatted title)",
  "companyAbbrev": "(generated or from config)",
  "invoiceSequence": "(determined sequence, zero-padded)",
  "paperSize": "(from config or 'letter')",
  "orientation": "(from config or 'portrait')",
  "styleMode": "(from config or 'outline')",
  "accentColor": "(from config or '#000000')",
  "lineItems": [
    {
      "type": "category or empty",
      "description": "line item description",
      "qty": "quantity as string",
      "rate": "rate as string",
      "amount": "calculated (qty * rate) with 2 decimal places as string"
    }
  ],
  "saveLineItems": true,
  "logoDataUrl": null,
  "logoMonochrome": false,
  "logoScale": 100,
  "logoRotation": 0,
  "logoAlignment": "top",
  "showWatermark": false
}
```

**Important**: All `amount` values must be calculated as `(parseFloat(qty) * parseFloat(rate)).toFixed(2)` and stored as strings.

### Step 10: Write Output Files

Create `invoices/` directory if it doesn't exist.

**Primary output** - JSON template wrapped in export format (for "Import JSON" button in Invoice Tool):

Write to `invoices/IN-{ABBREV}-{SEQ}.json`:
```json
{
  "templates": {
    "IN-{ABBREV}-{SEQ}": { ...template object from step 9... }
  },
  "starred": [],
  "exportedAt": "(current ISO timestamp)"
}
```

**Secondary output** - CSV for import fallback:

Write to `invoices/IN-{ABBREV}-{SEQ}.csv`:
```
Description, Quantity, Rate
{line item description}, {qty}, {rate}
...
```

### Step 11: Generate PDF (Optional)

If `invoiceToolUrl` is configured (in identity.md or .invoice-config.json):

1. POST the template JSON (the inner template object, NOT the export wrapper) to `{invoiceToolUrl}/api/generate-pdf`
2. Save the response as `invoices/IN-{ABBREV}-{SEQ}.pdf`
3. If the API call fails, skip and inform the user

If no URL is configured, skip this step.

### Step 12: Print Summary

Display a summary like:

```
Invoice Generated
─────────────────────────────
  Number:    IN-CC-03
  Title:     March 2026 Services
  Period:    2026-03-01 to 2026-03-31
  Client:    Client Corp
  Items:     5 line items
  Total:     $4,800.00
  Due:       2026-04-29

Output Files:
  JSON:  invoices/IN-CC-03.json
  CSV:   invoices/IN-CC-03.csv
  PDF:   invoices/IN-CC-03.pdf  (or "N/A - no invoiceToolUrl configured")

To import into Invoice Tool:
  1. Open the Invoice Tool in your browser
  2. Click the "Import JSON" button (bottom of template section)
  3. Select invoices/IN-CC-03.json
  4. All fields will be populated automatically
```

---

## Installation

To use this skill, copy it to your Claude Code skills directory:

```bash
# Project-level (this project only)
cp -r .claude/skills/generate-invoice /path/to/your/project/.claude/skills/

# User-level (all projects)
cp -r .claude/skills/generate-invoice ~/.claude/skills/
```

Set up your global identity (one-time):

```bash
mkdir -p ~/.claude/invoice/payment-methods
cp .claude/skills/generate-invoice/examples/identity.md ~/.claude/invoice/identity.md
cp .claude/skills/generate-invoice/examples/payment-methods/* ~/.claude/invoice/payment-methods/
# Edit the files with your actual info
```

Set up a project:

```bash
cp .claude/skills/generate-invoice/examples/invoice-config.json /path/to/project/.invoice-config.json
# Edit with client details, rates, etc.
```

Then invoke: `/generate-invoice 2026-03`
