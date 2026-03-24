import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Upload, Camera, X, Loader2, Leaf, AlertCircle,
  Sprout, ScanLine, CheckCircle, RefreshCw
} from 'lucide-react'
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

type Mode = 'idle' | 'camera' | 'preview'

const tips = [
  'Ensure good lighting when capturing the image',
  'Focus on the most affected leaf or stem',
  'Avoid blurry or dark images for best accuracy',
  'Include the full leaf clearly in the frame',
]

export default function Scanner() {
  const [mode, setMode] = useState<Mode>('idle')
  const [preview, setPreview] = useState<string | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [cameraReady, setCameraReady] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const navigate = useNavigate()

  const handleFile = (file: File) => {
    setFileName(file.name)
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
      setMode('preview')
    }
    reader.readAsDataURL(file)
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) handleFile(file)
  }, [])

  const startCamera = async () => {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      })
      streamRef.current = stream
      setMode('camera')
      setCameraReady(false)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.onloadedmetadata = () => setCameraReady(true)
        }
      }, 100)
    } catch {
      setError('Camera access denied. Please allow camera permissions or use file upload.')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
    setPreview(dataUrl)
    setFileName('camera-capture.jpg')
    // Convert data URL to File for upload
    canvas.toBlob((blob) => {
      if (blob) setImageFile(new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
    stopCamera()
    setMode('preview')
  }

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    setCameraReady(false)
  }

  const reset = () => {
    stopCamera()
    setPreview(null)
    setImageFile(null)
    setFileName('')
    setMode('idle')
    setError('')
  }

  const analyze = async () => {
    if (!imageFile) return
    setLoading(true)
    setError('')
    try {
      // Wake up backend first (Render free tier sleeps after inactivity)
      try { await axios.get(`${API_BASE}/api/health`, { timeout: 10000 }) } catch {}

      const formData = new FormData()
      formData.append('image', imageFile, imageFile.name)

      const response = await axios.post(`${API_BASE}/api/scan`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 90000
      })
      navigate(`/results/${response.data.id}`, { state: response.data })
    } catch (err: unknown) {
      let msg = 'Analysis failed. Please try again.'
      if (axios.isAxiosError(err)) {
        if (!err.response) {
          msg = 'Server is waking up — please wait 30 seconds and try again.'
        } else {
          msg = err.response.data?.error || `Server error ${err.response.status}. Please try again.`
        }
      }
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      {/* Page hero */}
      <div className="relative h-52 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=1400&q=80"
          alt="Farmer scanning crops"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/80 via-emerald-800/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-12">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-2">
              <ScanLine className="w-4 h-4" />
              Powered by Plant Disease ML Model
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">Plant Disease Scanner</h1>
            <p className="text-emerald-100 mt-1 text-sm">Upload or capture a plant image for real AI diagnosis</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Scanner panel */}
          <div className="lg:col-span-2 space-y-5">


            {error && (
              <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* ── IDLE ── */}
            {mode === 'idle' && (
              <div className="space-y-4">
                {/* Upload zone */}
                <div
                  onDrop={onDrop}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileRef.current?.click()}
                  className="relative border-2 border-dashed border-emerald-300 rounded-3xl p-14 text-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/50 transition-all duration-200 group overflow-hidden"
                >
                  <Leaf className="absolute -bottom-6 -right-6 w-32 h-32 text-emerald-100 group-hover:text-emerald-200 transition-colors" />
                  <div className="relative">
                    <div className="bg-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-emerald-200 transition-colors">
                      <Upload className="w-8 h-8 text-emerald-600" />
                    </div>
                    <p className="text-lg font-bold text-gray-800 mb-1">Drop your plant image here</p>
                    <p className="text-sm text-gray-400">or click to browse — JPG, PNG, WEBP supported</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 h-px bg-gray-200" />
                  <span className="text-sm text-gray-400 font-medium">or take a photo</span>
                  <div className="flex-1 h-px bg-gray-200" />
                </div>

                {/* Camera button */}
                <button
                  onClick={startCamera}
                  className="w-full flex items-center justify-center gap-3 bg-gray-900 hover:bg-gray-800 text-white font-bold py-4 rounded-2xl transition-colors shadow-lg"
                >
                  <Camera className="w-5 h-5" />
                  Open Camera
                </button>
              </div>
            )}

            {/* ── CAMERA ── */}
            {mode === 'camera' && (
              <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden bg-black aspect-video shadow-xl">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Scan frame overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-2/3 h-2/3">
                      {/* Corner brackets */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg" />
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg" />
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg" />
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg" />
                    </div>
                  </div>
                  {/* Camera status */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${cameraReady ? 'bg-emerald-400 animate-pulse' : 'bg-yellow-400'}`} />
                    <span className="text-white text-xs font-medium">{cameraReady ? 'Camera Ready' : 'Starting...'}</span>
                  </div>
                </div>

                <p className="text-center text-sm text-gray-500">Position the affected leaf inside the frame</p>

                <div className="flex gap-3">
                  <button onClick={reset} className="flex-1 btn-secondary flex items-center justify-center gap-2">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    disabled={!cameraReady}
                    className="flex-1 btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Camera className="w-4 h-4" /> Capture Photo
                  </button>
                </div>
              </div>
            )}

            {/* ── PREVIEW ── */}
            {mode === 'preview' && preview && (
              <div className="space-y-5">
                <div className="relative rounded-3xl overflow-hidden bg-gray-100 aspect-video shadow-xl">
                  <img src={preview} alt="Plant preview" className="w-full h-full object-contain" />
                  <button
                    onClick={reset}
                    className="absolute top-3 right-3 bg-white/90 hover:bg-white p-2 rounded-full shadow-md transition-colors"
                  >
                    <X className="w-4 h-4 text-gray-700" />
                  </button>
                  {/* Retake button */}
                  <button
                    onClick={() => { setPreview(null); setMode('idle') }}
                    className="absolute bottom-3 right-3 bg-white/90 hover:bg-white px-3 py-1.5 rounded-full shadow-md transition-colors flex items-center gap-1.5 text-xs font-semibold text-gray-700"
                  >
                    <RefreshCw className="w-3 h-3" /> Retake
                  </button>
                </div>

                <div className="card flex items-center gap-4">
                  <div className="bg-emerald-100 p-3 rounded-xl">
                    <Leaf className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400">Selected image</p>
                    <p className="font-semibold text-gray-900 truncate">{fileName}</p>
                  </div>
                </div>

                {/* AI info banner */}
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Advanced Plant Analysis</p>
                    <p className="text-xs text-emerald-600 mt-0.5">Our ML model identifies diseases, symptoms, treatment &amp; medicines. Switch to தமிழ் on the results page.</p>
                  </div>
                </div>

                <button
                  onClick={analyze}
                  disabled={loading}
                  className="w-full btn-primary flex items-center justify-center gap-3 py-4 text-base disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>AI is analyzing your plant<span className="animate-pulse">...</span></span>
                    </>
                  ) : (                    <>
                      <ScanLine className="w-5 h-5" />
                      Analyze with Leonux AI
                    </>
                  )}
                </button>

                {loading && (
                  <p className="text-center text-xs text-gray-400">This may take 30–60 seconds — server may be waking up on first use</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Tips */}
            <div className="card border-emerald-100">
              <div className="flex items-center gap-2 mb-4">
                <Sprout className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900">Scanning Tips</h3>
              </div>
              <ul className="space-y-3">
                {tips.map((tip, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                    <span className="bg-emerald-100 text-emerald-700 font-bold text-xs w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>

        {/* Two cards — full width horizontal row below the scanner */}
        <div className="grid grid-cols-2 gap-6 mt-8">
          {/* ML Vision card */}
          <div className="card bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-0">
            <div className="flex items-center gap-2 mb-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ScanLine className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-sm">ML Vision Model</h3>
            </div>
            <p className="text-emerald-100 text-xs leading-relaxed">
              Our plant disease model is trained on thousands of crop images to detect diseases, symptoms, and recommend treatments accurately.
            </p>
          </div>

          {/* Drone image card */}
          <div className="relative rounded-2xl overflow-hidden h-44 shadow-md">
            <img
              src="https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800&q=80"
              alt="Agricultural drone"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <p className="text-white font-bold text-sm">Drone Field Monitoring</p>
              <p className="text-gray-300 text-xs mt-0.5">Coming soon — aerial crop scanning</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
