// Vercel Serverless Function: Handle Google OAuth Callback
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow GET (OAuth callback)
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state, error: oauthError } = req.query

  // Handle OAuth errors
  if (oauthError) {
    return res.redirect(`/?error=${encodeURIComponent(oauthError)}`)
  }

  if (!code) {
    return res.redirect('/?error=missing_code')
  }

  try {
    // Parse state to get user ID (passed from frontend)
    let userId
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      userId = stateData.userId
    } catch {
      return res.redirect('/?error=invalid_state')
    }

    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.VERCEL_URL || 'http://localhost:3000'}/api/auth/callback`,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', tokenData)
      return res.redirect('/?error=token_exchange_failed')
    }

    // Store the tokens in Supabase
    const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

    const { error: dbError } = await supabase
      .from('calendar_connections')
      .upsert({
        user_id: userId,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: expiresAt,
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (dbError) {
      console.error('Database error:', dbError)
      return res.redirect('/?error=database_error')
    }

    // Redirect to calendar page with success
    return res.redirect('/calendar?connected=true')
  } catch (error) {
    console.error('OAuth callback error:', error)
    return res.redirect('/?error=internal_error')
  }
}
