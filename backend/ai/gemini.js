import fs from 'fs'
import path from 'path'
import { callAIWithImage } from './client.js'

function buildPrompt(lang) {
  const isTamil = lang === 'ta'
  const langInstruction = isTamil
    ? 'CRITICAL: Write every text value in pure Tamil script (தமிழ்) only. No English words inside any value. JSON keys stay in English.'
    : 'Respond in English.'

  return `You are a plant disease detection AI. Your ONLY job is to detect diseases in plants.

${langInstruction}

━━━ YOUR SCOPE (STRICT) ━━━
You ONLY analyze images that show:
  ✅ Plant leaves (with or without disease)
  ✅ Plant stems, roots, bark, or branches
  ✅ Plant fruits, flowers, or seeds still on the plant
  ✅ Crop fields, seedlings, or saplings
  ✅ Plant tissue showing disease symptoms (spots, blight, rot, rust, mold, yellowing, wilting)

━━━ MANDATORY REJECTION ━━━
You MUST return ONLY the exact word  NOT_A_PLANT  (no JSON, no explanation) if the image primarily shows:
  ❌ ANY insect, bug, caterpillar, worm, larva, moth, fly, beetle, aphid, mite, spider, or any arthropod
  ❌ A human, face, person, or animal
  ❌ A vehicle, machine, building, phone, or non-agricultural object
  ❌ Blank, solid-color, or unrecognizable image
  ❌ Processed food or non-plant material

IMPORTANT: If the main subject of the image is an insect or pest (even if it is sitting on a leaf), return NOT_A_PLANT. The plant scanner is NOT for pest identification.

━━━ WHEN IN DOUBT ━━━
If you cannot clearly confirm a plant/leaf/stem is the main subject, return NOT_A_PLANT.

━━━ OUTPUT FORMAT ━━━
For valid plant images ONLY, respond with this exact JSON (no markdown, no extra text):

{
  "disease": {
    "name": "Disease name (e.g. 'Late Blight', 'Powdery Mildew', 'Leaf Rust') — or 'Healthy Plant' if healthy",
    "plant": "Plant species (e.g. Tomato, Rice, Wheat, Banana, Cotton, Maize, Chilli, Potato)",
    "description": "2–3 sentences about the plant condition and disease visible. DO NOT mention insects or pests.",
    "severity": "None or Low or Medium or High",
    "symptoms": [
      "Disease symptom visible on the plant",
      "Second symptom",
      "Third symptom",
      "Fourth symptom"
    ],
    "treatment": [
      "Immediate action for the disease",
      "Fungicide or bactericide spray recommendation",
      "Cultural practice to control spread",
      "Follow-up care"
    ],
    "medicines": [
      {"name": "Fungicide/bactericide name", "dosage": "Amount per litre water", "frequency": "Application interval"},
      {"name": "Alternative product", "dosage": "Amount per litre water", "frequency": "Application interval"}
    ],
    "prevention": [
      "Prevention practice 1",
      "Resistant variety or seed treatment",
      "Field hygiene tip",
      "Monitoring schedule"
    ]
  },
  "confidence": 85,
  "isHealthy": false
}

Rules:
- isHealthy: true ONLY if plant looks completely healthy with zero disease signs
- severity "None" only when isHealthy is true
- confidence: integer 50–99
- All arrays minimum 3 items, medicines minimum 2
- NEVER describe insects, caterpillars, or pests in any field`
}

// Pest-related keywords that should NOT appear in a plant disease result
const PEST_KEYWORDS = [
  'caterpillar', 'insect', 'aphid', 'mite', 'whitefly', 'worm', 'larva', 'larval',
  'moth', 'beetle', 'fly ', 'flies', 'spider', 'bug ', 'bugs', 'pest ', 'pests',
  'grasshopper', 'thrips', 'mealybug', 'scale insect', 'armyworm', 'bollworm',
  'stem borer', 'leaf miner', 'frass', 'honeydew', 'webbing', 'grub', 'nymph',
  'infestation', 'feeding damage', 'chewed', 'munching'
]

export async function analyzeImageWithAI(imagePath, lang = 'en') {
  const imageBuffer = fs.readFileSync(imagePath)
  const ext = path.extname(imagePath).replace('.', '').toLowerCase()
  const mimeType = ext === 'png' ? 'image/png'
    : ext === 'webp' ? 'image/webp'
    : ext === 'gif' ? 'image/gif'
    : 'image/jpeg'
  const base64Image = imageBuffer.toString('base64')

  console.log(`[Plant Scan] ${Math.round(imageBuffer.length / 1024)}KB | ${mimeType} | lang:${lang}`)

  const content = await callAIWithImage(buildPrompt(lang), base64Image, mimeType, {
    temperature: 0.1,
    max_tokens: 1200
  })

  console.log(`[Plant Scan] AI raw (first 150): ${content.trim().slice(0, 150)}`)

  // Layer 1: AI explicitly flagged as not a plant
  if (/^\s*NOT_A_PLANT\s*$/m.test(content) || content.trim() === 'NOT_A_PLANT') {
    console.log('[Plant Scan] Rejected by AI: NOT_A_PLANT')
    const err = new Error('NOT_A_PLANT')
    err.code = 'NOT_A_PLANT'
    throw err
  }

  // Strip markdown fences
  const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()

  let parsed
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (match) {
      try { parsed = JSON.parse(match[0]) } catch {}
    }
    if (!parsed) {
      console.error('[Plant Scan] JSON parse failed. Raw:', cleaned.slice(0, 300))
      throw new Error('No valid JSON in AI response')
    }
  }

  // Layer 2: Post-parse check — scan description + disease name for pest keywords
  const textToCheck = [
    (parsed?.disease?.name || ''),
    (parsed?.disease?.description || ''),
    (parsed?.disease?.plant || ''),
    ...(parsed?.disease?.symptoms || [])
  ].join(' ').toLowerCase()

  const foundPestKeyword = PEST_KEYWORDS.find(k => textToCheck.includes(k))
  if (foundPestKeyword) {
    console.warn(`[Plant Scan] Rejected by post-parse — pest keyword found: "${foundPestKeyword}"`)
    const err = new Error('NOT_A_PLANT')
    err.code = 'NOT_A_PLANT'
    throw err
  }

  // Layer 3: Reject if plant field is clearly a non-plant object
  const plantName = (parsed?.disease?.plant || '').toLowerCase()
  const nonPlantObjects = ['human', 'person', 'face', 'car', 'vehicle', 'building', 'phone', 'computer', 'food']
  if (nonPlantObjects.some(k => plantName.includes(k))) {
    console.warn(`[Plant Scan] Rejected — plant field: "${plantName}"`)
    const err = new Error('NOT_A_PLANT')
    err.code = 'NOT_A_PLANT'
    throw err
  }

  return parsed
}
