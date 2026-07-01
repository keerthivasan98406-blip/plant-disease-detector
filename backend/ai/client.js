import fetch from 'node-fetch'

export async function callAI(prompt, options = {}) {
  const temperature = options.temperature ?? 0.2
  const max_tokens = options.max_tokens ?? 1200

  // 1. Google Gemini API
  if (process.env.GEMINI_API_KEY) {
    console.log('Using Gemini API (text)...')
    const model = 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature, maxOutputTokens: max_tokens }
      })
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API HTTP ${response.status}: ${errText}`)
    }
    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) throw new Error('Empty response from Gemini API')
    return content
  }

  // 2. OpenAI API
  if (process.env.OPENAI_API_KEY) {
    console.log('Using OpenAI API (text)...')
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
  }

  // 3. AICC Proxy API (Fallback)
  if (process.env.AICC_API_KEY) {
    console.log('Using AICC API (text)...')
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

  throw new Error('No API key configured. Please set GEMINI_API_KEY, OPENAI_API_KEY, or AICC_API_KEY in .env.')
}

export async function callAIWithImage(prompt, base64Image, mimeType, options = {}) {
  const temperature = options.temperature ?? 0.1
  const max_tokens = options.max_tokens ?? 1000

  // 1. Google Gemini API
  if (process.env.GEMINI_API_KEY) {
    console.log('Using Gemini API (image)...')
    const model = 'gemini-1.5-flash'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType,
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: { temperature, maxOutputTokens: max_tokens }
      })
    })
    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Gemini API HTTP ${response.status}: ${errText}`)
    }
    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text
    if (!content) throw new Error('Empty response from Gemini API')
    return content
  }

  // 2. OpenAI API
  if (process.env.OPENAI_API_KEY) {
    console.log('Using OpenAI API (image)...')
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
  }

  // 3. AICC Proxy API (Fallback)
  if (process.env.AICC_API_KEY) {
    console.log('Using AICC API (image)...')
    const models = ['qwen-image', 'qwen3-vl-flash', 'qwen3-vl-plus']
    let lastError = null
    for (const model of models) {
      try {
        console.log(`Trying AICC model: ${model}`)
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
        console.error(`AICC model ${model} failed: ${err.message}`)
        lastError = err
        if (err.message.includes('429')) {
          await new Promise(r => setTimeout(r, 2000))
        }
      }
    }
    throw new Error(`All AICC models failed. Last: ${lastError?.message}`)
  }

  throw new Error('No API key configured. Please set GEMINI_API_KEY, OPENAI_API_KEY, or AICC_API_KEY in .env.')
}
