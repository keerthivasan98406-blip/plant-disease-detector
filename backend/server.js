import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { analyzeImageWithAI } from './ai/gemini.js'
import { diseases } from './data/diseases.js'
import { callAI, callAIWithImage } from './ai/client.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '.env') })
const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({ origin: '*' }))
app.use(express.json())
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${uuidv4()}${ext}`)
  }
})
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff', '.heic', '.heif']
    if (file.mimetype.startsWith('image/') || allowedExts.includes(ext)) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  }
})

// POST /api/scan — analyze plant image with real AI
app.post('/api/scan', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' })

  try {
    let aiResult
    try {
      const lang = req.body.lang || req.query.lang || 'en'
      aiResult = await analyzeImageWithAI(req.file.path, lang)
    } catch (aiErr) {
      // If not a plant image, return a clear error
      if (aiErr.code === 'NOT_A_PLANT' || aiErr.message === 'NOT_A_PLANT') {
        return res.status(422).json({
          error: 'This image does not appear to contain a plant. Please upload a clear photo of a plant leaf, stem, or crop.'
        })
      }
      // Fallback to mock analyzer if API fails
      console.warn('AI scan failed, falling back to mock analyzer:', aiErr.message)
      const { analyzeImage } = await import('./mock/analyzer.js')
      const mockResult = analyzeImage(req.file.filename)
      const lang = req.body.lang || req.query.lang || 'en'
      // If Tamil requested, translate mock fields (simple static mapping)
      let disease = mockResult.disease
      if (lang === 'ta') {
        const taMap = {
          Healthy: 'ஆரோக்கியமான தாவரம்',
          'Healthy Plant': 'ஆரோக்கியமான தாவரம்'
        }
        disease = {
          ...disease,
          name: taMap[disease.name] || disease.name,
          plant: taMap[disease.plant] || disease.plant,
          description: disease.description ? `${disease.description} (தமிழில்)` : ''
        }
      }
      aiResult = {
        disease,
        confidence: mockResult.confidence,
        isHealthy: disease.name === 'ஆரோக்கியமான தாவரம்' || disease.name === 'Healthy Plant' || disease.name === 'Healthy'
      }
    }

    const id = uuidv4()
    const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
    const imageUrl = `${host}/uploads/${req.file.filename}`
    const lang = req.body.lang || req.query.lang || 'en'

    const isHealthy = Boolean(aiResult.isHealthy)
    const rawSeverity = aiResult.disease?.severity
    const severity = ['Low', 'Medium', 'High'].includes(rawSeverity)
      ? rawSeverity
      : isHealthy ? 'Low' : 'Medium'

    const disease = {
      id: uuidv4(),
      name: aiResult.disease?.name || (isHealthy ? 'Healthy Plant' : 'Unknown Disease'),
      plant: aiResult.disease?.plant || 'Unknown Plant',
      description: aiResult.disease?.description || '',
      severity,
      symptoms: Array.isArray(aiResult.disease?.symptoms) ? aiResult.disease.symptoms : [],
      treatment: Array.isArray(aiResult.disease?.treatment) ? aiResult.disease.treatment : [],
      medicines: Array.isArray(aiResult.disease?.medicines) ? aiResult.disease.medicines : [],
      prevention: Array.isArray(aiResult.disease?.prevention) ? aiResult.disease.prevention : []
    }

    res.json({
      id,
      imageName: req.file.originalname,
      imageUrl,
      disease,
      confidence: Number(aiResult.confidence) || 80,
      isHealthy,
      lang,
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    console.error('Scan route outer error:', err.message)
    res.status(500).json({ error: 'Scan failed. Please try again with a clear plant image.' })
  }
})

// POST /api/pest — identify pests from image
app.post('/api/pest', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image provided' })
  try {
    const imageBuffer = fs.readFileSync(req.file.path)
    const ext = path.extname(req.file.path).replace('.', '').toLowerCase()
    const mimeType = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg'
    const base64Image = imageBuffer.toString('base64')
    const lang = req.body.lang || req.query.lang || 'en'
    const isTamil = lang === 'ta'
    const langNote = isTamil
      ? 'CRITICAL: Write ALL text values in Tamil language (தமிழ்) ONLY. Do NOT mix English words in any value. JSON keys stay in English.'
      : 'Respond in English.'

    const pestPrompt = `You are an expert entomologist AI. Your ONLY job is to identify insects, bugs, mites, and agricultural pests from images.

${langNote}

━━━ WHAT TO ACCEPT ━━━
Analyze the image if it clearly shows ANY of these — in any format, size, or resolution:
  ✅ A visible insect, bug, mite, fly, moth, butterfly, beetle, ant, or any arthropod
  ✅ A caterpillar, worm, larva, maggot, nymph, or grub
  ✅ Pest eggs, egg masses, or egg clusters on leaves/stems
  ✅ Active pest feeding: bugs visibly eating, sucking, or crawling on plant parts
  ✅ Webbing, silk threads, or honeydew produced by mites/aphids/whiteflies
  ✅ Frass (insect droppings) visible on leaves or stems
  ✅ Leaf mining trails (winding white/brown tunnels inside leaf)
  ✅ Multiple insects visible in a field or lab setting

