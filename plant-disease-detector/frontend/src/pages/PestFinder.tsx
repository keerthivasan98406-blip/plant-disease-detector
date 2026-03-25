import { useRef, useState, useCallback } from 'react'
import { Bug, Camera, X, Loader2, AlertCircle, ScanLine, RefreshCw, Volume2, VolumeX } from 'lucide-react'
import axios from 'axios'
import { useLang } from '../context/LangContext'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface PestResult {
  pest: string
  plant: string
  description: string
  severity: string
  damage: string[]
  control: string[]
  organic: string[]
  chemicals: { name: string; dosage: string }[]
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

export default function PestFinder() {
  const { isTamil } = useLang()
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PestResult | null>(null)
  const [taResult, setTaResult] = useState<PestResult | null>(null)
  const [translating, setTranslating] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const t = (en: string, ta: string) => isTamil ? ta : en

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      setCameraOn(true)
      setCameraReady(false)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setCameraReady(true)
        }
      }, 100)
    } catch {
      setError(t('Camera access denied.', 'கேமரா அணுகல் மறுக்கப்பட்டது.'))
    }
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraOn(false)
    setCameraReady(false)
  }

  const capture = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setPreview(dataUrl)
    canvas.toBlob(blob => {
      if (blob) setImageFile(new File([blob], 'pest-capture.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
    stopCamera()
  }

  const handleFile = (file: File) => {
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = e => setPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const reset = () => {
    stopCamera()
    setPreview(null)
    setImageFile(null)
    setResult(null)
    setTaResult(null)
    setError('')
  }

  const analyze = async () => {
    if (!imageFile) return
    setLoading(true)
    setError('')
    setResult(null)
    try {
      await axios.get(`${API_BASE}/api/health`, { timeout: 10000 }).catch(() => {})
      const formData = new FormData()
      formData.append('image', imageFile, imageFile.name)
      formData.append('mode', 'pest')
      const res = await axios.post(`${API_BASE}/api/pest`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000
      })
      setResult(res.data)
      if (isTamil) translateResult(res.data)
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.error || t('Analysis failed. Try again.', 'பகுப்பாய்வு தோல்வியடைந்தது.')
        : t('Analysis failed.', 'பகுப்பாய்வு தோல்வியடைந்தது.')
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const translateResult = useCallback(async (r: PestResult) => {
    setTranslating(true)
    try {
      const [pest, plant, description, damage, control, organic, chemicals] = await Promise.all([
        translateText(r.pest),
        translateText(r.plant),
        translateText(r.description),
        Promise.all(r.damage.map(d => translateText(d))),
        Promise.all(r.control.map(c => translateText(c))),
        Promise.all(r.organic.map(o => translateText(o))),
        Promise.all(r.chemicals.map(async c => ({
          name: await translateText(c.name),
          dosage: await translateText(c.dosage)
        })))
      ])
      setTaResult({ ...r, pest, plant, description, damage, control, organic, chemicals })
    } finally {
      setTranslating(false)
    }
  }, [])

  const display = (isTamil && taResult) ? taResult : result

  const speakResult = () => {
    if (!display) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const text = `${display.pest}. ${display.description}. ${t('Damage', 'சேதம்')}: ${display.damage.join('. ')}. ${t('Control', 'கட்டுப்பாடு')}: ${display.control.join('. ')}`
    if (isTamil) {
      const chunks = text.match(/.{1,180}/g) || [text]
      let i = 0
      setSpeaking(true)
      const playNext = () => {
        if (i >= chunks.length) { setSpeaking(false); return }
        const audio = new Audio(`https://translate.google.com/translate_tts?ie=UTF-8&tl=ta&client=tw-ob&q=${encodeURIComponent(chunks[i])}`)
        audio.onended = () => { i++; playNext() }
        audio.onerror = () => setSpeaking(false)
        audio.play().catch(() => setSpeaking(false))
        i++
      }
      playNext()
    } else {
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = 'en-US'; utter.rate = 0.9
      utter.onend = () => setSpeaking(false)
      setSpeaking(true)
      window.speechSynthesis.speak(utter)
    }
  }

  const severityColor: Record<string, string> = {
    High: 'text-red-600 bg-red-50 border-red-200',
    Medium: 'text-amber-600 bg-amber-50 border-amber-200',
    Low: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  }

  return (
    <div>
      {/* Hero */}
      <div className="relative h-52 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&q=80" alt="Pest" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/80 via-red-800/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-12">
          <div>
            <div className="flex items-center gap-2 text-red-300 text-sm font-medium mb-2">
              <Bug className="w-4 h-4" />
              {t('AI Pest Detection', 'AI பூச்சி கண்டுபிடிப்பு')}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">
              {t('Real-Time Pest Finder', 'நேரடி பூச்சி கண்டுபிடிப்பு')}
            </h1>
            <p className="text-red-100 mt-1 text-sm">
              {t('Capture or upload a plant image to identify pests instantly', 'பூச்சிகளை உடனடியாக அடையாளம் காண படம் எடுக்கவும்')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left panel */}
          <div className="lg:col-span-2 space-y-5">
            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Camera / Upload */}
            {!preview && !cameraOn && (
              <div className="space-y-4">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="border-2 border-dashed border-red-300 rounded-3xl p-14 text-center cursor-pointer hover:border-red-500 hover:bg-red-50/50 transition-all"
                >
                  <div className="bg-red-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Bug className="w-8 h-8 text-red-600" />
                  </div>
                  <p className="text-lg font-bold text-gray-800 mb-1">{t('Drop plant image here', 'தாவர படத்தை இங்கே போடுங்கள்')}</p>
                  <p className="text-sm text-gray-400">{t('or click to browse', 'அல்லது கிளிக் செய்யுங்கள்')}</p>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400">{t('or use camera', 'அல்லது கேமரா பயன்படுத்துங்கள்')}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>
                <button onClick={startCamera} className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl transition-colors">
                  <Camera className="w-5 h-5" />
                  {t('Open Camera', 'கேமரா திறக்கவும்')}
                </button>
              </div>
            )}

            {/* Camera view */}
            {cameraOn && (
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-xl">
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-2/3 h-2/3">
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-red-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-red-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-red-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-red-400 rounded-br-lg" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-red-400 animate-pulse' : 'bg-yellow-400'}`} />
                    <span className="text-white text-xs">{cameraReady ? t('Camera Ready', 'கேமரா தயார்') : t('Starting...', 'தொடங்குகிறது...')}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={stopCamera} className="flex-1 btn-secondary flex items-center justify-center gap-2"><X className="w-4 h-4" />{t('Cancel', 'ரத்து செய்')}</button>
                  <button onClick={capture} disabled={!cameraReady} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50">
                    <Camera className="w-4 h-4" />{t('Capture', 'படம் எடு')}
                  </button>
                </div>
              </div>
            )}

            {/* Preview */}
            {preview && !cameraOn && (
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden bg-gray-100 aspect-video shadow-xl">
                  <img src={preview} alt="pest preview" className="w-full h-full object-contain" />
                  <button onClick={reset} className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-md">
                    <X className="w-4 h-4 text-gray-700" />
                  </button>
                  <button onClick={() => { setPreview(null); setImageFile(null) }} className="absolute bottom-3 right-3 bg-white/90 hover:bg-white px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5 text-xs font-semibold text-gray-700">
                    <RefreshCw className="w-3 h-3" />{t('Retake', 'மீண்டும் எடு')}
                  </button>
                </div>
                <button onClick={analyze} disabled={loading} className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-base disabled:opacity-70">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin" />{t('Analyzing...', 'பகுப்பாய்வு செய்கிறது...')}</> : <><ScanLine className="w-5 h-5" />{t('Find Pests with AI', 'AI மூலம் பூச்சிகளை கண்டுபிடி')}</>}
                </button>
                {loading && <p className="text-center text-xs text-gray-400">{t('This may take 30–60 seconds', '30–60 வினாடிகள் ஆகலாம்')}</p>}
              </div>
            )}

            {/* Result */}
            {display && (
              <div className="space-y-5 mt-2">
                {/* Header */}
                <div className="card border-l-4 border-l-red-500">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{t('Detected Pest', 'கண்டறியப்பட்ட பூச்சி')}</p>
                      <h2 className="text-2xl font-extrabold text-gray-900">{display.pest}</h2>
                      <p className="text-red-600 font-semibold text-sm mt-1">{display.plant}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${severityColor[display.severity] || severityColor.Medium}`}>
                        {t(display.severity, display.severity === 'High' ? 'அதிகம்' : display.severity === 'Medium' ? 'நடுத்தரம்' : 'குறைவு')}
                      </span>
                      <button onClick={speakResult} className={`p-2 rounded-xl transition-colors ${speaking ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-600 hover:bg-red-50'}`}>
                        {speaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">{display.description}</p>
                  {translating && <p className="text-xs text-amber-600 mt-2 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />தமிழில் மொழிபெயர்க்கிறது...</p>}
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  {/* Damage */}
                  <div className="card border-t-4 border-t-red-400">
                    <h3 className="font-bold text-gray-900 mb-3">{t('Damage Signs', 'சேத அறிகுறிகள்')}</h3>
                    <ul className="space-y-2">
                      {display.damage.map((d, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-red-500 mt-0.5">•</span>{d}</li>)}
                    </ul>
                  </div>
                  {/* Control */}
                  <div className="card border-t-4 border-t-amber-400">
                    <h3 className="font-bold text-gray-900 mb-3">{t('Control Methods', 'கட்டுப்பாட்டு முறைகள்')}</h3>
                    <ol className="space-y-2">
                      {display.control.map((c, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="bg-amber-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i+1}</span>{c}</li>)}
                    </ol>
                  </div>
                  {/* Organic */}
                  <div className="card border-t-4 border-t-green-400">
                    <h3 className="font-bold text-gray-900 mb-3">{t('Organic Remedies', 'இயற்கை தீர்வுகள்')}</h3>
                    <ul className="space-y-2">
                      {display.organic.map((o, i) => <li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-green-500 mt-0.5">✓</span>{o}</li>)}
                    </ul>
                  </div>
                  {/* Chemicals */}
                  <div className="card border-t-4 border-t-blue-400">
                    <h3 className="font-bold text-gray-900 mb-3">{t('Chemical Controls', 'இரசாயன கட்டுப்பாடு')}</h3>
                    <div className="space-y-2">
                      {display.chemicals.map((c, i) => (
                        <div key={i} className="bg-blue-50 rounded-xl p-3">
                          <p className="font-bold text-sm text-gray-900">{c.name}</p>
                          <p className="text-xs text-gray-500 mt-1">{t('Dosage', 'அளவு')}: {c.dosage}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={reset} className="w-full btn-secondary flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4" />{t('Scan Another', 'மீண்டும் ஸ்கேன் செய்')}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <div className="card border-emerald-100">
              <div className="flex items-center gap-2 mb-4">
                <Bug className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-gray-900">{t('How to use', 'எப்படி பயன்படுத்துவது')}</h3>
              </div>
              <ul className="space-y-3">
                {[
                  [t('Take a clear photo of the affected plant', 'பாதிக்கப்பட்ட தாவரத்தின் தெளிவான படம் எடுக்கவும்'), '1'],
                  [t('Focus on leaves, stems or visible pests', 'இலைகள், தண்டுகள் அல்லது பூச்சிகளில் கவனம் செலுத்துங்கள்'), '2'],
                  [t('Upload or capture the image', 'படத்தை பதிவேற்றவும் அல்லது எடுக்கவும்'), '3'],
                  [t('AI will identify the pest instantly', 'AI உடனடியாக பூச்சியை அடையாளம் காணும்'), '4'],
                ].map(([tip, num]) => (
                  <li key={num} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="bg-red-100 text-red-700 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{num}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="card bg-gradient-to-br from-red-600 to-red-800 text-white border-0">
              <Bug className="w-8 h-8 mb-3 opacity-80" />
              <h3 className="font-bold mb-2">{t('AI Pest Intelligence', 'AI பூச்சி நுண்ணறிவு')}</h3>
              <p className="text-red-100 text-xs leading-relaxed">
                {t('Identifies 100+ crop pests including insects, mites, and larvae with treatment recommendations.', '100+ பயிர் பூச்சிகளை அடையாளம் காணும் — பூச்சிகள், பூச்சிகள் மற்றும் லார்வாக்கள் உட்பட.')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
