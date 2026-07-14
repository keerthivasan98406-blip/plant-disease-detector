import { useLocation, useNavigate, Link } from 'react-router-dom'
import { useCallback, useRef, useState, useEffect } from 'react'
import {
  CheckCircle, Pill, ShieldCheck, AlertTriangle, ArrowLeft,
  Camera, ChevronRight, Leaf, Volume2, VolumeX, Loader2, Sparkles
} from 'lucide-react'
import SeverityBadge from '../components/SeverityBadge'
import { ScanResult, Disease } from '../types'
import { useLang } from '../context/LangContext'

const API_BASE = import.meta.env.VITE_API_URL || ''

async function translateText(text: string, targetLang: string): Promise<string> {
  if (targetLang === 'en') return text
  if (targetLang === 'ta' && /[\u0B80-\u0BFF]/.test(text)) return text
  try {
    const res = await fetch(`${API_BASE}/api/translate`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    })
    const data = await res.json()
    return data.translated || text
  } catch { return text }
}

function splitChunks(text: string, max = 180): string[] {
  const sentences = text.split(/(?<=[.!?।])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length > max) {
      if (current) chunks.push(current.trim()); current = s
    } else { current = (current + ' ' + s).trim() }
  }
  if (current) chunks.push(current.trim())
  return chunks.length ? chunks : [text.slice(0, max)]
}

function speakTamil(text: string, onDone: () => void, onError: () => void) {
  const chunks = splitChunks(text); let i = 0
  const playNext = () => {
    if (i >= chunks.length) { onDone(); return }
    const chunk = chunks[i++]
    const audio = new Audio(`${API_BASE}/api/tts?lang=ta&text=${encodeURIComponent(chunk)}`)
    audio.onended = playNext
    audio.onerror = () => {
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ta-IN'; u.rate = 0.85
      u.onend = onDone; u.onerror = onError; window.speechSynthesis.speak(u)
    }
    audio.play().catch(() => {
      const u = new SpeechSynthesisUtterance(text); u.lang = 'ta-IN'; u.rate = 0.85
      u.onend = onDone; u.onerror = onError; window.speechSynthesis.speak(u)
    })
  }
  playNext()
}

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
    stop(); if (speaking === id) return
    setTranslating(id)
    const finalText = await translateText(text, lang)
    setTranslating(null); setSpeaking(id)
    if (lang === 'ta') {
      speakTamil(finalText, () => setSpeaking(null), () => setSpeaking(null))
    } else {
      const u = new SpeechSynthesisUtterance(finalText)
      const v = window.speechSynthesis.getVoices().find(v => v.lang.startsWith('en-'))
      if (v) u.voice = v; u.lang = 'en-US'; u.rate = 0.9
      u.onend = () => setSpeaking(null); u.onerror = () => setSpeaking(null)
      setTimeout(() => window.speechSynthesis.speak(u), 50)
    }
  }, [speaking, stop])
  return { speaking, translating, speak, stop }
}