━━━ WHAT TO REJECT ━━━
Return ONLY the exact word  NOT_A_PEST  (no JSON, nothing else) if the image shows:
  ❌ A plant disease only — fungal spots, blight, rust, mold, rot, yellowing with NO visible pest or insect
  ❌ A healthy plant or leaf with no pest, damage, or insect visible at all
  ❌ A human, animal (dog/cat/bird), vehicle, building, or non-agricultural object
  ❌ A blank, black, or solid-color image

━━━ IMPORTANT ━━━
- If the image shows BOTH a plant disease AND a visible insect — analyze the insect
- Even a single small insect visible anywhere in the frame is enough to proceed
- Blurry or low-quality images with a visible insect shape should still be analyzed
- When in doubt about whether a shape is an insect, attempt analysis

━━━ OUTPUT FORMAT ━━━
Respond with ONLY this JSON (no markdown, no explanation):

{
  "pest": "Exact pest common name (e.g. Aphid, Whitefly, Spider Mite, Thrips, Mealybug, Fall Armyworm, Leaf Miner, Bollworm, Rice Stem Borer, Fruit Fly, Scale Insect)",
  "scientificName": "Scientific name (e.g. Spodoptera frugiperda) or empty string if unknown",
  "plant": "Host plant or crop visible, or main crops this pest attacks",
  "description": "2–3 sentences: what pest is visible, what life stage, what damage is it causing",
  "severity": "Low or Medium or High",
  "damage": [
    "Damage sign 1 visible or caused by this pest",
    "Damage sign 2",
    "Damage sign 3",
    "Damage sign 4"
  ],
  "control": [
    "Immediate mechanical/cultural action",
    "Biological control method",
    "Trap or monitoring method",
    "Field management practice"
  ],
  "organic": [
    "Neem oil: 5ml per litre water + 2ml soap, spray every 5–7 days",
    "Second organic/biopesticide remedy",
    "Third organic option or companion planting"
  ],
  "chemicals": [
    {"name": "Insecticide name", "dosage": "Dosage per litre water"},
    {"name": "Alternative insecticide", "dosage": "Dosage per litre water"}
  ]
}

Rules:
- severity High = >50% plant affected or pest vectors a virus, Medium = 20–50%, Low = <20%
- All arrays minimum 3 items, chemicals minimum 2`

    let content
    try {
      content = await callAIWithImage(pestPrompt, base64Image, mimeType, {
        temperature: 0.1,
        max_tokens: 1200
      })
      console.log(`[Pest Scan] AI raw (first 120): ${content.trim().slice(0, 120)}`)
      if (/^\s*NOT_A_PEST\s*$/m.test(content) || content.trim() === 'NOT_A_PEST') {
        return res.status(422).json({ error: 'No pest or insect detected in this image. Please upload a photo that clearly shows an insect, bug, mite, caterpillar, or pest damage on a plant.' })
      }
    } catch (aiErr) {
      console.warn('[Pest Scan] AI failed, falling back to mock:', aiErr.message)
      const { analyzePest } = await import('./mock/analyzer.js')
      const mockResult = analyzePest(req.file.filename)
      return res.json(mockResult)
    }

    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    let result
    try {
      result = JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) result = JSON.parse(match[0])
      else return res.status(500).json({ error: 'Invalid AI response format. Please try again.' })
    }

    res.json(result)
  } catch (err) {
    console.error('Pest route error:', err.message)
    res.status(500).json({ error: 'Pest analysis failed: ' + err.message })
  }
})

// GET /api/diseases
app.get('/api/diseases', (req, res) => {
  const { q, severity } = req.query
  let result = diseases
  if (q) result = result.filter(d =>
    d.name.toLowerCase().includes(q.toLowerCase()) ||
    d.plant.toLowerCase().includes(q.toLowerCase())
  )
  if (severity && severity !== 'All') result = result.filter(d => d.severity === severity)
  res.json(result)
})

app.get('/api/diseases/:id', (req, res) => {
  const disease = diseases.find(d => d.id === req.params.id)
  if (!disease) return res.status(404).json({ error: 'Not found' })
  res.json(disease)
})

// GET /api/tts — proxy Google Translate TTS to avoid browser CORS
app.get('/api/tts', async (req, res) => {
  const { text, lang = 'ta' } = req.query
  if (!text) return res.status(400).json({ error: 'Missing text' })
  try {
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(text)}`
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://translate.google.com/',
        'Accept': 'audio/mpeg,audio/*'
      }
    })
    if (!response.ok) {
      console.error(`TTS fetch failed: ${response.status}`)
      return res.status(502).json({ error: 'TTS fetch failed' })
    }
    res.set('Content-Type', 'audio/mpeg')
    res.set('Cache-Control', 'public, max-age=3600')
    res.set('Access-Control-Allow-Origin', '*')
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
    console.error('TTS proxy error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

// Silence Chrome DevTools probe
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.json({}))

