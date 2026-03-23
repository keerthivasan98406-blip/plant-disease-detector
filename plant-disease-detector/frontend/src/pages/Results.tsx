import { useLocation, useNavigate, Link } from 'react-router-dom'
import { CheckCircle, Pill, ShieldCheck, AlertTriangle, ArrowLeft, Camera, ChevronRight, Leaf } from 'lucide-react'
import SeverityBadge from '../components/SeverityBadge'
import { ScanResult } from '../types'

export default function Results() {
  const { state } = useLocation() as { state: ScanResult | null }
  const navigate = useNavigate()

  if (!state) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <p className="text-gray-500 mb-6">No scan result found.</p>
        <Link to="/scanner" className="btn-primary">Go to Scanner</Link>
      </div>
    )
  }

  const { disease, confidence, imageUrl, imageName, isHealthy } = state

  const severityBg: Record<string, string> = {
    High: 'from-red-900/80 via-red-800/60',
    Medium: 'from-amber-900/80 via-amber-800/60',
    Low: 'from-emerald-900/80 via-emerald-800/60',
  }
  const gradientClass = severityBg[disease.severity] ?? 'from-emerald-900/80 via-emerald-800/60'

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
              <p className="font-bold text-sm">Your plant looks healthy!</p>
              <p className="text-xs text-emerald-600 mt-0.5">No disease detected. Follow the prevention tips below to keep it that way.</p>
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
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Detected Disease</p>
                  <h2 className="text-2xl font-extrabold text-gray-900">{disease.name}</h2>
                  <p className="text-emerald-600 font-semibold text-sm mt-1">{disease.plant}</p>
                </div>
                <SeverityBadge severity={disease.severity} />
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-400">Confidence</span>
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

        {/* Detail grid */}
        <div className="grid md:grid-cols-2 gap-6">

          {/* Symptoms */}
          <div className="card border-t-4 border-t-amber-400">
            <div className="flex items-center gap-2 mb-5">
              <div className="bg-amber-100 p-2 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <h2 className="font-bold text-gray-900">Symptoms</h2>
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
              <h2 className="font-bold text-gray-900">Treatment Steps</h2>
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
              <h2 className="font-bold text-gray-900">Recommended Medicines</h2>
            </div>
            <div className="space-y-3">
              {disease.medicines.map((m, i) => (
                <div key={i} className="bg-blue-50 rounded-2xl p-4">
                  <p className="font-bold text-gray-900 text-sm">{m.name}</p>
                  <div className="flex flex-wrap gap-4 mt-2">
                    <span className="text-xs bg-white border border-blue-100 rounded-lg px-2 py-1 text-gray-600">
                      Dosage: <span className="font-semibold text-gray-800">{m.dosage}</span>
                    </span>
                    <span className="text-xs bg-white border border-blue-100 rounded-lg px-2 py-1 text-gray-600">
                      Frequency: <span className="font-semibold text-gray-800">{m.frequency}</span>
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
              <h2 className="font-bold text-gray-900">Prevention Tips</h2>
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
