import fetch from 'node-fetch'

// ─── Model config (confirmed available on free tier) ──────────────────────────
// Groq vision: only llama-4-scout is available on standard free accounts
const GROQ_VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
// Groq text: best free text model
const GROQ_TEXT_MODEL = 'llama-3.3-70b-versatile'
// Gemini: 2.5-flash is the best free vision+text model available
const GEMINI_MODEL = 'gemini-2.5-flash'

// ─────────────────────────────────────────────────────────────────────────────
// Helper: is this a soft/retriable error (should fall through to next provider)?
// ─────────────────────────────────────────────────────────────────────────────
function isSoftError(status) {
  return status === 404 || status === 429 || status === 503 || status === 500 || status === 502
}

// ─────────────────────────────────────────────────────────────────────────────
// callAI — text-only prompts (translation, weather-risk, etc.)
// Priority: Groq → Gemini → OpenAI → AICC
// ─────────────────────────────────────────────────────────────────────────────
export async function callAI(prompt, options = {}) {
  const temperature = options.temperature ?? 0.2
  const max_tokens = options.max_tokens ?? 1200

  // 1. Groq — fastest free LLM
  if (process.env.GROQ_API_KEY) {
    try {
      console.log(`[AI] Groq text → ${GROQ_TEXT_MODEL}`)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_TEXT_MODEL,
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens
        })
      })
      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        if (content) return content
        console.warn('[AI] Groq text returned empty, falling through...')
      } else {
        const errText = await response.text()
        console.warn(`[AI] Groq text HTTP ${response.status}, falling through... ${errText.slice(0, 100)}`)
      }
    } catch (err) {
      console.warn(`[AI] Groq text error: ${err.message}, falling through...`)
    }
  }

  // 2. Google Gemini 2.5 Flash — best free model, excellent for analysis
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(`[AI] Gemini text → ${GEMINI_MODEL}`)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: max_tokens }
        })
      })
      if (response.ok) {
        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (content) return content
        console.warn('[AI] Gemini text returned empty, falling through...')
      } else {
        const errText = await response.text()
        console.warn(`[AI] Gemini text HTTP ${response.status}: ${errText.slice(0, 100)}`)
        if (!isSoftError(response.status)) throw new Error(`Gemini API HTTP ${response.status}: ${errText}`)
      }
    } catch (err) {
      console.warn(`[AI] Gemini text error: ${err.message}, falling through...`)
    }
  }

  // 3. OpenAI API
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('[AI] OpenAI text → gpt-4o-mini')
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          temperature,
          max_tokens
        })
      })
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenAI API HTTP ${response.status}: ${errText}`)
      }
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('Empty response from OpenAI API')
      return content
    } catch (err) {
      console.warn(`[AI] OpenAI text error: ${err.message}, falling through...`)
    }
  }

  // 4. AICC Proxy (last resort)
  if (process.env.AICC_API_KEY) {
    console.log('[AI] AICC text → qwen-flash')
    const response = await fetch('https://api.ai.cc/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AICC_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-flash',
        messages: [{ role: 'user', content: prompt }],
        temperature,
        max_tokens
      })
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`AICC API HTTP ${response.status}: ${errText}`)
    }
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) throw new Error('Empty response from AICC API')
    return content
  }

  throw new Error('No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env')
}

// ─────────────────────────────────────────────────────────────────────────────
// callAIWithImage — vision prompts (disease scan, pest scan)
// Priority: Groq Scout → Gemini 2.5 Flash → OpenAI → AICC
// ─────────────────────────────────────────────────────────────────────────────
export async function callAIWithImage(prompt, base64Image, mimeType, options = {}) {
  const temperature = options.temperature ?? 0.1
  const max_tokens = options.max_tokens ?? 1200

  // 1. Groq Vision (llama-4-scout — confirmed available)
  if (process.env.GROQ_API_KEY) {
    try {
      console.log(`[AI] Groq vision → ${GROQ_VISION_MODEL}`)
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: GROQ_VISION_MODEL,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ]
            }
          ],
          temperature,
          max_tokens
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        if (content) {
          console.log('[AI] Groq vision success')
          return content
        }
        console.warn('[AI] Groq vision empty response, falling through...')
      } else {
        const errText = await response.text()
        console.warn(`[AI] Groq vision HTTP ${response.status}, falling through... ${errText.slice(0, 120)}`)
        // Only hard-fail on auth errors
        if (response.status === 401) throw new Error(`Groq auth failed: ${errText}`)
      }
    } catch (err) {
      if (err.message.includes('auth failed')) throw err
      console.warn(`[AI] Groq vision error: ${err.message}, falling through...`)
    }
  }

  // 2. Google Gemini 2.5 Flash — best free vision model, excellent plant recognition
  if (process.env.GEMINI_API_KEY) {
    try {
      console.log(`[AI] Gemini vision → ${GEMINI_MODEL}`)
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: prompt },
                { inlineData: { mimeType, data: base64Image } }
              ]
            }
          ],
          generationConfig: { temperature, maxOutputTokens: max_tokens }
        })
      })

      if (response.ok) {
        const data = await response.json()
        const content = data.candidates?.[0]?.content?.parts?.[0]?.text
        if (content) {
          console.log('[AI] Gemini vision success')
          return content
        }
        console.warn('[AI] Gemini vision empty response, falling through...')
      } else {
        const errText = await response.text()
        console.warn(`[AI] Gemini vision HTTP ${response.status}: ${errText.slice(0, 120)}`)
        if (!isSoftError(response.status)) throw new Error(`Gemini API HTTP ${response.status}: ${errText}`)
      }
    } catch (err) {
      if (err.message.includes('Gemini API HTTP 4')) throw err
      console.warn(`[AI] Gemini vision error: ${err.message}, falling through...`)
    }
  }

  // 3. OpenAI API
  if (process.env.OPENAI_API_KEY) {
    try {
      console.log('[AI] OpenAI vision → gpt-4o-mini')
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
              ]
            }
          ],
          temperature,
          max_tokens
        })
      })
      if (!response.ok) {
        const errText = await response.text()
        throw new Error(`OpenAI API HTTP ${response.status}: ${errText}`)
      }
      const data = await response.json()
      const content = data.choices?.[0]?.message?.content
      if (!content) throw new Error('Empty response from OpenAI API')
      return content
    } catch (err) {
      console.warn(`[AI] OpenAI vision error: ${err.message}, falling through...`)
    }
  }

  // 4. AICC Proxy (last resort, tries multiple vision models)
  if (process.env.AICC_API_KEY) {
    const models = ['qwen-image', 'qwen3-vl-flash', 'qwen3-vl-plus']
    let lastError = null
    for (const model of models) {
      try {
        console.log(`[AI] AICC vision → ${model}`)
        const response = await fetch('https://api.ai.cc/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AICC_API_KEY}`
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } }
                ]
              }
            ],
            temperature,
            max_tokens
          })
        })
        if (!response.ok) {
          const errText = await response.text()
          throw new Error(`HTTP ${response.status}: ${errText}`)
        }
        const data = await response.json()
        const content = data.choices?.[0]?.message?.content
        if (!content) throw new Error('Empty response')
        return content
      } catch (err) {
        console.error(`[AI] AICC ${model} failed: ${err.message}`)
        lastError = err
        if (err.message.includes('429')) await new Promise(r => setTimeout(r, 2000))
      }
    }
    throw new Error(`All AICC models failed. Last: ${lastError?.message}`)
  }

  throw new Error('No AI provider configured. Set GROQ_API_KEY or GEMINI_API_KEY in .env')
}
