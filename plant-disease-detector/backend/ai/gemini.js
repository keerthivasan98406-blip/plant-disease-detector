import fs from 'fs'
import path from 'path'

const API_KEY = process.env.AICC_API_KEY
const BASE_URL = 'https://api.ai.cc/v1'

const MODELS = [
  'gpt-4o-mini',  // fastest — try first
  'gpt-4o',
  'gpt-4-vision-preview',
]

function buildPrompt(lang) {
  const isTamil = lang === 'ta'
  const langInstruction = isTamil
    ? 'IMPORTANT: Respond with all text fields in Tamil language (தமிழ்). JSON keys stay in English.'
    : 'Respond in English.'

  return `You are a plant disease detection AI. Your ONLY job is to analyze plant images.

STEP 1 — MANDATORY IMAGE CHECK:
Look at the image. Does it show a plant (leaf, stem, crop, flower, fruit, tree)?

If YES → proceed to STEP 2
If NO (human, person, face, animal, food, vehicle, building, object, sky, water) → stop and respond with exactly this one word: NOT_A_PLANT

Do NOT try to be helpful by analyzing non-plant images. Do NOT describe what you see if it's not a plant. Just respond: NOT_A_PLANT

STEP 2 — PLANT ANALYSIS (only if image shows a plant):
${langInstruction}

Analyze the plant disease and respond ONLY with this JSON (no markdown):
{
  "disease": {
    "name": "Disease name or 'Healthy Plant'",
    "plant": "Plant species (e.g. Tomato, Rice, Wheat)",
    "description": "2-3 sentences about what you observe",
    "severity": "None or Low or Medium or High",
    "symptoms": ["symptom 1", "symptom 2", "symptom 3", "symptom 4"],
    "treatment": ["treatment 1", "treatment 2", "treatment 3", "treatment 4"],
    "medicines": [
      {"name": "medicine name", "dosage": "dosage", "frequency": "frequency"},
      {"name": "medicine name", "dosage": "dosage", "frequency": "frequency"}
    ],
    "prevention": ["tip 1", "tip 2", "tip 3", "tip 4"]
  },
  "confidence": 85,
  "isHealthy": false
}`
}

export async function analyzeImageWithAI(imagePath, lang = 'en') {
  const imageBuffer = fs.readFileSync(imagePath)
  const ext = path.extname(imagePath).replace('.', '').toLowerCase()
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  const base64Image = imageBuffer.toString('base64')

  console.log(`Analyzing image: ${Math.round(imageBuffer.length / 1024)}KB, type: ${mimeType}, lang: ${lang}`)

  const prompt = buildPrompt(lang)

  let lastError = null
  for (const model of MODELS) {
    try {
      console.log(`Trying model: ${model}`)
      const result = await callAICC(model, base64Image, mimeType, prompt)
      console.log(`Success with model: ${model}`)
      return result
    } catch (err) {
      console.error(`Model ${model} failed: ${err.message}`)
      lastError = err
      if (err.message.includes('429')) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
  }

  throw new Error(`All models failed. Last: ${lastError?.message?.slice(0, 100)}`)
}

async function callAICC(model, base64Image, mimeType, prompt) {
  const url = `${BASE_URL}/chat/completions`

  const body = JSON.stringify({
    model,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`,
              detail: 'high'
            }
          }
        ]
      }
    ],
    temperature: 0.1,
    max_tokens: 1000
  })

  const fetchPromise = fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body
  })

  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout after 45s')), 45000)
  )

  let response
  try {
    response = await Promise.race([fetchPromise, timeoutPromise])
  } catch (fetchErr) {
    throw new Error(`Network/timeout error: ${fetchErr.message}`)
  }

  const responseText = await response.text()

  if (!response.ok) {
    const preview = responseText.slice(0, 300)
    console.error(`AICC ${model} HTTP ${response.status}: ${preview}`)
    throw new Error(`HTTP ${response.status}: ${preview}`)
  }

  let data
  try {
    data = JSON.parse(responseText)
  } catch {
    throw new Error('Invalid JSON from AICC API')
  }

  const content = data.choices?.[0]?.message?.content
  if (!content) {
    console.error('Empty AICC response:', JSON.stringify(data).slice(0, 300))
    throw new Error('Empty response from AICC API')
  }

  console.log('AICC raw response preview:', content.slice(0, 300))

  // Check if model says it's not a plant
  if (content.trim().startsWith('NOT_A_PLANT') || content.includes('NOT_A_PLANT')) {
    const err = new Error('NOT_A_PLANT')
    err.code = 'NOT_A_PLANT'
    throw err
  }

  // Strip markdown fences if present
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]) } catch {}
    }
    if (!parsed) throw new Error('No valid JSON in AICC response')
  }

  // Second validation: if AI described a non-plant (human, animal etc.) reject it
  const plantName = (parsed?.disease?.plant || '').toLowerCase()
  const desc = (parsed?.disease?.description || '').toLowerCase()
  const nonPlantKeywords = ['human', 'person', 'people', 'man', 'woman', 'child', 'face', 'hand', 'animal', 'dog', 'cat', 'bird', 'car', 'vehicle', 'building', 'food']
  const isNonPlant = nonPlantKeywords.some(k => plantName.includes(k) || desc.includes(k))
  if (isNonPlant) {
    const err = new Error('NOT_A_PLANT')
    err.code = 'NOT_A_PLANT'
    throw err
  }

  return parsed
}
