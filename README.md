# Invoice Tool

A professional invoice generator with authentication, Google Calendar integration, and AI-powered line item parsing.

## Features

- **Secure Authentication**: Magic link email or Google OAuth login via Supabase
- **Template Management**: Save, star, and organize invoice templates with database persistence
- **PDF Generation**: Professional invoices with multiple styles (Outline, Filled, ASCII)
- **Google Calendar Integration**: Import events from your calendar
- **AI-Powered Parsing**: Claude AI analyzes calendar events to generate intelligent line items
- **Responsive Design**: Works on desktop and mobile

## Tech Stack

- **Frontend**: Vue 3 + Vite + Pinia
- **Backend**: Vercel Serverless Functions
- **Database**: Supabase (PostgreSQL with Row Level Security)
- **Authentication**: Supabase Auth
- **PDF**: jsPDF
- **AI**: Anthropic Claude API

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

## Deployment

See [SETUP.md](./SETUP.md) for detailed deployment instructions.

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only) | Yes |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | Yes |
| `ANTHROPIC_API_KEY` | Anthropic API key for Claude | Yes |

## Project Structure

```
├── src/
│   ├── components/      # Vue components
│   ├── composables/     # Vue composables (usePdf, etc.)
│   ├── stores/          # Pinia stores
│   ├── views/           # Page views
│   ├── router/          # Vue Router config
│   └── utils/           # Utilities (Supabase client)
├── api/                 # Vercel serverless functions
│   ├── auth/            # OAuth callback
│   ├── calendar/        # Google Calendar API
│   └── ai/              # Claude AI parsing
├── supabase/            # Database schema
└── public/              # Static assets
```

## License

MIT
