import { useState, useRef, useCallback, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, Camera, X, Loader2, Leaf, AlertCircle,
  ScanLine, CheckCircle, RefreshCw, Microscope, Sparkles, ImagePlus, Zap
} from 'lucide-react'
import axios from 'axios'
import { useLang } from '../context/LangContext'

const API_BASE = import.meta.env.VITE_API_URL || ''
type Mode = 'idle' | 'camera' | 'preview'

export default function Scanner() {
  const { isTamil } = useLang()
  const t = (en: string, ta: string) => isTamil ? ta : en
  const [mode, setMode] = useState<Mode>('idle')
  const [dragOver, setDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [error, setError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const [liveMode, setLiveMode] = useState(false)
  const [liveResult, setLiveResult] = useState<{name: string, isHealthy: boolean, severity: string} | null>(null)
  const [liveLoading, setLiveLoading] = useState(false)
  const liveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [torchOn, setTorchOn] = useState(false)
  const [torchSupported, setTorchSupported] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const navigate = useNavigate()

  const loadingSteps = [
    t('Connecting to AI server...', 'AI சர்வருடன் இணைக்கிறது...'),
    t('Reading plant image...', 'தாவர படத்தை படிக்கிறது...'),
    t('Detecting disease patterns...', 'நோய் வடிவங்களை கண்டறிகிறது...'),
    t('Generating diagnosis report...', 'நோயறிதல் அறிக்கை உருவாக்குகிறது...'),
  ]

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    if (loading) {
      interval = setInterval(() => {
        setLoadingStep(s => (s + 1) % loadingSteps.length)
      }, 3000)
    } else {
      setLoadingStep(0)
    }
    return () => clearInterval(interval)
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
        const res = await axios.post(`${API_BASE}/api/scan`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 15000
        })
        const d = res.data
        setLiveResult({
          name: d.disease?.name || 'Unknown',
          isHealthy: d.isHealthy,
          severity: d.disease?.severity || 'Low'
        })
      } catch {
        // silently fail live scan errors
      } finally {
        setLiveLoading(false)
      }
    }, 'image/jpeg', 0.75)
  }, [liveLoading, isTamil])

  useEffect(() => {
    if (liveMode && mode === 'camera') {
      liveIntervalRef.current = setInterval(captureFrameAndAnalyze, 4000)
    } else {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
      liveIntervalRef.current = null
      setLiveResult(null)
    }
    return () => {
      if (liveIntervalRef.current) clearInterval(liveIntervalRef.current)
    }
  }, [liveMode, mode, captureFrameAndAnalyze])

  const handleFile = (file: File) => {
    setFileName(file.name)
    setImageFile(file)
    setError('')
    const reader = new FileReader()
    reader.onload = (e) => { setPreview(e.target?.result as string); setMode('preview') }
    reader.readAsDataURL(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }, [])

  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const item = Array.from(e.clipboardData?.items || []).find(i => i.type.startsWith('image/'))
      if (item) { const f = item.getAsFile(); if (f) handleFile(f) }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  }, [])

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream; setMode('camera'); setCameraReady(false)
      // Check torch support
      const track = stream.getVideoTracks()[0]
      const caps = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }
      setTorchSupported(!!caps.torch)
      setTorchOn(false)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setCameraReady(true)
        }
      }, 100)
    } catch { setError(t('Camera access denied. Please use file upload.', 'கேமரா அணுகல் மறுக்கப்பட்டது.')) }
  }

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0]
    if (!track) return
    const newState = !torchOn
    try {
      await track.applyConstraints({ advanced: [{ torch: newState } as MediaTrackConstraintSet] })
      setTorchOn(newState)
    } catch { /* torch not supported on this device */ }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280; canvas.height = video.videoHeight || 720
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    setPreview(canvas.toDataURL('image/jpeg', 0.92))
    setFileName('camera-capture.jpg')
    canvas.toBlob(blob => {
      if (blob) setImageFile(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
    stopCamera(); setMode('preview')
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null; setCameraReady(false); setTorchOn(false); setTorchSupported(false)
  }

  const reset = () => {
    stopCamera(); setPreview(null); setImageFile(null)
    setFileName(''); setMode('idle'); setError('')
    setLiveMode(false); setLiveResult(null)
  }

  const analyze = async () => {
    if (!imageFile) return
    setLoading(true); setError('')
    try {
      try { await axios.get(`${API_BASE}/api/health`, { timeout: 10000 }) } catch {}
      const formData = new FormData()
      formData.append('image', imageFile, imageFile.name)
      formData.append('lang', isTamil ? 'ta' : 'en')
      const response = await axios.post(`${API_BASE}/api/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }, timeout: 90000
      })
      navigate(`/results/${response.data.id}`, { state: response.data })
    } catch (err: unknown) {
      let msg = t('Analysis failed. Please try again.', 'பகுப்பாய்வு தோல்வி. மீண்டும் முயற்சிக்கவும்.')
      if (axios.isAxiosError(err)) {
        if (!err.response) msg = t('Server is waking up — please wait 30 seconds and try again.', 'சர்வர் விழிப்படைகிறது — 30 வினாடி காத்திருந்து மீண்டும் முயற்சிக்கவும்.')
        else msg = err.response.data?.error || msg
      }
      setError(msg)
    } finally { setLoading(false) }
  }

  const tips = [
    t('Good lighting — natural light works best', 'நல்ல வெளிச்சம் — இயற்கை ஒளி சிறந்தது'),
    t('Focus on the most affected leaf or area', 'மிகவும் பாதிக்கப்பட்ட இலையில் கவனம்'),
    t('Hold steady — avoid blurry images', 'நிலையாக பிடிக்கவும் — மங்கலான படங்களை தவிர்க்கவும்'),
    t('Include the full leaf in the frame', 'முழு இலையும் சட்டத்தில் சேர்க்கவும்'),
    t('All formats supported: JPG, PNG, WEBP', 'அனைத்து வடிவங்கள்: JPG, PNG, WEBP'),
  ]

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero */}
      <div className="relative h-48 sm:h-56 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1400&q=80"
          alt="Plant scanning" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/85 via-emerald-900/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-gray-50" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-10">
          <div className="animate-fade-up">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-semibold mb-2 uppercase tracking-widest">
              <Microscope className="w-3.5 h-3.5" />
              {t('AI-Powered Plant Analysis', 'AI-இயக்கப்படும் தாவர பகுப்பாய்வு')}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-lg">
              {t('Plant Disease Scanner', 'தாவர நோய் ஸ்கேனர்')}
            </h1>
            <p className="text-emerald-100 mt-1.5 text-sm font-medium">
              {t('Upload any plant photo for instant AI diagnosis', 'உடனடி AI நோயறிதலுக்கு எந்த தாவர படத்தையும் பதிவேற்றவும்')}
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-6">

          {/* Main panel */}
          <div className="lg:col-span-2 space-y-4">

            {/* Error */}
            {error && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3.5 rounded-2xl animate-fade-up">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed">{error}</p>
              </div>
            )}

            {/* IDLE — upload zone */}
            {mode === 'idle' && (
              <div className="space-y-3 animate-fade-up">
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onClick={() => fileRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-3xl p-12 sm:p-16 text-center cursor-pointer transition-all duration-200 group overflow-hidden select-none ${
                    dragOver
                      ? 'border-emerald-500 bg-emerald-50/80 scale-[1.01] drop-zone-active'
                      : 'border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/40'
                  }`}>
                  {/* BG decoration */}
                  <Leaf className="absolute -bottom-8 -right-8 w-40 h-40 text-emerald-100 group-hover:text-emerald-200 transition-colors rotate-12" />
                  <div className="relative z-10">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-200 ${
                      dragOver ? 'bg-emerald-500 scale-110' : 'bg-emerald-100 group-hover:bg-emerald-200'
                    }`}>
                      <ImagePlus className={`w-8 h-8 transition-colors ${dragOver ? 'text-white' : 'text-emerald-600'}`} />
                    </div>
                    <p className="text-base font-bold text-gray-800 mb-1">
                      {dragOver
                        ? t('Release to upload!', 'பதிவேற்ற விடுங்கள்!')
                        : t('Drop your plant image here', 'தாவர படத்தை இங்கே போடுங்கள்')}
                    </p>
                    <p className="text-sm text-gray-400">
                      {t('or click to browse files', 'அல்லது கோப்புகளை உலாவ கிளிக் செய்யுங்கள்')}
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                      {['JPG', 'PNG', 'WEBP', 'GIF', 'BMP', 'HEIC'].map(f => (
                        <span key={f} className="text-[10px] font-bold bg-gray-100 text-gray-400 px-2 py-0.5 rounded-md">{f}</span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-300 mt-2">{t('Ctrl+V to paste from clipboard', 'கிளிப்போர்டிலிருந்து Ctrl+V ஒட்டவும்')}</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </div>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-xs text-gray-400 font-medium">{t('or use your camera', 'அல்லது கேமரா பயன்படுத்துங்கள்')}</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                <button onClick={startCamera}
                  className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl transition-all shadow-lg hover:-translate-y-0.5 active:scale-95">
                  <Camera className="w-5 h-5" />
                  {t('Open Camera', 'கேமரா திறக்கவும்')}
                </button>
              </div>
            )}

            {/* CAMERA */}
            {mode === 'camera' && (
              <div className="space-y-4 animate-fade-up">
                <div className="relative rounded-3xl overflow-hidden bg-black shadow-2xl" style={{height: '70vh', minHeight: '380px', maxHeight: '600px'}}>
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                  {/* Corner guides */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-3/4 h-3/4">
                      {['top-0 left-0 border-t-2 border-l-2 rounded-tl-xl',
                        'top-0 right-0 border-t-2 border-r-2 rounded-tr-xl',
                        'bottom-0 left-0 border-b-2 border-l-2 rounded-bl-xl',
                        'bottom-0 right-0 border-b-2 border-r-2 rounded-br-xl'
                      ].map((cls, i) => (
                        <div key={i} className={`absolute w-8 h-8 border-emerald-400 ${cls}`} />
                      ))}
                    </div>
                  </div>
                  {/* Status dot */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-1.5">
                    <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                    <span className="text-white text-xs font-medium">
                      {cameraReady ? t('Ready', 'தயார்') : t('Starting...', 'தொடங்குகிறது...')}
                    </span>
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
                      className={`absolute top-12 right-3 p-2.5 rounded-full text-xs font-bold backdrop-blur-sm transition-all shadow-lg ${
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
                          liveResult.isHealthy ? 'bg-emerald-600/80' :
                          liveResult.severity === 'High' ? 'bg-red-600/80' :
                          liveResult.severity === 'Medium' ? 'bg-amber-600/80' : 'bg-blue-600/80'
                        }`}>
                          {liveLoading && <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />}
                          <span className="font-bold truncate">{liveResult.name}</span>
                          {!liveResult.isHealthy && (
                            <span className="ml-auto flex-shrink-0 bg-white/20 px-1.5 py-0.5 rounded-full">{liveResult.severity}</span>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-center text-sm text-gray-500">
                  {t('Position the affected plant part inside the frame', 'பாதிக்கப்பட்ட தாவர பகுதியை சட்டத்தினுள் வைக்கவும்')}
                </p>
                <div className="flex gap-3">
                  <button onClick={reset} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                    <X className="w-4 h-4" />{t('Cancel', 'ரத்து செய்')}
                  </button>
                  <button onClick={capturePhoto} disabled={!cameraReady}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none">
                    <Camera className="w-4 h-4" />{t('Capture', 'படம் எடு')}
                  </button>
                </div>
              </div>
            )}

            {/* PREVIEW */}
            {mode === 'preview' && preview && (
              <div className="space-y-4 animate-fade-up">
                {/* Image preview */}
                <div className="relative rounded-3xl overflow-hidden bg-gray-900 shadow-2xl">
                  <img src={preview} alt="Plant preview"
                    className="w-full max-h-[420px] object-contain" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent pointer-events-none" />
                  <button onClick={reset}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-lg transition-all hover:scale-110">
                    <X className="w-4 h-4 text-gray-700" />
                  </button>
                  <button onClick={() => { setPreview(null); setImageFile(null); setMode('idle') }}
                    className="absolute bottom-3 right-3 bg-white/90 hover:bg-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1.5 text-xs font-bold text-gray-700 transition-all hover:scale-105">
                    <RefreshCw className="w-3 h-3" />{t('Retake', 'மீண்டும் எடு')}
                  </button>
                </div>

                {/* File info */}
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 rounded-2xl px-4 py-3">
                  <div className="bg-emerald-500 p-2 rounded-xl flex-shrink-0">
                    <Leaf className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">
                      {t('Selected image', 'தேர்ந்தெடுக்கப்பட்ட படம்')}
                    </p>
                    <p className="font-semibold text-gray-900 text-sm truncate">{fileName}</p>
                  </div>
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                </div>

                {/* Feature badge */}
                <div className="flex items-start gap-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl px-4 py-3">
                  <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">{t('Advanced Plant Analysis', 'மேம்பட்ட தாவர பகுப்பாய்வு')}</p>
                    <p className="text-xs text-emerald-600 mt-0.5 leading-relaxed">
                      {t('Detects disease, severity, symptoms, treatments & medicine dosages in seconds.',
                        'விநாடிகளில் நோய், தீவிரம், அறிகுறிகள், சிகிச்சைகள் & மருந்து அளவுகளை கண்டறிகிறது.')}
                    </p>
                  </div>
                </div>

                {/* Analyze button */}
                <button onClick={analyze} disabled={loading}
                  className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold py-4 rounded-2xl transition-all shadow-xl shadow-emerald-500/30 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-base">
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" />
                      <span className="truncate">{loadingSteps[loadingStep]}</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-5 h-5" />
                      {t('Analyze with Leonux AI', 'Leonux AI மூலம் பகுப்பாய்வு செய்')}
                    </>
                  )}
                </button>

                {loading && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse" style={{ width: `${25 + loadingStep * 25}%`, transition: 'width 2s ease' }} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Tips card */}
            <div className="card border-emerald-100 animate-fade-up-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 text-sm">{t('Scanning Tips', 'ஸ்கேனிங் குறிப்புகள்')}</h3>
              </div>
              <ul className="space-y-3">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-bold text-[10px] flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>



          </div>
        </div>
      </div>
    </div>
  )
}