// POST /api/translate — translate single text
app.post('/api/translate', express.json(), async (req, res) => {
  const { text, targetLang } = req.body
  if (!text || !targetLang) return res.status(400).json({ error: 'Missing text or targetLang' })
  const langName = targetLang === 'ta' ? 'Tamil (தமிழ்)' : 'English'
  try {
    const prompt = targetLang === 'ta'
      ? `Translate the following text to Tamil (தமிழ்). Return ONLY the translated Tamil text, no English, no explanation:\n\n${text}`
      : `Translate the following text to English. Return ONLY the translated text:\n\n${text}`
    const translated = await callAI(prompt, { temperature: 0.1, max_tokens: 600 })
    if (!translated) return res.status(500).json({ error: 'Translation failed' })
    res.json({ translated: translated.trim() })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/translate-batch — translate all disease fields in ONE API call (much faster)
app.post('/api/translate-batch', express.json(), async (req, res) => {
  const { fields, targetLang } = req.body
  if (!fields || !targetLang) return res.status(400).json({ error: 'Missing fields or targetLang' })
  const langName = targetLang === 'ta' ? 'Tamil (தமிழ்)' : 'English'
  const prompt = targetLang === 'ta'
    ? `Translate ALL text values in the following JSON to Tamil (தமிழ்). CRITICAL: Use pure Tamil script only — do NOT include any English words in the values. JSON keys must stay in English. Return ONLY valid JSON with the same structure and no extra text:\n\n${JSON.stringify(fields)}`
    : `Translate ALL text values in the following JSON to English. Return ONLY valid JSON with the same structure and no extra text:\n\n${JSON.stringify(fields)}`
  try {
    const content = await callAI(prompt, { temperature: 0.1, max_tokens: 2000 })
    if (!content) return res.status(500).json({ error: 'Translation failed' })
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (match) parsed = JSON.parse(match[0])
      else return res.status(500).json({ error: 'Translation response was not valid JSON' })
    }
    res.json(parsed)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/weather-risk?lat=xx&lon=xx — get weather + AI disease risk prediction
app.get('/api/weather-risk', async (req, res) => {
  const { lat, lon } = req.query
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon required' })

  try {
    // Fetch weather from OpenWeatherMap
    const WEATHER_KEY = process.env.OPENWEATHER_API_KEY
    let weather = null

    if (WEATHER_KEY && WEATHER_KEY !== 'your_openweathermap_api_key_here') {
      const wRes = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${WEATHER_KEY}&units=metric`
      )
      weather = await wRes.json()
    } else {
      // Fallback: use open-meteo (no API key needed)
      const wRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,weather_code&timezone=auto`
      )
      const wData = await wRes.json()
      const c = wData.current
      weather = {
        name: 'Your Location',
        main: {
          temp: c.temperature_2m,
          humidity: c.relative_humidity_2m,
          feels_like: c.temperature_2m
        },
        wind: { speed: c.wind_speed_10m },
        weather: [{ description: c.weather_code >= 61 ? 'rainy' : c.weather_code >= 45 ? 'foggy' : 'clear' }],
        rain: c.precipitation > 0 ? { '1h': c.precipitation } : null,
        _source: 'open-meteo'
      }
    }

    const temp = weather.main?.temp
    const humidity = weather.main?.humidity
    const windSpeed = weather.wind?.speed
    const condition = weather.weather?.[0]?.description || 'unknown'
    const rain = weather.rain?.['1h'] || weather.rain?.['3h'] || 0
    const location = weather.name || 'Your Location'

    // Ask AI to predict disease risks based on weather
    const aiPrompt = `You are a plant pathology expert. Based on the following weather conditions, predict which plant diseases are most likely to occur and give farmers actionable advice.

Weather Data:
- Location: ${location}
- Temperature: ${temp}°C
- Humidity: ${humidity}%
- Wind Speed: ${windSpeed} m/s
- Condition: ${condition}
- Rainfall: ${rain}mm

Respond ONLY with this JSON (no markdown):
{
  "location": "${location}",
  "temp": ${temp},
  "humidity": ${humidity},
  "condition": "${condition}",
  "riskLevel": "Low or Medium or High",
  "summary": "2 sentence summary of disease risk today",
  "diseases": [
    {
      "name": "Disease name",
      "plant": "Affected crops",
      "risk": "Low or Medium or High",
      "reason": "Why this weather causes this disease",
      "prevention": "What farmers should do now"
    }
  ],
  "generalAdvice": ["advice 1", "advice 2", "advice 3"]
}`

    const content = await callAI(aiPrompt, { temperature: 0.2, max_tokens: 1200 })
    if (!content) return res.status(500).json({ error: 'AI prediction failed' })

    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    const prediction = JSON.parse(cleaned)
    res.json(prediction)
  } catch (err) {
    console.error('Weather risk error:', err.message)
    res.status(500).json({ error: 'Weather analysis failed: ' + err.message })
  }
})

app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

app.listen(PORT, () => {
  console.log(`Leonux AI backend running on http://localhost:${PORT}`)
})
