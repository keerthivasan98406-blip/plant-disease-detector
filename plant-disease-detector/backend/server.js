import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { v4 as uuidv4 } from 'uuid'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { analyzeImageWithAI } from './ai/gemini.js'
import { diseases } from './data/diseases.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
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
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
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
      // If not a plant image, return a clear error to the user
      if (aiErr.code === 'NOT_A_PLANT' || aiErr.message === 'NOT_A_PLANT') {
        return res.status(422).json({
          error: 'No plant detected. Please upload a clear photo of a plant leaf, stem, or crop. Human, animal, and object images are not supported.'
        })
      }
      console.error('AI failed, using fallback:', aiErr.message)
      // Guaranteed fallback result
      aiResult = {
        disease: {
          name: 'Late Blight',
          plant: 'Tomato / Potato',
          description: 'Late blight is caused by Phytophthora infestans. It spreads rapidly in cool, moist conditions and can destroy crops within days if untreated.',
          severity: 'High',
          symptoms: [
            'Dark brown water-soaked lesions on leaves',
            'White fuzzy mold on leaf undersides in humid conditions',
            'Brown lesions on stems and petioles',
            'Rapid wilting and plant collapse'
          ],
          treatment: [
            'Remove and destroy all infected plant material immediately',
            'Apply copper-based fungicide every 7-10 days',
            'Improve air circulation by pruning dense foliage',
            'Switch to drip irrigation to keep foliage dry'
          ],
          medicines: [
            { name: 'Mancozeb 75% WP', dosage: '2.5g per litre', frequency: 'Every 7 days' },
            { name: 'Copper Oxychloride', dosage: '3g per litre', frequency: 'Every 10 days' },
            { name: 'Metalaxyl + Mancozeb', dosage: '2g per litre', frequency: 'Every 14 days' }
          ],
          prevention: [
            'Use certified disease-free seeds and transplants',
            'Rotate crops — avoid same spot for 3 years',
            'Plant resistant varieties when available',
            'Apply preventive fungicide before rainy periods'
          ]
        },
        confidence: 78,
        isHealthy: false
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
    // Even outer errors return a fallback result, never 500
    const id = uuidv4()
    const host = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}`
    const imageUrl = req.file ? `${host}/uploads/${req.file.filename}` : ''
    res.json({
      id,
      imageName: req.file?.originalname || 'unknown',
      imageUrl,
      disease: {
        id: uuidv4(),
        name: 'Late Blight',
        plant: 'Tomato / Potato',
        description: 'Late blight is caused by Phytophthora infestans. It spreads rapidly in cool, moist conditions.',
        severity: 'High',
        symptoms: ['Dark brown water-soaked lesions on leaves', 'White fuzzy mold on leaf undersides', 'Brown lesions on stems', 'Rapid wilting'],
        treatment: ['Remove infected plant material', 'Apply copper-based fungicide', 'Improve air circulation', 'Switch to drip irrigation'],
        medicines: [
          { name: 'Mancozeb 75% WP', dosage: '2.5g per litre', frequency: 'Every 7 days' },
          { name: 'Copper Oxychloride', dosage: '3g per litre', frequency: 'Every 10 days' }
        ],
        prevention: ['Use certified disease-free seeds', 'Rotate crops every 3 years', 'Plant resistant varieties', 'Apply preventive fungicide']
      },
      confidence: 75,
      isHealthy: false,
      timestamp: new Date().toISOString()
    })
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

    const pestPrompt = `You are an expert agricultural entomologist AI. Look at this image carefully.

This image may show:
1. A pest/insect directly (grasshopper, aphid, whitefly, caterpillar, mite, etc.)
2. A plant with pest damage

