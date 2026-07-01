import fs from 'fs'
import path from 'path'
import { callAIWithImage } from './client.js'

function buildPrompt(lang) {
  const isTamil = lang === 'ta'
  const langInstruction = isTamil
    ? 'IMPORTANT: Respond with all text fields in Tamil language (தமிழ்). JSON keys stay in English.'
    : 'Respond in English.'

  return `You are an expert agricultural plant disease diagnosis AI.

STEP 1 — STRICT IMAGE VALIDATION:
Carefully examine the image. ONLY proceed to Step 2 if the image clearly shows:
✅ A plant leaf, stem, root, flower, seedling, tree, or crop field

Immediately return the exact text NOT_A_PLANT (nothing else) if the image shows:
❌ An insect, bug, mite, pest, caterpillar, worm, or larva — even if it is ON a leaf
❌ An animal, bird, reptile, or human
❌ Food items, packaged products, or processed materials
❌ A vehicle, furniture, building, or any man-made object
❌ A blank, white, solid-color, or completely unrecognizable image
❌ Anything that is not a plant or plant part

STEP 2 — PLANT DISEASE ANALYSIS (only reach here if image clearly shows a plant/leaf):
${langInstruction}

Analyze the plant disease and respond ONLY with this exact JSON (no markdown, no extra text):
{
  "disease": {
    "name": "Disease name or 'Healthy Plant'",
    "plant": "Plant species (e.g. Tomato, Rice, Wheat)",
    "description": "2-3 sentences about what you observe on the plant",
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

  const content = await callAIWithImage(prompt, base64Image, mimeType, {
    temperature: 0.1,
    max_tokens: 1000
  })

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
    if (!parsed) throw new Error('No valid JSON in AI response')
  }

  // Second validation: reject if AI described a non-plant object despite the prompt
  const plantName = (parsed?.disease?.plant || '').toLowerCase()
  const desc = (parsed?.disease?.description || '').toLowerCase()
  const nonPlantKeywords = [
    'human face', 'person face', 'car vehicle', 'automobile', 'room interior', 'blank image',
    'insect', 'bug ', 'mite', 'aphid', 'pest', 'caterpillar', 'worm', 'larva', 'grasshopper',
    'beetle', 'fly ', 'spider', 'animal', 'bird', 'reptile', 'food item', 'fruit', 'vegetable'
  ]
  const isNonPlant = nonPlantKeywords.some(k => plantName.includes(k) || desc.includes(k))
  if (isNonPlant) {
    const err = new Error('NOT_A_PLANT')
    err.code = 'NOT_A_PLANT'
    throw err
  }
  // Additional guard: ensure the disease is not actually a pest description
  const pestKeywords = ['aphid', 'mite', 'whitefly', 'caterpillar', 'worm', 'larva', 'beetle', 'fly', 'spider', 'grasshopper', 'pest', 'insect', 'bug'];
  const diseaseName = (parsed?.disease?.name || '').toLowerCase();
  if (pestKeywords.some(k => diseaseName.includes(k))) {
    const err = new Error('NOT_A_PLANT');
    err.code = 'NOT_A_PLANT';
    throw err;
  }
  return parsed
}
