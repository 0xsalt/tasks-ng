import { NextResponse } from "next/server"
import { getTelosContext } from "@/lib/telos-data"

export async function POST(request: Request) {
  try {
    const { message } = await request.json()

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 }
      )
    }

    // Check for API key
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Chat feature requires OPENAI_API_KEY environment variable" },
        { status: 503 }
      )
    }

    const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
    const baseUrl = process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1'

    // Load all project context
    const telosContext = getTelosContext()

    const systemPrompt = `You are a helpful AI assistant with access to the tasks-ng project documentation.

${telosContext}

When answering questions:
- Reference specific information from the documentation above
- Be conversational and helpful
- If asked about the task format, features, roadmap, etc., use the exact information from the relevant sections
- If information isn't in the documentation, say so clearly
- Keep responses concise but informative`

    // Call OpenAI API
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        max_completion_tokens: 1024,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ]
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('OpenAI API error:', response.status, errorData)
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices?.[0]?.message?.content

    if (!assistantMessage) {
      throw new Error("No response from API")
    }

    return NextResponse.json({ response: assistantMessage })
  } catch (error) {
    console.error("Error in chat API:", error)
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    )
  }
}
