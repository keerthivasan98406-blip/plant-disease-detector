import fs from 'fs'
import path from 'path'

const API_KEY = process.env.AICC_API_KEY
const BASE_URL = 'https://api.ai.cc/v1'
const MODEL = 'gpt-4o'

const PROMPT = `You are an expert plant pathologist. Analyze this plant image carefully.
Respond ONLY with a valid JSON object — no markdown, no explanation, just raw JSON:
{
  "disease": {
    "name": "Disease name (or Healthy Plant if no disease)",
    "plant": "Plant species detected",
    "description": "2-3 sentence description of the condition",
    "severity": "Low or Medium or High or None",
    "symptoms": ["symptom 1", "symptom 2", "symptom 3", "symptom 4"],
    "treatment": ["treatment step 1", "treatment step 2", "treatment step 3", "treatment step 4"],
    "medicines": [
      {"name": "Medicine/fungicide name", "dosage": "e.g. 2g per litre", "frequency": "e.g. Every 7 days"},
      {"name": "Medicine/fungicide name", "dosage": "e.g. 3ml per litre", "frequency": "e.g. Every 10 days"}
    ],
    "prevention": ["prevention tip 1", "prevention tip 2", "prevention tip 3", "prevention tip 4"]
  },
  "confidence": 88,
  "isHealthy": false
}`

export async function analyzeImageWithAI(imagePath) {
  const imageBuffer = fs.readFileSync(imagePath)
  const ext = path.extname(imagePath).replace('.', '').toLowerCase()
  const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
  const base64Image = imageBuffer.toString('base64')

  console.log(`Analyzing image with AICC ${MODEL} (${Math.round(imageBuffer.length / 1024)}KB)...`)

  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64Image}` }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 1200
    })
  })

  const responseText = await response.text()

  if (!response.ok) {
    console.error(`AICC API error ${response.status}:`, responseText.slice(0, 400))
    throw new Error(`AICC API ${response.status}: ${responseText.slice(0, 200)}`)
  }

  const data = JSON.parse(responseText)
  const content = data.choices?.[0]?.message?.content

  if (!content) {
    console.error('Empty AICC response:', JSON.stringify(data).slice(0, 300))
    throw new Error('No content in AICC response')
  }

  console.log('AICC raw response:', content.slice(0, 400))

  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  try {
    return JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        throw new Error('Could not parse JSON from AICC response')
      }
    }
    throw new Error('No valid JSON found in AICC response')
  }
}
