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
    ? 'IMPORTANT: You MUST respond with all text fields (name, plant, description, symptoms, treatment, medicines, prevention) written in Tamil language (தமிழ்). Only the JSON keys must remain in English.'
    : 'Respond in English.'

  return `You are a professional plant pathologist AI. Carefully examine the plant image provided.

${langInstruction}

STRICT RULE: You MUST check if the image contains a plant (leaf, stem, flower, fruit, crop, tree, grass, seedling, etc.).
- If the image shows a HUMAN, PERSON, ANIMAL, VEHICLE, BUILDING, FOOD, OBJECT, or ANYTHING that is NOT a plant — respond with exactly: NOT_A_PLANT
- Only analyze images that clearly show plant material
- If it IS a plant, analyze it and respond with the JSON below

Rules for plant analysis:
- Base your answer ONLY on what you see in this specific image
- If the plant looks healthy, set isHealthy to true and severity to "None"
- Be specific about the plant species if identifiable
- Provide practical, real-world treatment and medicine recommendations
- Confidence should reflect how certain you are (50-99)

Respond ONLY with this exact JSON structure (no markdown, no extra text) OR the text NOT_A_PLANT:
{
  "disease": {
    "name": "Exact disease name, or 'Healthy Plant' if no disease found",
    "plant": "Plant species name (e.g. Tomato, Rose, Wheat)",
    "description": "2-3 sentences describing what you observe in this image and the condition",
    "severity": "None or Low or Medium or High",
    "symptoms": ["observed symptom 1", "observed symptom 2", "observed symptom 3", "observed symptom 4"],
    "treatment": ["specific treatment step 1", "specific treatment step 2", "specific treatment step 3", "specific treatment step 4"],
    "medicines": [
      {"name": "Specific medicine or fungicide name", "dosage": "exact dosage e.g. 2g per litre", "frequency": "e.g. Every 7 days"},
      {"name": "Specific medicine or fungicide name", "dosage": "exact dosage e.g. 3ml per litre", "frequency": "e.g. Every 10 days"}
    ],
    "prevention": ["prevention tip 1", "prevention tip 2", "prevention tip 3", "prevention tip 4"]
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

  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) } catch {}
    }
    throw new Error('No valid JSON in AICC response')
  }
}