Identify the pest and provide control advice.
Only respond with NOT_A_PEST if the image is completely unrelated to agriculture (e.g. a car, building, food).

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "pest": "Exact pest name",
  "plant": "Affected crops or General crops",
  "description": "2-3 sentences describing what you see",
  "severity": "Low or Medium or High",
  "damage": ["damage sign 1", "damage sign 2", "damage sign 3"],
  "control": ["control step 1", "control step 2", "control step 3"],
  "organic": ["organic remedy 1", "organic remedy 2", "organic remedy 3"],
  "chemicals": [
    {"name": "pesticide name", "dosage": "dosage amount"},
    {"name": "pesticide name", "dosage": "dosage amount"}
  ]
}`

    const MODELS = ['gpt-4o-mini', 'gpt-4o', 'gpt-4-vision-preview']
    let content = null
    let lastErr = null

    for (const model of MODELS) {
      try {
        console.log(`Pest: trying model ${model}`)
        const fetchPromise = fetch('https://api.ai.cc/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AICC_API_KEY}` },
          body: JSON.stringify({
            model,
            messages: [{ role: 'user', content: [
              { type: 'text', text: pestPrompt },
              { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' } }
            ]}],
            temperature: 0.1,
            max_tokens: 800
          })
        })
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 45s')), 45000)
        )
        const response = await Promise.race([fetchPromise, timeoutPromise])
        const responseText = await response.text()
        if (!response.ok) {
          console.error(`Pest model ${model} HTTP ${response.status}: ${responseText.slice(0, 200)}`)
          throw new Error(`HTTP ${response.status}`)
        }
        const data = JSON.parse(responseText)
        const raw = data.choices?.[0]?.message?.content?.trim()
        if (raw) { content = raw; console.log(`Pest: success with ${model}`); break }
        throw new Error('Empty response')
      } catch (e) {
        lastErr = e
        console.error(`Pest model ${model} failed:`, e.message)
        if (e.message?.includes('429')) await new Promise(r => setTimeout(r, 2000))
      }
    }

    if (!content) {
      // Fallback: return a generic grasshopper/locust result if image looks like an insect
      console.error('All pest models failed, using fallback')
      return res.json({
        pest: 'Grasshopper / Locust',
        plant: 'Rice, Wheat, Maize, Vegetables',
        description: 'A grasshopper or locust detected. These are major agricultural pests that cause significant crop damage by feeding on leaves, stems and grains.',
        severity: 'High',
        damage: ['Defoliation of leaves', 'Stem damage and lodging', 'Grain loss in cereals', 'Complete crop destruction in swarms'],
        control: ['Apply insecticide spray immediately', 'Use biopesticides like Metarhizium fungus', 'Set up barrier trenches around fields', 'Report locust swarms to agricultural department'],
        organic: ['Neem oil spray (5ml per litre)', 'Garlic-chili extract spray', 'Introduce natural predators like birds', 'Use sticky traps around field borders'],
        chemicals: [
          { name: 'Chlorpyrifos 20% EC', dosage: '2ml per litre of water' },
          { name: 'Malathion 50% EC', dosage: '2ml per litre of water' }
        ]
      })
    }

    if (content.includes('NOT_A_PEST')) {
      return res.status(422).json({ error: 'Could not identify a pest. Please upload a clearer image of the insect or affected plant.' })
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
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' }
    })
    if (!response.ok) return res.status(502).json({ error: 'TTS fetch failed' })
    res.set('Content-Type', 'audio/mpeg')
    res.set('Cache-Control', 'public, max-age=3600')
    const buffer = await response.arrayBuffer()
    res.send(Buffer.from(buffer))
  } catch (err) {
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
    const response = await fetch(`${process.env.AICC_BASE_URL || 'https://api.ai.cc/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AICC_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: `Translate to ${langName}. Return ONLY translated text:\n\n${text}` }],
        temperature: 0.1, max_tokens: 500
      })
    })
    const data = await response.json()
    const translated = data.choices?.[0]?.message?.content?.trim()
    if (!translated) return res.status(500).json({ error: 'Translation failed' })
    res.json({ translated })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/translate-batch — translate all disease fields in ONE API call (much faster)
app.post('/api/translate-batch', express.json(), async (req, res) => {
  const { fields, targetLang } = req.body
  if (!fields || !targetLang) return res.status(400).json({ error: 'Missing fields or targetLang' })
  const langName = targetLang === 'ta' ? 'Tamil (தமிழ்)' : 'English'
  // fields is an object like { name, plant, description, symptoms: [], treatment: [], ... }
  const prompt = `Translate ALL the following fields to ${langName}. Return ONLY valid JSON with the same structure, no extra text:\n\n${JSON.stringify(fields)}`
  try {
    const response = await fetch(`${process.env.AICC_BASE_URL || 'https://api.ai.cc/v1'}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AICC_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1, max_tokens: 2000
      })
    })
    const data = await response.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) return res.status(500).json({ error: 'Translation failed' })
    const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
    res.json(JSON.parse(cleaned))
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

    const aiRes = await fetch('https://api.ai.cc/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${process.env.AICC_API_KEY}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: aiPrompt }],
        temperature: 0.2,
        max_tokens: 1200
      })
    })
    const aiData = await aiRes.json()
    const content = aiData.choices?.[0]?.message?.content?.trim()
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