export default function Results() {
  const { state } = useLocation() as { state: ScanResult | null }
  const navigate = useNavigate()
  const { speaking, translating, speak, stop } = useTTS()
  const { lang: ttsLang, isTamil } = useLang()
  const [translatingPage, setTranslatingPage] = useState(false)
  const [taData, setTaData] = useState<Disease | null>(null)

  if (!state) return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <Leaf className="w-8 h-8 text-gray-300" />
      </div>
      <p className="text-gray-500 mb-6 font-medium">No scan result found.</p>
      <Link to="/scanner" className="btn-primary">Go to Scanner</Link>
    </div>
  )

  const { disease: origDisease, confidence, imageUrl, imageName, isHealthy } = state

  useEffect(() => {
    if (ttsLang === 'ta' && !taData && origDisease) {
      setTranslatingPage(true)
      fetch(`${API_BASE}/api/translate-batch`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: {
            name: origDisease.name, plant: origDisease.plant,
            description: origDisease.description, symptoms: origDisease.symptoms,
            treatment: origDisease.treatment, prevention: origDisease.prevention,
            medicines: origDisease.medicines
          }, targetLang: 'ta'
        })
      })
        .then(r => r.json())
        .then(t => setTaData({ ...origDisease, ...t }))
        .catch(() => setTaData(origDisease))
        .finally(() => setTranslatingPage(false))
    }
    stop()
  }, [ttsLang])

  const disease: Disease = (isTamil && taData) ? taData : origDisease

  const heroGradient = disease.severity === 'High'
    ? 'from-red-950/85 via-red-900/60'
    : disease.severity === 'Medium'
    ? 'from-amber-950/85 via-amber-900/60'
    : 'from-emerald-950/85 via-emerald-900/60'

  const accentColor = disease.severity === 'High' ? 'border-l-red-500'
    : disease.severity === 'Medium' ? 'border-l-amber-500' : 'border-l-emerald-500'

  const SpeakBtn = ({ id, text }: { id: string; text: string }) => (
    <button onClick={() => speak(id, text, ttsLang)} disabled={translating === id}
      title={speaking === id ? 'Stop' : ttsLang === 'ta' ? 'தமிழில் கேளுங்கள்' : 'Read aloud'}
      className={`ml-auto p-1.5 rounded-lg transition-all hover:scale-110 ${
        speaking === id ? 'bg-emerald-100 text-emerald-700' :
        translating === id ? 'text-amber-500' :
        'text-gray-300 hover:text-emerald-600 hover:bg-emerald-50'
      }`}>
      {translating === id ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : speaking === id ? <VolumeX className="w-3.5 h-3.5" />
        : <Volume2 className="w-3.5 h-3.5" />}
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img src={imageUrl || 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=1400&q=80'}
          alt="Plant scan" className="w-full h-full object-cover" />
        <div className={`absolute inset-0 bg-gradient-to-r ${heroGradient} to-transparent`} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50" />
        <div className="absolute inset-0 flex flex-col justify-end px-6 sm:px-10 pb-6">
          <button onClick={() => navigate(-1)}
            className="absolute top-4 left-4 sm:left-6 flex items-center gap-1.5 text-white/70 hover:text-white text-xs font-medium bg-black/20 hover:bg-black/30 backdrop-blur-sm px-3 py-1.5 rounded-full transition-all">
            <ArrowLeft className="w-3.5 h-3.5" />
            {isTamil ? 'திரும்பு' : 'Back'}
          </button>
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold mb-1.5 uppercase tracking-widest">
              <Leaf className="w-3.5 h-3.5" />
              {isTamil ? 'நோயறிதல் அறிக்கை' : 'Diagnosis Report'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg truncate">{disease.name}</h1>
            <p className="text-emerald-200 text-sm mt-0.5 font-medium">{disease.plant}</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">

        {/* Healthy banner */}
        {isHealthy && (
          <div className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-5 py-4 rounded-2xl mb-5 animate-fade-up">
            <div className="bg-emerald-500 p-2 rounded-xl flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="font-bold text-emerald-800 text-sm">
                {ttsLang === 'ta' ? 'உங்கள் தாவரம் ஆரோக்கியமாக உள்ளது!' : 'Your plant looks healthy! 🌿'}
              </p>
              <p className="text-xs text-emerald-600 mt-0.5">
                {ttsLang === 'ta' ? 'நோய் கண்டறியப்படவில்லை.' : 'No disease detected. Check prevention tips below to keep it healthy.'}
              </p>
            </div>
          </div>
        )}

        {/* Summary card */}
        <div className={`card mb-5 border-l-4 ${accentColor} animate-fade-up`}>
          <div className="flex flex-col sm:flex-row gap-5">
            <div className="relative w-full sm:w-44 h-36 sm:h-40 flex-shrink-0 rounded-2xl overflow-hidden bg-gray-100">
              <img src={imageUrl} alt={imageName} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">
                    {ttsLang === 'ta' ? 'கண்டறியப்பட்ட நோய்' : 'Detected Disease'}
                  </p>
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">{disease.name}</h2>
                  <p className="text-emerald-600 font-semibold text-sm mt-1">{disease.plant}</p>
                </div>
                <SeverityBadge severity={disease.severity} />
              </div>
              {/* Confidence bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-400 font-medium">
                    {ttsLang === 'ta' ? 'நம்பகத்தன்மை' : 'AI Confidence'}
                  </span>
                  <span className="text-sm font-black text-gray-900">{confidence}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-1000"
                    style={{ width: `${confidence}%` }} />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3 leading-relaxed line-clamp-2">{disease.description}</p>
            </div>
          </div>
        </div>

        {/* Translating spinner */}
        {translatingPage && (
          <div className="flex flex-col items-center gap-4 py-16 animate-fade-up">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
              <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
            </div>
            <p className="text-amber-600 font-bold">தமிழில் மொழிபெயர்க்கிறது...</p>
            <p className="text-xs text-gray-400">சில வினாடிகள் காத்திருங்கள்</p>
          </div>
        )}

        {!translatingPage && (
          <div className="grid md:grid-cols-2 gap-4">
            {/* Symptoms */}
            <div className="card border-t-4 border-t-amber-400 hover:shadow-md transition-shadow animate-fade-up">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-amber-100 p-2 rounded-xl">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                </div>
                <h2 className="font-bold text-gray-900">{ttsLang === 'ta' ? 'அறிகுறிகள்' : 'Symptoms'}</h2>
                <SpeakBtn id="symptoms" text={`${ttsLang === 'ta' ? 'அறிகுறிகள்' : 'Symptoms'}. ${disease.symptoms.join('. ')}`} />
              </div>
              <ul className="space-y-2.5">
                {disease.symptoms.map((s, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <ChevronRight className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />{s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Treatment */}
            <div className="card border-t-4 border-t-emerald-400 hover:shadow-md transition-shadow animate-fade-up-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <h2 className="font-bold text-gray-900">{ttsLang === 'ta' ? 'சிகிச்சை படிகள்' : 'Treatment Steps'}</h2>
                <SpeakBtn id="treatment" text={`${ttsLang === 'ta' ? 'சிகிச்சை' : 'Treatment'}. ${disease.treatment.join('. ')}`} />
              </div>
              <ol className="space-y-3">
                {disease.treatment.map((t, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                    <span className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-[10px] w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                      {i + 1}
                    </span>{t}
                  </li>
                ))}
              </ol>
            </div>

            {/* Medicines */}
            <div className="card border-t-4 border-t-blue-400 hover:shadow-md transition-shadow animate-fade-up">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-blue-100 p-2 rounded-xl">
                  <Pill className="w-4 h-4 text-blue-600" />
                </div>
                <h2 className="font-bold text-gray-900">{ttsLang === 'ta' ? 'மருந்துகள்' : 'Medicines'}</h2>
                <SpeakBtn id="medicines"
                  text={`${ttsLang === 'ta' ? 'மருந்துகள்' : 'Medicines'}. ${disease.medicines.map(m => `${m.name}, ${m.dosage}, ${m.frequency}`).join('. ')}`} />
              </div>
              <div className="space-y-3">
                {disease.medicines.map((m, i) => (
                  <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3.5 border border-blue-100">
                    <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-[11px] bg-white border border-blue-100 rounded-lg px-2 py-1 text-gray-600 font-medium">
                        💊 {ttsLang === 'ta' ? 'அளவு' : 'Dose'}: <span className="text-gray-800 font-bold">{m.dosage}</span>
                      </span>
                      <span className="text-[11px] bg-white border border-blue-100 rounded-lg px-2 py-1 text-gray-600 font-medium">
                        🔁 {ttsLang === 'ta' ? 'அதிர்வெண்' : 'Freq'}: <span className="text-gray-800 font-bold">{m.frequency}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prevention */}
            <div className="card border-t-4 border-t-teal-400 hover:shadow-md transition-shadow animate-fade-up-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-teal-100 p-2 rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                </div>
                <h2 className="font-bold text-gray-900">{ttsLang === 'ta' ? 'தடுப்பு குறிப்புகள்' : 'Prevention'}</h2>
                <SpeakBtn id="prevention" text={`${ttsLang === 'ta' ? 'தடுப்பு குறிப்புகள்' : 'Prevention'}. ${disease.prevention.join('. ')}`} />
              </div>
              <ul className="space-y-2.5">
                {disease.prevention.map((p, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />{p}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/scanner"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-95 transition-all">
            <Camera className="w-4 h-4" />
            {isTamil ? 'மீண்டும் ஸ்கேன் செய்' : 'Scan Another Plant'}
          </Link>
          <Link to="/pest-finder"
            className="inline-flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 font-bold px-8 py-3.5 rounded-2xl border-2 border-gray-200 hover:-translate-y-0.5 active:scale-95 transition-all shadow-sm">
            <Sparkles className="w-4 h-4 text-amber-500" />
            {isTamil ? 'பூச்சி கண்டுபிடி' : 'Check for Pests'}
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="mt-6 flex items-start gap-2.5 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 leading-relaxed">
            <span className="font-bold">Disclaimer: </span>
            {isTamil
              ? 'Leonux AI கணிப்புகள் AI மூலம் உருவாக்கப்பட்டவை மற்றும் 100% துல்லியமாக இருக்காது. தொழில்முறை விவசாய நிபுணர் அல்லது வேளாண் அதிகாரியிடம் ஆலோசனை பெறுவது பரிந்துரைக்கப்படுகிறது.'
              : 'Leonux AI predictions are AI-generated and may not be 100% accurate. Always consult a professional agronomist or agricultural officer before applying treatments.'}
          </p>
        </div>
      </div>
    </div>
  )
}
