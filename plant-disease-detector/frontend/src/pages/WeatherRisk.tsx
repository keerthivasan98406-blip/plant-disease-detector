import { useState, useEffect } from 'react'
import { Cloud, Thermometer, Droplets, Wind, AlertTriangle, ShieldCheck, Loader2, MapPin, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import { useLang } from '../context/LangContext'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface DiseaseRisk {
  name: string
  plant: string
  risk: 'Low' | 'Medium' | 'High'
  reason: string
  prevention: string
}

interface WeatherPrediction {
  location: string
  temp: number
  humidity: number
  condition: string
  riskLevel: 'Low' | 'Medium' | 'High'
  summary: string
  diseases: DiseaseRisk[]
  generalAdvice: string[]
}

async function translateText(text: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang: 'ta' })
    })
    const data = await res.json()
    return data.translated || text
  } catch { return text }
}

const riskColor = {
  High: { bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-700', badge: 'bg-red-100 text-red-700 border-red-200' },
  Medium: { bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-700', badge: 'bg-amber-100 text-amber-700 border-amber-200' },
  Low: { bg: 'bg-emerald-50', border: 'border-emerald-300', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
}

export default function WeatherRisk() {
  const { isTamil } = useLang()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [data, setData] = useState<WeatherPrediction | null>(null)
  const [taData, setTaData] = useState<WeatherPrediction | null>(null)
  const [translating, setTranslating] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [locationName, setLocationName] = useState('')

  const t = (en: string, ta: string) => isTamil ? ta : en
  const display = isTamil && taData ? taData : data

  const fetchRisk = async (lat: number, lon: number) => {
    setLoading(true)
    setError('')
    setData(null)
    setTaData(null)
    try {
      const res = await fetch(`${API_BASE}/api/weather-risk?lat=${lat}&lon=${lon}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
      setLocationName(json.location)
    } catch (e) {
      setError(t('Failed to get weather data. Please try again.', 'வானிலை தரவு பெற முடியவில்லை. மீண்டும் முயற்சிக்கவும்.'))
    } finally {
      setLoading(false)
    }
  }

  const getLocation = () => {
    setError('')
    if (!navigator.geolocation) {
      setError(t('Geolocation not supported by your browser.', 'உங்கள் உலாவி இருப்பிட சேவையை ஆதரிக்கவில்லை.'))
      return
    }
    setLoading(true)
    navigator.geolocation.getCurrentPosition(
      pos => fetchRisk(pos.coords.latitude, pos.coords.longitude),
      () => {
        setLoading(false)
        setError(t('Location access denied. Please allow location permission.', 'இருப்பிட அனுமதி மறுக்கப்பட்டது.'))
      }
    )
  }

  // Auto-translate when Tamil mode on
  useEffect(() => {
    if (isTamil && data && !taData) {
      setTranslating(true)
      Promise.all([
        translateText(data.summary),
        Promise.all(data.generalAdvice.map(a => translateText(a))),
        Promise.all(data.diseases.map(async d => ({
          ...d,
          name: await translateText(d.name),
          plant: await translateText(d.plant),
          reason: await translateText(d.reason),
          prevention: await translateText(d.prevention),
        })))
      ]).then(([summary, generalAdvice, diseases]) => {
        setTaData({ ...data, summary, generalAdvice, diseases })
      }).finally(() => setTranslating(false))
    }
  }, [isTamil, data])

  const speakSummary = () => {
    if (!display) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const text = `${display.summary}. ${t('General advice', 'பொது அறிவுரை')}: ${display.generalAdvice.join('. ')}`
    if (isTamil) {
      const chunks = text.match(/.{1,180}/g) || [text]
      let i = 0; setSpeaking(true)
      const next = () => {
        if (i >= chunks.length) { setSpeaking(false); return }
        const a = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q=${encodeURIComponent(chunks[i])}`)
        a.onended = () => { i++; next() }
        a.onerror = () => setSpeaking(false)
        a.play().catch(() => setSpeaking(false))
        i++
      }
      next()
    } else {
      const u = new SpeechSynthesisUtterance(text)
      u.lang = 'en-US'; u.rate = 0.9
      u.onend = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(u)
    }
  }

  useEffect(() => { getLocation() }, [])

  return (
    <div>
      {/* Hero */}
      <div className="relative h-52 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1504608524841-42584120d693?w=1400&q=80" alt="Weather" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/80 via-blue-800/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-12">
          <div>
            <div className="flex items-center gap-2 text-blue-300 text-sm font-medium mb-2">
              <Cloud className="w-4 h-4" />
              {t('AI Weather Analysis', 'AI வானிலை பகுப்பாய்வு')}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">
              {t('Weather-Based Disease Risk', 'வானிலை அடிப்படையிலான நோய் அபாயம்')}
            </h1>
            <p className="text-blue-100 mt-1 text-sm">
              {t('AI predicts plant disease risks based on your local weather', 'உங்கள் உள்ளூர் வானிலையின் அடிப்படையில் AI நோய் அபாயங்களை கணிக்கிறது')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-gray-500 font-medium">{t('Fetching weather & analyzing disease risks...', 'வானிலை பெற்று நோய் அபாயங்களை பகுப்பாய்கிறது...')}</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-2xl max-w-md text-center">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
            <button onClick={getLocation} className="btn-primary flex items-center gap-2">
              <MapPin className="w-4 h-4" />{t('Try Again', 'மீண்டும் முயற்சி')}
            </button>
          </div>
        )}

        {/* Results */}
        {display && !loading && (
          <div className="space-y-6">

            {/* Weather summary card */}
            <div className="card border-l-4 border-l-blue-500">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MapPin className="w-4 h-4 text-blue-500" />
                    <span className="font-bold text-gray-900">{display.location}</span>
                  </div>
                  <div className="flex flex-wrap gap-4 mt-3">
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Thermometer className="w-4 h-4 text-orange-500" />
                      <span className="font-semibold">{display.temp}°C</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Droplets className="w-4 h-4 text-blue-500" />
                      <span className="font-semibold">{display.humidity}%</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-gray-600">
                      <Wind className="w-4 h-4 text-gray-400" />
                      <span className="font-semibold capitalize">{display.condition}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-sm font-bold px-4 py-1.5 rounded-full border ${riskColor[display.riskLevel]?.badge}`}>
                    {t(`${display.riskLevel} Risk`, display.riskLevel === 'High' ? 'அதிக அபாயம்' : display.riskLevel === 'Medium' ? 'நடுத்தர அபாயம்' : 'குறைந்த அபாயம்')}
                  </span>
                  <button onClick={speakSummary} className={`p-2 rounded-xl transition-colors ${speaking ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'}`}>
                    {speaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </button>
                  <button onClick={getLocation} className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title={t('Refresh', 'புதுப்பி')}>
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4 leading-relaxed">{display.summary}</p>
              {translating && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />தமிழில் மொழிபெயர்க்கிறது...</p>}
            </div>

            {/* Disease risk cards */}
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-4">{t('Disease Risk Forecast', 'நோய் அபாய முன்னறிவிப்பு')}</h2>
              <div className="grid md:grid-cols-2 gap-4">
                {display.diseases.map((d, i) => {
                  const c = riskColor[d.risk] || riskColor.Medium
                  return (
                    <div key={i} className={`card border-l-4 ${c.border}`}>
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <h3 className="font-bold text-gray-900">{d.name}</h3>
                          <p className={`text-xs font-semibold ${c.text}`}>{d.plant}</p>
                        </div>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${c.badge}`}>
                          {t(d.risk, d.risk === 'High' ? 'அதிகம்' : d.risk === 'Medium' ? 'நடுத்தரம்' : 'குறைவு')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2 leading-relaxed">
                        <span className="font-semibold text-gray-700">{t('Why:', 'ஏன்:')} </span>{d.reason}
                      </p>
                      <div className={`${c.bg} rounded-xl px-3 py-2`}>
                        <p className="text-xs font-semibold text-gray-700 mb-1">{t('Action:', 'நடவடிக்கை:')}</p>
                        <p className="text-xs text-gray-600">{d.prevention}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* General advice */}
            <div className="card border-t-4 border-t-emerald-400">
              <div className="flex items-center gap-2 mb-4">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <h2 className="font-bold text-gray-900">{t('General Advice for Today', 'இன்றைய பொது அறிவுரை')}</h2>
              </div>
              <ul className="space-y-2">
                {display.generalAdvice.map((a, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="bg-emerald-100 text-emerald-700 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </div>
    </div>
  )
}
