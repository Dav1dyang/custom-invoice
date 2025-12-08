# Invoice Tool Setup Guide

This guide walks you through deploying the Invoice Tool to Vercel with Supabase authentication and Google Calendar integration.

## Prerequisites

- [Vercel Account](https://vercel.com)
- [Supabase Account](https://supabase.com)
- [Google Cloud Console Account](https://console.cloud.google.com)
- [Anthropic API Key](https://console.anthropic.com)

---

## Step 1: Set Up Supabase

### 1.1 Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your **Project URL** and **anon public key** from Settings > API

### 1.2 Run the Database Schema

1. Go to SQL Editor in your Supabase dashboard
2. Copy the contents of `supabase/schema.sql`
3. Paste and run the SQL to create the tables

### 1.3 Enable Google OAuth (Optional but Recommended)

1. In Supabase, go to Authentication > Providers
2. Enable Google provider
3. You'll need to add Google OAuth credentials (see Step 2)

---

## Step 2: Set Up Google Cloud

### 2.1 Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Go to APIs & Services > Library
   - Search for "Google Calendar API"
   - Click Enable

### 2.2 Create OAuth Credentials

1. Go to APIs & Services > Credentials
2. Click "Create Credentials" > "OAuth client ID"
3. Select "Web application"
4. Add authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback`
   - `http://localhost:3000/api/auth/callback` (for development)
5. Note your **Client ID** and **Client Secret**

### 2.3 Configure OAuth Consent Screen

1. Go to APIs & Services > OAuth consent screen
2. Add your app name and support email
3. Add scopes: `calendar.readonly`
4. Add test users if in testing mode

---

## Step 3: Get Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Note your **API Key** (starts with `sk-ant-`)

---

## Step 4: Deploy to Vercel

### 4.1 Import Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "Add New..." > "Project"
3. Import your Git repository

### 4.2 Configure Environment Variables

In Vercel project settings, add these environment variables:

```
# Supabase (get from Supabase dashboard)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key

# Supabase Service Role (Settings > API > service_role key)
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Anthropic (from Anthropic Console)
ANTHROPIC_API_KEY=sk-ant-your-api-key
```

### 4.3 Deploy

1. Click Deploy
2. Wait for the build to complete
3. Your app is now live!

---

## Step 5: Configure Supabase Redirect URLs

1. In Supabase, go to Authentication > URL Configuration
2. Add your Vercel URL to Site URL: `https://your-app.vercel.app`
3. Add redirect URLs:
   - `https://your-app.vercel.app/`
   - `https://your-app.vercel.app/calendar`

---

## Local Development

### Install Dependencies

```bash
npm install
```

### Create `.env.local`

```bash
cp .env.example .env.local
# Edit .env.local with your credentials
```

### Run Development Server

```bash
npm run dev
```

---

## Environment Variables Reference

| Variable | Where to Get | Public/Secret |
|----------|--------------|---------------|
| `VITE_SUPABASE_URL` | Supabase > Settings > API | Public (VITE_ prefix) |
| `VITE_SUPABASE_ANON_KEY` | Supabase > Settings > API | Public (VITE_ prefix) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase > Settings > API | **Secret** |
| `GOOGLE_CLIENT_ID` | Google Cloud Console | Public |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console | **Secret** |
| `ANTHROPIC_API_KEY` | Anthropic Console | **Secret** |

**Important:** Variables prefixed with `VITE_` are bundled into the client-side code and are public. All other variables are server-side only and are never exposed to the client.

---

## Troubleshooting

### "Invalid token" error
- Check that your Supabase keys are correct
- Make sure you're logged in

### "Google Calendar not connected" error
- Click the Calendar tab and connect your Google account
- Make sure your Google OAuth credentials are configured

### "Failed to parse AI response" error
- Check your Anthropic API key
- Verify you have credits in your Anthropic account

### Build fails
- Run `npm install` to ensure all dependencies are installed
- Check for TypeScript/ESLint errors with `npm run lint`

---

## Security Notes

1. **Never commit `.env.local`** - It's in `.gitignore` for a reason
2. **Service role key is powerful** - It bypasses RLS, keep it server-side only
3. **Row Level Security (RLS)** - All database access is protected by user-specific policies
4. **OAuth tokens are encrypted** - Stored securely in Supabase

---

## Features

- **Authentication**: Magic link or Google OAuth login
- **Templates**: Save, star, and organize invoice templates
- **PDF Generation**: Professional invoices with multiple styles
- **Google Calendar**: Import events and auto-generate line items
- **AI Parsing**: Claude analyzes calendar events for intelligent categorization
