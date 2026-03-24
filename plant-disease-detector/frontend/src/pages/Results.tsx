import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useCallback, useRef, useState } from 'react'
import { CheckCircle, Pill, ShieldCheck, AlertTriangle, ArrowLeft, Camera, ChevronRight, Leaf, Volume2, VolumeX, Loader2 } from 'lucide-react'
import SeverityBadge from '../components/SeverityBadge'
import { ScanResult } from '../types'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function translateText(text: string, targetLang: string): Promise<string> {
  if (targetLang === 'en') return text
  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    })
    const data = await res.json()
    return data.translated || text
  } catch {
    return text
  }
}

// Split long text into chunks ≤200 chars at sentence boundaries for gTTS URL limit
function splitChunks(text: string, max = 180): string[] {
  const sentences = text.split(/(?<=[.!?।])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length > max) {
      if (current) chunks.push(current.trim())
      current = s
    } else {
      current = (current + ' ' + s).trim()
    }
  }
  if (current) chunks.push(current.trim())
  return chunks.length ? chunks : [text.slice(0, max)]
}

// Play Tamil audio using Google Translate TTS (supports ta)
async function speakTamil(text: string, onDone: () => void, onError: () => void) {
  const chunks = splitChunks(text)
  let i = 0
  const playNext = () => {
    if (i >= chunks.length) { onDone(); return }
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q=${encodeURIComponent(chunks[i])}`
    const audio = new Audio(url)
    audio.onended = () => { i++; playNext() }
    audio.onerror = () => onError()
    audio.play().catch(() => onError())
    i++
  }
  playNext()
}

// TTS hook — Google TTS for Tamil, Web Speech API for English
function useTTS() {
  const [speaking, setSpeaking] = useState<string | null>(null)
  const [translating, setTranslating] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
    setSpeaking(null)
  }, [])

  const speak = useCallback(async (id: string, text: string, lang: string) => {
    stop()
    if (speaking === id) return

    setTranslating(id)
    const finalText = await translateText(text, lang)
    setTranslating(null)
    setSpeaking(id)

    if (lang === 'ta') {
      await speakTamil(
        finalText,
        () => setSpeaking(null),
        () => {
          // Fallback to Web Speech if Google TTS blocked
          const utter = new SpeechSynthesisUtterance(finalText)
          utter.lang = 'ta-IN'
          utter.rate = 0.85
          utter.onend = () => setSpeaking(null)
          utter.onerror = () => setSpeaking(null)
          window.speechSynthesis.speak(utter)
        }
      )
    } else {
      const utter = new SpeechSynthesisUtterance(finalText)
      const voices = window.speechSynthesis.getVoices()
      const enVoice = voices.find(v => v.lang.startsWith('en-'))
      if (enVoice) utter.voice = enVoice
      utter.lang = 'en-US'
      utter.rate = 0.9
      utter.onend = () => setSpeaking(null)
      utter.onerror = () => setSpeaking(null)
      setTimeout(() => window.speechSynthesis.speak(utter), 50)
    }
  }, [speaking, stop])

  return { speaking, translating, speak, stop }
}

export default function Results() {
  const { state } = useLocation() as { state: ScanResult | null }
  const navigate = useNavigate()
  const { speaking, translating, speak } = useTTS()
  const [ttsLang, setTtsLang] = useState<'en' | 'ta'>('en')
  const [translatingPage, setTranslatingPage] = useState(false)
  const [taData, setTaData] = useState<typeof state['disease'] | null>(null)

  if (!state) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-6">No scan result found.</p>
        <Link to="/scanner" className="btn-primary">Go to Scanner</Link>
      </div>
    )
  }

  const { disease: origDisease, confidence, imageUrl, imageName, isHealthy } = state

  // Use translated data when in Tamil mode, else original
  const disease = (ttsLang === 'ta' && taData) ? taData : origDisease

  const switchLang = async (l: 'en' | 'ta') => {
    setTtsLang(l)
    if (l === 'ta' && !taData) {
      setTranslatingPage(true)
      try {
        // Translate all text fields in parallel
        const [name, plant, description, symptoms, treatment, prevention, medicines] = await Promise.all([
          translateText(origDisease.name, 'ta'),
          translateText(origDisease.plant, 'ta'),
          translateText(origDisease.description, 'ta'),
          Promise.all(origDisease.symptoms.map(s => translateText(s, 'ta'))),
          Promise.all(origDisease.treatment.map(t => translateText(t, 'ta'))),
          Promise.all(origDisease.prevention.map(p => translateText(p, 'ta'))),
          Promise.all(origDisease.medicines.map(async m => ({
            name: await translateText(m.name, 'ta'),
            dosage: await translateText(m.dosage, 'ta'),
            frequency: await translateText(m.frequency, 'ta'),
          })))
        ])
        setTaData({ ...origDisease, name, plant, description, symptoms, treatment, prevention, medicines })
      } finally {
        setTranslatingPage(false)
      }
    }
  }

  const severityBg: Record<string, string> = {
    High: 'from-red-900/80 via-red-800/60',
    Medium: 'from-amber-900/80 via-amber-800/60',
    Low: 'from-emerald-900/80 via-emerald-800/60',
  }
  const gradientClass = severityBg[disease.severity] ?? 'from-emerald-900/80 via-emerald-800/60'

  const SpeakBtn = ({ id, text }: { id: string; text: string }) => (
    <button
      onClick={() => speak(id, text, ttsLang)}
      disabled={translating === id}
      title={speaking === id ? 'Stop' : ttsLang === 'ta' ? 'தமிழில் கேளுங்கள்' : 'Read aloud'}
      className={`ml-auto p-1.5 rounded-lg transition-colors ${
        speaking === id
          ? 'bg-emerald-100 text-emerald-700'
          : translating === id
          ? 'text-amber-500'
          : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'
      }`}
    >
      {translating === id
        ? <Loader2 className="w-4 h-4 animate-spin" />
        : speaking === id
        ? <VolumeX className="w-4 h-4" />
        : <Volume2 className="w-4 h-4" />}
    </button>
  )

  return (
    <div>
      {/* Hero banner */}
      <div className="relative h-52 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=1400&q=80"
          alt="Plant diagnosis"
          className="w-full h-full object-cover"
        />
        <div className={`absolute inset-0 bg-gradient-to-r ${gradientClass} to-transparent`} />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-12">
          <div>
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-3 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Scanner
            </button>
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-1">
              <Leaf className="w-4 h-4" />
              Diagnosis Report
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">{disease.name}</h1>
            <p className="text-emerald-100 mt-1 text-sm">{disease.plant}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">

        {/* Healthy plant banner */}
        {isHealthy && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-300 text-emerald-800 px-5 py-4 rounded-2xl mb-6">
            <CheckCircle className="w-6 h-6 text-emerald-500 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">{ttsLang === 'ta' ? 'உங்கள் தாவரம் ஆரோக்கியமாக உள்ளது!' : 'Your plant looks healthy!'}</p>
              <p className="text-xs text-emerald-600 mt-0.5">{ttsLang === 'ta' ? 'நோய் கண்டறியப்படவில்லை. கீழே உள்ள தடுப்பு குறிப்புகளை பின்பற்றுங்கள்.' : 'No disease detected. Follow the prevention tips below to keep it that way.'}</p>
            </div>
          </div>
        )}

        {/* Summary card */}
        <div className="card mb-8 border-l-4 border-l-emerald-500">
          <div className="flex flex-col sm:flex-row gap-6">
            <img
              src={imageUrl}
              alt={imageName}
              className="w-full sm:w-48 h-40 object-cover rounded-2xl flex-shrink-0 bg-gray-100"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{ttsLang === 'ta' ? 'கண்டறியப்பட்ட நோய்' : 'Detected Disease'}</p>
                  <h2 className="text-2xl font-extrabold text-gray-900">{disease.name}</h2>
                  <p className="text-emerald-600 font-semibold text-sm mt-1">{disease.plant}</p>
                </div>
                <SeverityBadge severity={disease.severity} />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">{ttsLang === 'ta' ? 'நம்பகத்தன்மை' : 'Confidence'}</span>
                  <span className="text-sm font-bold text-gray-700">{confidence}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-700"
                    style={{ width: `${confidence}%` }}
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4 leading-relaxed">{disease.description}</p>
            </div>
          </div>
        </div>

        {/* Language + TTS toggle */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <Volume2 className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500 font-medium">{ttsLang === 'ta' ? 'மொழி:' : 'Language:'}</span>
          <div className="flex rounded-xl overflow-hidden border border-gray-200">
            {(['en', 'ta'] as const).map(l => (
              <button
                key={l}
                onClick={() => switchLang(l)}
                disabled={translatingPage}
                className={`px-4 py-1.5 text-sm font-semibold transition-colors ${
                  ttsLang === l
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {l === 'en' ? 'English' : 'தமிழ்'}
              </button>
            ))}
          </div>
          {translatingPage
            ? <span className="flex items-center gap-1.5 text-xs text-amber-600"><Loader2 className="w-3 h-3 animate-spin" /> தமிழில் மொழிபெயர்க்கிறது...</span>
            : <span className="text-xs text-gray-400">{ttsLang === 'ta' ? '🔊 கேட்க கிளிக் செய்யுங்கள்' : 'Click 🔊 on any card to listen'}</span>
          }
        </div>

        {/* Detail grid */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Symptoms */}
          <div className="card border-t-4 border-t-amber-400">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-amber-100 p-2 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="font-bold text-gray-900">{ttsLang === 'ta' ? 'அறிகுறிகள்' : 'Symptoms'}</h2>
              <SpeakBtn id="symptoms" text={`${ttsLang === 'ta' ? 'அறிகுறிகள்' : 'Symptoms'}. ${disease.symptoms.join('. ')}`} />
            </div>
            <ul className="space-y-2.5">
              {disease.symptoms.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <ChevronRight className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Treatment */}
          <div className="card border-t-4 border-t-emerald-400">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-emerald-100 p-2 rounded-xl">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <h2 className="font-bold text-gray-900">{ttsLang === 'ta' ? 'சிகிச்சை படிகள்' : 'Treatment Steps'}</h2>
              <SpeakBtn id="treatment" text={`${ttsLang === 'ta' ? 'சிகிச்சை படிகள்' : 'Treatment Steps'}. ${disease.treatment.join('. ')}`} />
            </div>
            <ol className="space-y-3">
              {disease.treatment.map((t, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <span className="bg-emerald-600 text-white font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {t}
                </li>
              ))}
            </ol>
          </div>

          {/* Medicines */}
          <div className="card border-t-4 border-t-blue-400">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-blue-100 p-2 rounded-xl">
                <Pill className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="font-bold text-gray-900">{ttsLang === 'ta' ? 'பரிந்துரைக்கப்பட்ட மருந்துகள்' : 'Recommended Medicines'}</h2>
              <SpeakBtn id="medicines" text={`${ttsLang === 'ta' ? 'பரிந்துரைக்கப்பட்ட மருந்துகள்' : 'Recommended Medicines'}. ${disease.medicines.map(m => `${m.name}, ${ttsLang === 'ta' ? 'அளவு' : 'dosage'} ${m.dosage}, ${ttsLang === 'ta' ? 'அதிர்வெண்' : 'frequency'} ${m.frequency}`).join('. ')}`} />
            </div>
            <div className="space-y-3">
              {disease.medicines.map((m, i) => (
                <div key={i} className="bg-blue-50 rounded-2xl p-4">
                  <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-xs bg-white border border-blue-100 rounded-lg px-2 py-1 text-gray-600">
                      {ttsLang === 'ta' ? 'அளவு' : 'Dosage'}: <span className="font-semibold text-gray-800">{m.dosage}</span>
                    </span>
                    <span className="text-xs bg-white border border-blue-100 rounded-lg px-2 py-1 text-gray-600">
                      {ttsLang === 'ta' ? 'அதிர்வெண்' : 'Frequency'}: <span className="font-semibold text-gray-800">{m.frequency}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Prevention */}
          <div className="card border-t-4 border-t-green-400">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-green-100 p-2 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="font-bold text-gray-900">{ttsLang === 'ta' ? 'தடுப்பு குறிப்புகள்' : 'Prevention Tips'}</h2>
              <SpeakBtn id="prevention" text={`${ttsLang === 'ta' ? 'தடுப்பு குறிப்புகள்' : 'Prevention Tips'}. ${disease.prevention.join('. ')}`} />
            </div>
            <ul className="space-y-2.5">
              {disease.prevention.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                  {p}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Drone / fertilizer promo strip */}
        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          <div className="relative rounded-2xl overflow-hidden h-40 shadow-md group">
            <img
              src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=700&q=80"
              alt="Agricultural drone"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-white font-bold text-sm">Drone Crop Spraying</p>
              <p className="text-gray-300 text-xs mt-0.5">Precision pesticide application</p>
            </div>
          </div>
          <div className="relative rounded-2xl overflow-hidden h-40 shadow-md group">
            <img
              src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=700&q=80"
              alt="Fertilizer field"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/70 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4">
              <p className="text-white font-bold text-sm">Fertilizer Management</p>
              <p className="text-emerald-200 text-xs mt-0.5">Soil health & nutrient balance</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <Link to="/scanner" className="btn-primary inline-flex items-center gap-2">
            <Camera className="w-4 h-4" />
            Scan Another Plant
          </Link>
        </div>
      </div>
    </div>
  )
}
