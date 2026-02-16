import { NextRequest, NextResponse } from 'next/server'
import { ens_normalize } from '@adraffy/ens-normalize'

// Simple in-memory cache with 1 hour TTL
const cache = new Map<string, { data: SimilarNamesResponse; timestamp: number }>()
const CACHE_TTL = 60 * 60 * 1000 // 1 hour in milliseconds

interface SimilarNamesResponse {
  suggestions: string[]
  error?: string
}

const SYSTEM_PROMPT = `given an input string, return exactly 10 results that are related and likely to be similarly or more valuable than the input.
Rules (strict!):
3–16 chars per result
No spaces in any result
If input is single word → results = single words only
Digits-only input → all results digits, same length, similar pattern
PG-13 only
results must not contain “.”
Emojis-only input → output emojis-only; if input repeats, results repeat too
If input implies a category/theme → stay on-theme
order the results by highest recognition first.
Return no other data.`

/**
 * Attempts to normalize a name for ENS validity.
 * Returns the normalized name if valid, or null if it can't be healed.
 */
function tryNormalizeName(name: string): string | null {
  // Step 1: Basic cleanup - remove spaces, trim, lowercase
  let cleaned = name.replaceAll(' ', '').trim().toLowerCase()
  
  // Step 2: Remove any dots (not allowed in our suggestions)
  cleaned = cleaned.replaceAll('.', '')
  
  // Step 3: Skip empty or too short/long
  if (cleaned.length === 0 || cleaned.length > 16) {
    return null
  }
  
  // Step 4: Try to normalize with ENS library
  try {
    const normalized = ens_normalize(cleaned)
    // Ensure normalized result is still within bounds
    if (normalized.length > 0 && normalized.length <= 16) {
      return normalized
    }
    return null
  } catch {
    // Name cannot be normalized - invalid for ENS
    return null
  }
}

// Categories to exclude from AI prompt (not useful for suggestions)
const EXCLUDED_CATEGORIES = [
  'prepunks',
  'prepunk_100',
  'prepunk_10k',
  'prepunk_1k',
  'prepunk_digits',
]

async function callOpenAI(name: string, categories?: string[]): Promise<string[]> {
  // Filter out excluded categories
  const filteredCategories = categories?.filter(
    (cat) => !EXCLUDED_CATEGORIES.includes(cat.toLowerCase())
  )

  // Build input with optional categories context
  let input = `name: ${name}`
  if (filteredCategories && filteredCategories.length > 0) {
    input += `\ncategories: ${filteredCategories.join(', ')}`
  }

  const t0 = performance.now()
  const response = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-5-nano',
      instructions: SYSTEM_PROMPT,
      input,
      max_output_tokens: 1000,
      store: true,
      reasoning: {
        effort: 'minimal',
      },
      text: {
        format: { type: 'text' },
      },
    }),
  })
  const t1 = performance.now()

  const data = await response.json()
  const t2 = performance.now()
  console.log(`[similar-names] fetch: ${(t1 - t0).toFixed(0)}ms | parse: ${(t2 - t1).toFixed(0)}ms | reasoning_tokens: ${data.usage?.output_tokens_details?.reasoning_tokens ?? '?'} | output_tokens: ${data.usage?.output_tokens ?? '?'}`)

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

  // Parse the response - split by newlines or commas
  const rawSuggestions = text
    .split(/[\n,]+/)
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0)

  // Normalize and validate each suggestion
  const validSuggestions: string[] = []
  for (const raw of rawSuggestions) {
    const normalized = tryNormalizeName(raw)
    if (normalized && normalized !== name && !validSuggestions.includes(normalized)) {
      validSuggestions.push(normalized)
      if (validSuggestions.length >= 10) break
    }
  }

  return validSuggestions
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

