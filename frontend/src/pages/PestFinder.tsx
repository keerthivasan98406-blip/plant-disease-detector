import { useRef, useState, useCallback, useEffect } from 'react'
import { Bug, Camera, X, Loader2, AlertCircle, ScanLine, RefreshCw, Volume2, VolumeX, Upload, Sparkles, ShieldCheck, Zap } from 'lucide-react'
import axios from 'axios'
import { useLang } from '../context/LangContext'

const API_BASE = import.meta.env.VITE_API_URL || ''

interface PestResult {
  pest: string; scientificName?: string
  description: string; severity: string
  damage: string[]; control: string[]; organic: string[]
  chemicals: { name: string; dosage: string }[]
}

const sevColor: Record<string, string> = {
  High:   'text-red-700 bg-red-50 border-red-200',
  Medium: 'text-amber-700 bg-amber-50 border-amber-200',
  Low:    'text-emerald-700 bg-emerald-50 border-emerald-200',
}

export default function PestFinder() {
  const { isTamil } = useLang()
  const t = (en: string, ta: string) => isTamil ? ta : en
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const [cameraOn, setCameraOn] = useState(false)
  const [cameraReady, setCameraReady] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<PestResult | null>(null)
  const [taResult, setTaResult] = useState<PestResult | null>(null)
  const [translating, setTranslating] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const [liveMode, setLiveMode] = useState(false)
  const [liveResult, setLiveResult] = useState<{pest: string, severity: string} | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)

  const loadingSteps = [
    t('Scanning for insects...', 'பூச்சிகளை ஸ்கேன் செய்கிறது...'),
    t('Analyzing pest damage...', 'பூச்சி சேதத்தை பகுப்பாய்கிறது...'),
    t('Identifying species...', 'இனத்தை அடையாளம் காண்கிறது...'),
    t('Generating treatment plan...', 'சிகிச்சை திட்டம் உருவாக்குகிறது...'),
  ]

  useEffect(() => {
    let iv: ReturnType<typeof setInterval>
    if (loading) iv = setInterval(() => setLoadingStep(s => (s + 1) % loadingSteps.length), 3000)
    else setLoadingStep(0)
    return () => clearInterval(iv)
  }, [loading])

  const captureFrameAndAnalyze = useCallback(async () => {
    if (!videoRef.current || liveLoading) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(async (blob) => {
      if (!blob) return
      setLiveLoading(true)
      try {
        const fd = new FormData()
        fd.append('image', new File([blob], 'live.jpg', { type: 'image/jpeg' }), 'live.jpg')
        fd.append('lang', 'en')
        const res = await axios.post(`${API_BASE}/api/pest`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000
        })
        setLiveResult({ pest: res.data.pest, severity: res.data.severity })
      } catch {
        // silently fail
      } finally {
        setLiveLoading(false)
      }
    }, 'image/jpeg', 0.75)
  }, [liveLoading])

  useEffect(() => {
    if (liveMode && cameraOn) {
      liveIntervalRef.current = setInterval(captureFrameAndAnalyze, 4000)
    } else {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
      liveIntervalRef.current = null
      setLiveResult(null)
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
    }
  }, [liveMode, cameraOn, captureFrameAndAnalyze])

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
      streamRef.current = stream; setCameraOn(true); setCameraReady(false)
      const track = stream.getVideoTracks()[0]
      const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
      setTorchSupported(!!caps.torch)
      setTorchOn(false)
      setTimeout(() => { if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.onloadedmetadata = () => setCameraReady(true) } }, 100)
    } catch { setError(t('Camera access denied.', 'கேமரா அணுகல் மறுக்கப்பட்டது.')) }
  }

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const newState = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: newState } as MediaTrackConstraintSet] })
      setTorchOn(newState)
    } catch { /* torch not supported */ }
  }

  const stopCamera = () => { streamRef.current?.getTracks().forEach(t => t.stop()); streamRef.current = null; setCameraOn(false); setCameraReady(false); setTorchOn(false); setTorchSupported(false) }
  const capture = () => {
    if (!videoRef.current) return
    const v = videoRef.current; const c = document.createElement('canvas')
    c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720
    c.getContext('2d')?.drawImage(v, 0, 0); setPreview(c.toDataURL('image/jpeg', 0.92))
    c.toBlob(b => { if (b) setImageFile(new File([b], 'pest.jpg', { type: 'image/jpeg' })) }, 'image/jpeg', 0.92)
    stopCamera()
  }
  const handleFile = (file: File) => {
    setImageFile(file); setError('')
    const r = new FileReader(); r.onload = e => setPreview(e.target?.result as string); r.readAsDataURL(file)
  }
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => { const item = Array.from(e.clipboardData?.items||[]).find(i=>i.type.startsWith('image/')); if(item){ const f=item.getAsFile(); if(f) handleFile(f) } }
    window.addEventListener('paste', onPaste); return () => window.removeEventListener('paste', onPaste)
  }, [])
  const reset = () => { stopCamera(); setPreview(null); setImageFile(null); setResult(null); setTaResult(null); setError(''); setLiveMode(false); setLiveResult(null); setTorchOn(false); setTorchSupported(false) }

  const analyze = async () => {
    if (!imageFile) return
    setLoading(true); setError(''); setResult(null); setTaResult(null)
    try {
      await axios.get(`${API_BASE}/api/health`, { timeout: 10000 }).catch(()=>{})
      const fd = new FormData(); fd.append('image', imageFile, imageFile.name); fd.append('lang', isTamil ? 'ta' : 'en')
      const res = await axios.post(`${API_BASE}/api/pest`, fd, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000 })
      setResult(res.data)
      if (isTamil) setTaResult(res.data)
    } catch (err) {
      setError(axios.isAxiosError(err) ? err.response?.data?.error || t('Analysis failed.','பகுப்பாய்வு தோல்வி.') : t('Analysis failed.','பகுப்பாய்வு தோல்வி.'))
    } finally { setLoading(false) }
  }

  const translateResult = useCallback(async (r: PestResult) => {
    setTranslating(true)
    try {
      const res = await fetch(`${API_BASE}/api/translate-batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: { pest:r.pest, description:r.description, damage:r.damage, control:r.control, organic:r.organic, chemicals:r.chemicals }, targetLang:'ta' }) })
      setTaResult({ ...r, ...(await res.json()) })
    } catch { setTaResult(r) } finally { setTranslating(false) }
  }, [])

  useEffect(() => { if (isTamil && result && !taResult && !translating) translateResult(result) }, [isTamil, result, taResult, translating, translateResult])

  const display = isTamil ? taResult : result

  const speakResult = () => {
    if (!display) return
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return }
    const text = `${display.pest}. ${display.description}. ${display.damage.join('. ')}`
    const u = new SpeechSynthesisUtterance(text); u.lang = isTamil ? 'ta-IN' : 'en-US'; u.rate = 0.9
    u.onend = () => setSpeaking(false); setSpeaking(true); window.speechSynthesis.speak(u)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1400&q=80" alt="Pest" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-red-950/85 via-red-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-10">
          <div className="animate-fade-up">
            <div className="flex items-center gap-2 text-red-300 text-xs font-semibold mb-2 uppercase tracking-widest">
              <Bug className="w-3.5 h-3.5" />{t('AI Pest Detection','AI பூச்சி கண்டுபிடிப்பு')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">
              {t('Pest Finder','பூச்சி கண்டுபிடிப்பு')}
            </h1>
            <p className="text-red-100 mt-1.5 text-sm font-medium">
              {t('Identify insects & pests from any photo','எந்த படத்திலிருந்தும் பூச்சிகளை அடையாளம் காண்க')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl animate-fade-up">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><p className="text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* Upload zone */}
            {!preview && !cameraOn && (
              <div className="space-y-3 animate-fade-up">
                <div onClick={() => fileRef.current?.click()}
                  onDrop={e => { e.preventDefault(); setDragOver(false); const f=e.dataTransfer.files?.[0]; if(f&&f.type.startsWith('image/')) handleFile(f) }}
                  onDragOver={e => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  className={`relative border-2 border-dashed rounded-3xl p-12 sm:p-16 text-center cursor-pointer transition-all duration-200 overflow-hidden group select-none ${dragOver ? 'border-red-500 bg-red-50/80 scale-[1.01] drop-zone-active' : 'border-gray-200 hover:border-red-400 hover:bg-red-50/30'}`}>
                  <Bug className="absolute -bottom-8 -right-8 w-40 h-40 text-red-50 group-hover:text-red-100 transition-colors" />
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all ${dragOver ? 'bg-red-500 scale-110' : 'bg-red-100 group-hover:bg-red-200'}`}>
                      <Upload className={`w-8 h-8 transition-colors ${dragOver ? 'text-white' : 'text-red-600'}`} />
                    </div>
                    <p className="text-base font-bold text-gray-800 mb-1">{t('Drop insect or pest image here','பூச்சி அல்லது பூச்சி படத்தை இங்கே போடுங்கள்')}</p>
                    <p className="text-sm text-gray-400">{t('or click to browse — all formats supported','அல்லது கிளிக் செய்யுங்கள் — அனைத்து வடிவங்கள்')}</p>
                    <p className="text-xs text-gray-300 mt-2">{t('Ctrl+V to paste from clipboard','Ctrl+V ஒட்டவும்')}</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { const f=e.target.files?.[0]; if(f) handleFile(f) }} />
                </div>
                <div className="flex items-center gap-3"><div className="flex-1 h-px bg-gray-200" /><span className="text-xs text-gray-400">{t('or','அல்லது')}</span><div className="flex-1 h-px bg-gray-200" /></div>
                <button onClick={startCamera} className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 active:scale-95">
                  <Camera className="w-5 h-5" />{t('Open Camera','கேமரா திறக்கவும்')}
                </button>
              </div>
            )}

            {/* Camera */}
            {cameraOn && (
              <div className="space-y-4 animate-fade-up">
                <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl" style={{height: '70vh', minHeight: '380px', maxHeight: '600px'}}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-3/4 h-3/4">
                      {['top-0 left-0 border-t-2 border-l-2 rounded-tl-xl','top-0 right-0 border-t-2 border-r-2 rounded-tr-xl','bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl','bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl'].map((c,i)=>(
                        <div key={i} className={`absolute w-8 h-8 border-red-400 ${c}`} />
                      ))}
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-red-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-white text-xs">{cameraReady ? t('Ready','தயார்') : t('Starting...','தொடங்குகிறது...')}</span>
                  </div>
                  {/* Live scan toggle */}
                  <button
                    onClick={() => setLiveMode(l => !l)}
                    className={`absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm transition-all ${
                      liveMode
                        ? 'bg-red-500 text-white shadow-lg shadow-red-500/40'
                        : 'bg-black/50 text-white/80 hover:bg-black/70'
                    }`}
                  >
                    {liveMode && <span className="w-2 h-2 rounded-full bg-white animate-pulse" />}
                    {liveMode ? 'Live ON' : 'Live OFF'}
                  </button>
                  {/* Torch button */}
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`absolute top-12 right-3 p-2.5 rounded-full backdrop-blur-sm transition-all shadow-lg ${
                        torchOn
                          ? 'bg-yellow-400 text-gray-900 shadow-yellow-400/50'
                          : 'bg-black/50 text-white/80 hover:bg-black/70'
                      }`}
                      title={torchOn ? 'Turn off torch' : 'Turn on torch'}
                    >
                      <Zap className={`w-4 h-4 ${torchOn ? 'fill-gray-900' : ''}`} />
                    </button>
                  )}
                  {/* Live result overlay */}
                  {liveMode && (
                    <div className="absolute bottom-3 left-3 right-3">
                      {liveLoading && !liveResult && (
                        <div className="flex items-center gap-2 bg-black/60 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-xl">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Scanning...</span>
                        </div>
                      )}
                      {liveResult && (
                        <div className={`flex items-center gap-2 backdrop-blur-sm text-white text-xs px-3 py-2 rounded-xl ${
                          liveResult.severity === 'High' ? 'bg-red-600/80' :
                          liveResult.severity === 'Medium' ? 'bg-amber-600/80' : 'bg-emerald-600/80'
                        }`}>
                          {liveLoading && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
                          <span className="font-bold truncate">{liveResult.pest}</span>
                          <span className="ml-auto flex-shrink-0 bg-white/20 px-1.5 py-0.5 rounded-full">{liveResult.severity}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button onClick={stopCamera} className="flex-1 btn-secondary flex items-center justify-center gap-2"><X className="w-4 h-4"/>{t('Cancel','ரத்து')}</button>
                  <button onClick={capture} disabled={!cameraReady} className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:transform-none">
                    <Camera className="w-4 h-4"/>{t('Capture','படம் எடு')}
                  </button>
                </div>
              </div>
            )}

            {/* Preview */}
            {preview && !cameraOn && (
              <div className="space-y-4 animate-fade-up">
                <div className="relative rounded-3xl overflow-hidden bg-gray-900 shadow-2xl">
                  <img src={preview} alt="pest preview" className="w-full max-h-[400px] object-contain" />
                  <button onClick={reset} className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110"><X className="w-4 h-4 text-gray-700"/></button>
                  <button onClick={() => { setPreview(null); setImageFile(null) }} className="absolute bottom-3 right-3 bg-white/90 hover:bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold text-gray-700 transition-all hover:scale-105">
                    <RefreshCw className="w-3 h-3"/>{t('Retake','மீண்டும்')}
                  </button>
                </div>
                <button onClick={analyze} disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold py-4 rounded-2xl shadow-xl shadow-red-500/20 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none text-base">
                  {loading ? <><Loader2 className="w-5 h-5 animate-spin flex-shrink-0"/><span className="truncate">{loadingSteps[loadingStep]}</span></>
                    : <><ScanLine className="w-5 h-5"/>{t('Identify Pest with AI','AI மூலம் பூச்சியை அடையாளம் காண்')} </>}
                </button>
                {loading && <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden"><div className="h-full bg-gradient-to-r from-red-500 to-rose-500 rounded-full animate-pulse" style={{width:`${25+loadingStep*25}%`,transition:'width 2s ease'}}/></div>}
              </div>
            )}

            {/* Translating */}
            {isTamil && translating && result && !taResult && (
              <div className="flex flex-col items-center gap-3 py-12 animate-fade-up">
                <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-amber-500 animate-spin"/>
                </div>
                <p className="text-sm text-amber-600 font-bold">தமிழில் மொழிபெயர்க்கிறது...</p>
              </div>
            )}

            {/* Result */}
            {display && (
              <div className="space-y-4 animate-fade-up">
                <div className="card border-l-4 border-l-red-500 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="min-w-0">
                      <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold mb-1">{t('Detected Pest','கண்டறியப்பட்ட பூச்சி')}</p>
                      <h2 className="text-xl sm:text-2xl font-black text-gray-900">{display.pest}</h2>
                      {display.scientificName && <p className="text-xs text-gray-400 italic mt-0.5">{display.scientificName}</p>}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${sevColor[display.severity] || sevColor.Medium}`}>
                        {t(display.severity, display.severity==='High'?'அதிகம்':display.severity==='Medium'?'நடுத்தரம்':'குறைவு')}
                      </span>
                      <button onClick={speakResult} className={`p-2 rounded-xl transition-all hover:scale-110 ${speaking ? 'bg-red-100 text-red-600' : 'text-gray-300 hover:text-red-600 hover:bg-red-50'}`}>
                        {speaking ? <VolumeX className="w-4 h-4"/> : <Volume2 className="w-4 h-4"/>}
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 leading-relaxed">{display.description}</p>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="card border-t-4 border-t-red-400 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm">{t('Damage Signs','சேத அறிகுறிகள்')}</h3>
                    <ul className="space-y-2">{display.damage.map((d,i)=><li key={i} className="flex items-start gap-2 text-sm text-gray-600"><span className="text-red-400 mt-0.5 flex-shrink-0">●</span>{d}</li>)}</ul>
                  </div>
                  <div className="card border-t-4 border-t-amber-400 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm">{t('Control Methods','கட்டுப்பாட்டு முறைகள்')}</h3>
                    <ol className="space-y-2">{display.control.map((c,i)=><li key={i} className="flex items-start gap-2.5 text-sm text-gray-600"><span className="bg-gradient-to-br from-amber-500 to-orange-600 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">{i+1}</span>{c}</li>)}</ol>
                  </div>
                  <div className="card border-t-4 border-t-emerald-400 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm">{t('Organic Remedies','இயற்கை தீர்வுகள்')}</h3>
                    <ul className="space-y-2">{display.organic.map((o,i)=><li key={i} className="flex items-start gap-2 text-sm text-gray-600"><ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5"/>{o}</li>)}</ul>
                  </div>
                  <div className="card border-t-4 border-t-blue-400 hover:shadow-md transition-shadow">
                    <h3 className="font-bold text-gray-900 mb-3 text-sm">{t('Chemical Controls','இரசாயன கட்டுப்பாடு')}</h3>
                    <div className="space-y-2">{display.chemicals.map((c,i)=>(
                      <div key={i} className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                        <p className="font-bold text-sm text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-500 mt-1">💉 {t('Dosage','அளவு')}: <span className="font-semibold text-gray-700">{c.dosage}</span></p>
                      </div>
                    ))}</div>
                  </div>
                </div>

                <button onClick={reset} className="w-full btn-secondary flex items-center justify-center gap-2">
                  <RefreshCw className="w-4 h-4"/>{t('Scan Another','மீண்டும் ஸ்கேன் செய்')}
                </button>


              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card border-emerald-100 animate-fade-up-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-red-100 p-2 rounded-xl"><Bug className="w-4 h-4 text-red-600"/></div>
                <h3 className="font-bold text-gray-900 text-sm">{t('What to Upload','என்ன பதிவேற்றுவது')}</h3>
              </div>
              <ul className="space-y-3">
                {[t('Close-up of any insect or bug','எந்த பூச்சியின் க்ளோஸ் அப்'),
                  t('Caterpillar, worm or larva on plant','தாவரத்தில் கம்பளிப்பூச்சி'),
                  t('Leaf with chewed holes or webbing','கடித்த துளைகள் அல்லது வலை'),
                  t('Visible pest damage on stems/fruits','தண்டுகள்/பழங்களில் பூச்சி சேதம்'),
                  t('Any blurry pest photo is OK','மங்கலான பூச்சி படமும் சரி')
                ].map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-red-500 to-rose-600 text-white font-bold text-[10px] flex items-center justify-center mt-0.5">{i+1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-red-600 via-red-700 to-rose-800 p-5 text-white animate-fade-up-3">
              <div className="absolute top-0 right-0 w-28 h-28 bg-white/5 rounded-full -translate-x-6 -translate-y-6"/>
              <div className="relative">
                <div className="bg-white/20 w-10 h-10 rounded-xl flex items-center justify-center mb-3"><Sparkles className="w-5 h-5"/></div>
                <h3 className="font-bold text-sm mb-1.5">{t('Identifies 100+ Pests','100+ பூச்சிகளை அடையாளம் காணும்')}</h3>
                <p className="text-red-100 text-xs leading-relaxed">{t('Detects insects, mites, larvae & provides organic and chemical treatment recommendations.','பூச்சிகள், பூச்சிகள், லார்வாக்கள் கண்டறிந்து சிகிச்சை பரிந்துரைக்கிறது.')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
