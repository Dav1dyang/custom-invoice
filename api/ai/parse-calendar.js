// Vercel Serverless Function: Parse Calendar Events with Claude AI
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

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

    const { events, defaultRate = 75 } = req.body

    if (!events || !Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'No events provided' })
    }

    // Prepare the prompt for Claude
    const eventsDescription = events.map(e => {
      const date = e.start?.dateTime
        ? new Date(e.start.dateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : e.start?.date || 'Unknown date'

      return `- "${e.summary || 'Untitled'}" on ${date}, Duration: ${e.duration} hours${e.description ? `, Description: ${e.description}` : ''}`
    }).join('\n')

    const prompt = `You are an assistant that helps convert calendar events into invoice line items.

Given these calendar events:
${eventsDescription}

Convert them into invoice line items. For each event or group of similar events, create a line item with:
- type: Category (one of: Meeting, Development, Design, Consulting, Research, Communication, Planning, Review, Other)
- description: Clear, professional description (include date or date range)
- qty: Number of hours (from duration)
- rate: Hourly rate (default: $${defaultRate}, adjust if the work type suggests different value)

Guidelines:
1. Group similar events together (e.g., multiple meetings with same client)
2. Use professional, concise descriptions
3. Include dates in descriptions for clarity
4. Recognize work types from event titles (e.g., "Design Review" → type: Design)
5. Round hours to nearest 0.25 (quarter hour)

Return ONLY a valid JSON array of line items. No explanation, just the JSON.

Example output format:
[
  {"type": "Meeting", "description": "Client meeting - Project Alpha (Nov 15)", "qty": 2, "rate": 75},
  {"type": "Development", "description": "Feature implementation (Nov 16-18)", "qty": 12, "rate": 85}
]`

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })

    // Extract the response text
    const responseText = message.content[0].type === 'text'
      ? message.content[0].text
      : ''

    // Parse the JSON response
    let lineItems
    try {
      // Try to extract JSON from the response (in case there's extra text)
      const jsonMatch = responseText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        lineItems = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON array found in response')
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', responseText)
      return res.status(500).json({
        error: 'Failed to parse AI response',
        details: parseError.message
      })
    }

    // Validate and format line items
    const formattedItems = lineItems.map(item => ({
      type: item.type || 'Other',
      description: item.description || '',
      qty: String(item.qty || 0),
      rate: String(item.rate || defaultRate),
      amount: ((parseFloat(item.qty) || 0) * (parseFloat(item.rate) || defaultRate)).toFixed(2)
    }))

    return res.status(200).json({ lineItems: formattedItems })
  } catch (error) {
    console.error('AI parsing error:', error)
    return res.status(500).json({
      error: 'Failed to parse events with AI',
      details: error.message
    })
  }
}
