// Vercel Serverless Function: Fetch Google Calendar Events
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify authentication
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  const token = authHeader.split(' ')[1]

  try {
    // Verify the token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get the user's Google Calendar access token from Supabase
    const { data: connection, error: connError } = await supabase
      .from('calendar_connections')
      .select('access_token, refresh_token, expires_at')
      .eq('user_id', user.id)
      .single()

    if (connError || !connection) {
      return res.status(400).json({
        error: 'Google Calendar not connected',
        needsConnection: true
      })
    }

    // Check if token is expired and refresh if needed
    let accessToken = connection.access_token

    if (new Date(connection.expires_at) < new Date()) {
      // Refresh the token
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: connection.refresh_token,
          grant_type: 'refresh_token'
        })
      })

      const refreshData = await refreshResponse.json()

      if (!refreshResponse.ok) {
        return res.status(400).json({
          error: 'Failed to refresh Google token',
          needsConnection: true
        })
      }

      accessToken = refreshData.access_token

      // Update stored token
      await supabase
        .from('calendar_connections')
        .update({
          access_token: accessToken,
          expires_at: new Date(Date.now() + refreshData.expires_in * 1000).toISOString()
        })
        .eq('user_id', user.id)
    }

    // Get date range from request
    const { startDate, endDate } = req.body

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start and end dates are required' })
    }

    // Fetch events from Google Calendar
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      new URLSearchParams({
        timeMin: new Date(startDate).toISOString(),
        timeMax: new Date(endDate + 'T23:59:59').toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250'
      }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    )

    const calendarData = await calendarResponse.json()

    if (!calendarResponse.ok) {
      return res.status(400).json({
        error: 'Failed to fetch calendar events',
        details: calendarData.error?.message
      })
    }

    // Process events to add duration
    const events = (calendarData.items || []).map(event => {
      let duration = 0

      if (event.start?.dateTime && event.end?.dateTime) {
        const start = new Date(event.start.dateTime)
        const end = new Date(event.end.dateTime)
        duration = (end - start) / (1000 * 60 * 60) // Hours
      } else if (event.start?.date && event.end?.date) {
        // All-day event
        const start = new Date(event.start.date)
        const end = new Date(event.end.date)
        duration = (end - start) / (1000 * 60 * 60 * 24) * 8 // Assume 8-hour days
      }

      return {
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        duration: Math.round(duration * 100) / 100, // Round to 2 decimals
        location: event.location,
        attendees: event.attendees?.map(a => a.email)
      }
    })

    return res.status(200).json({ events })
  } catch (error) {
    console.error('Calendar API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
