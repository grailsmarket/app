import { NextRequest, NextResponse } from 'next/server'

// Simple in-memory cache with 1 hour TTL
const cache = new Map<string, { data: SimilarNamesResponse; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

interface SimilarNamesResponse {
  suggestions: string[]
  error?: string
}

const SYSTEM_PROMPT = `you are a domain agent you have a simple task: use your vast LLM knowledge to give me 5 words related and likely to be similarly or more highly valuable to the following word. no words longer than 16 chars, none shorter than 3 chars, consider brand-ability, SEO, username potential, recognizably.
strict: if input is multi-word (they will be without spaces), provide a similar feel for output.
strict: if input is a single world, return only single words.
strict: when generating names, don't add arbitrary gamertag like endings like "x" "ix" etc - keep it simple.
strict: if in input is unintelligible - provide some clean words that have some of the input characters.
strict: if a digit-only input is received, ensure ALL outputs are of the exact same length. eg 4 digit input, 4 digit output. consider digit input patterns, and try to follow. 
strict: if there are any inappropriate inputs - do not give any bad output, keep it pg13.
strict: if the input has a "." period in it, never return results that have one.
strict: if input has emojis, output needs emojis (no modifiers allowed).
strict: if the input has any categories, keep to the theme.
strict: do not provide any other information.`

async function callOpenAI(name: string, categories?: string[]): Promise<string[]> {
  // Build input with optional categories context
  let input = `name: ${name}`
  if (categories && categories.length > 0) {
    input += `\ncategories: ${categories.join(', ')}`
  }

  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5.2-chat-latest',
      instructions: SYSTEM_PROMPT,
      input,
      max_output_tokens: 2000,
      store: false,
    }),
  })

  const data = await response.json()

  // Check if response is completed (allow incomplete if we have output)
  if (data.status !== 'completed' && data.status !== 'incomplete') {
    console.error('OpenAI response failed:', data.status, data.error)
    throw new Error(`OpenAI response status: ${data.status}`)
  }

  // If incomplete, log but continue to try extracting content
  if (data.status === 'incomplete') {
    console.warn('OpenAI response incomplete, attempting to extract partial content:', data.incomplete_details)
  }

  // Find the message item in output (may have reasoning item before it)
  const messageItem = data.output?.find((item: { type: string }) => item.type === 'message')
  if (!messageItem) {
    console.error('No message item in OpenAI response:', data)
    throw new Error('No message item in OpenAI response')
  }

  // Extract text from the message content
  const text = messageItem.content?.find((c: { type: string }) => c.type === 'output_text')?.text
  if (!text) {
    console.error('No text in OpenAI response message:', messageItem)
    throw new Error('No text in OpenAI response')
  }

  // Parse the response - expecting 4 words/names separated by newlines or commas
  const suggestions = text
    .split(/[\n,]+/)
    .map((s: string) => s.trim().toLowerCase())
    .filter((s: string) => s.length > 0 && s.length <= 14)
    .slice(0, 5)

  return suggestions
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json({ error: 'Name parameter is required', suggestions: [] }, { status: 400 })
    }

    // Extract the base name (without .eth)
    const baseName = name.replace(/\.eth$/i, '').toLowerCase().trim()

    if (!baseName) {
      return NextResponse.json({ error: 'Invalid name', suggestions: [] }, { status: 400 })
    }

    // Get optional categories
    const categoriesParam = searchParams.get('categories')
    const categories = categoriesParam ? categoriesParam.split(',').map(c => c.trim()).filter(Boolean) : []

    // Create cache key that includes categories
    const cacheKey = categories.length > 0 ? `${baseName}:${categories.sort().join(',')}` : baseName

    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data, {
        headers: { 'X-Cache': 'HIT' },
      })
    }

    // Validate environment variable
    if (!process.env.OPENAI_API_KEY) {
      console.error('Missing OPENAI_API_KEY')
      return NextResponse.json({ error: 'API not configured', suggestions: [] }, { status: 500 })
    }

    // Call OpenAI with name and categories
    const suggestions = await callOpenAI(baseName, categories)

    const responseData: SimilarNamesResponse = {
      suggestions,
    }

    // Cache the result
    cache.set(cacheKey, { data: responseData, timestamp: Date.now() })

    return NextResponse.json(responseData, {
      headers: { 'X-Cache': 'MISS' },
    })
  } catch (error) {
    console.error('Error fetching similar names:', error)
    return NextResponse.json(
      { error: 'Failed to fetch similar names', suggestions: [] },
      { status: 500 }
    )
  }
}

