import { useState } from 'react'
import { Search, Sprout, BookOpen, Lightbulb, AlertTriangle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { diseases } from '../data/diseases'
import SeverityBadge from '../components/SeverityBadge'
import { useLang } from '../context/LangContext'

// Local images — downloaded and stored in /public for reliability
const diseaseImages: Record<string, string> = {
  '1':  '/disease-tomato.jpg',   // tomato — Late Blight
  '2':  '/disease-leaf.jpg',     // cucumber leaf — Powdery Mildew
  '3':  '/disease-pepper.jpg',   // chili pepper — Bacterial Leaf Spot
  '4':  '/disease-rice.jpg',     // rice field — Rice Blast
  '5':  '/disease-mango.jpg',    // mango — Anthracnose
  '6':  '/disease-grapes.jpg',   // grapes — Downy Mildew
  '7':  '/disease-wilt.jpg',     // wilting crop — Fusarium Wilt
  '8':  '/disease-citrus.jpg',   // citrus orange — Citrus Canker
  '9':  '/disease-wheat.jpg',    // wheat field — Leaf Rust
  '10': '/disease-banana.jpg',   // banana plant — Black Sigatoka
  '11': '/disease-tomato2.jpg',  // tomato crop — Early Blight
  '12': '/disease-soil.jpg',     // farm soil — Root Rot
}

const agriImages = [
  { src: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=400&q=80', label: 'Field Inspection' },
  { src: 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?w=400&q=80', label: 'Drone Spraying' },
  { src: 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=400&q=80', label: 'Crop Monitoring' },
]

const tips = [
  'Early detection saves up to 80% of crop loss — scan weekly.',
  'Fungal diseases spread faster in humid, warm conditions.',
  'Crop rotation every 2–3 years breaks disease cycles in soil.',
  'Always sterilize pruning tools between plants to prevent spread.',
  'Most fungal diseases thrive between 20–30°C with high humidity.',
]

const severityBorder: Record<string, string> = {
  High:   'border-t-red-400',
  Medium: 'border-t-amber-400',
  Low:    'border-t-emerald-400',
}

export default function Library() {
  const { isTamil } = useLang()
  const t = (en: string, ta: string) => isTamil ? ta : en
  const [query, setQuery] = useState('')
  const [severityFilter, setSeverityFilter] = useState('All')
  const [expanded, setExpanded]         = useState<string | null>(null)
  const [tipIndex, setTipIndex]         = useState(0)

  const filtered = diseases.filter(d => {
    const matchQ = d.name.toLowerCase().includes(query.toLowerCase()) ||
                   d.plant.toLowerCase().includes(query.toLowerCase())
    const matchS = severityFilter === 'All' || d.severity === severityFilter
    return matchQ && matchS
  })

  const featured = diseases.find(d => d.severity === 'High')!

  return (
    <div>
      {/* Hero */}
      <div className="relative h-56 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=1400&q=80"
          alt="Crop field" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/85 via-emerald-800/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 to-transparent" />
        <div className="absolute inset-0 flex items-center px-6 sm:px-12">
          <div>
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-medium mb-2">
              <BookOpen className="w-4 h-4" /> {t('Knowledge Base','அறிவுத் தளம்')}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow">{t('Diseases Library','நோய்கள் நூலகம்')}</h1>
            <p className="text-emerald-100 mt-1 text-sm">{t(`Browse ${diseases.length} plant diseases with full treatment info`,`${diseases.length} தாவர நோய்களை முழு சிகிச்சை தகவலுடன் உலாவுங்கள்`)}</p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">

        {/* Featured disease banner */}
        <div className="relative rounded-3xl overflow-hidden mb-10 shadow-lg h-48">
          <img src={diseaseImages[featured.id]} alt={featured.name}
            className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
          <div className="absolute inset-0 flex items-center px-8 gap-6">
            <div className="flex-1">
              <p className="text-emerald-400 text-xs font-semibold uppercase tracking-widest mb-1">{t('Featured Disease','சிறப்பு நோய்')}</p>
              <h2 className="text-2xl font-extrabold text-white mb-1">{featured.name}</h2>
              <p className="text-gray-300 text-sm mb-3 line-clamp-2">{featured.description}</p>
              <SeverityBadge severity={featured.severity} />
            </div>
            <Link to="/scanner"
              className="flex-shrink-0 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-5 py-3 rounded-2xl text-sm transition-colors shadow-lg">
              {t('Scan Your Plant','உங்கள் தாவரத்தை ஸ்கேன் செய்')}
            </Link>
          </div>
        </div>

        {/* Did You Know */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 mb-8 flex items-start gap-4">
          <div className="bg-amber-100 p-2 rounded-xl flex-shrink-0">
            <Lightbulb className="w-5 h-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">{t('Did You Know?','உங்களுக்கு தெரியுமா?')}</p>
            <p className="text-sm text-amber-800">{tips[tipIndex]}</p>
          </div>
          <button
            onClick={() => setTipIndex((tipIndex + 1) % tips.length)}
            className="text-xs text-amber-600 hover:text-amber-800 font-semibold flex-shrink-0 mt-1 transition-colors">
            {t('Next tip →','அடுத்த குறிப்பு →')}
          </button>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder={t('Search by disease or plant name...','நோய் அல்லது தாவர பெயரால் தேடுங்கள்...')}
                  value={query} onChange={e => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm" />
              </div>
              <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm bg-white shadow-sm">
                <option value="All">{t('All Severities','அனைத்து தீவிரங்கள்')}</option>
                <option value="Low">{t('Low','குறைவு')}</option>
                <option value="Medium">{t('Medium','நடுத்தரம்')}</option>
                <option value="High">{t('High','அதிகம்')}</option>
              </select>
            </div>

            <p className="text-sm text-gray-400 mb-5 font-medium">
              {filtered.length} {t('disease','நோய்')}{filtered.length !== 1 ? (isTamil ? 'கள்' : 's') : ''} {t('found','கண்டறியப்பட்டது')}
            </p>

            {/* 2-column card grid */}
            <div className="grid sm:grid-cols-2 gap-5">
              {filtered.map(disease => (
                <div key={disease.id}
                  className={`card border-t-4 ${severityBorder[disease.severity]} hover:shadow-lg transition-all duration-200 overflow-hidden p-0`}>
                  {/* Image */}
                  <div className="relative h-40 overflow-hidden bg-emerald-100">
                    <img
                      src={diseaseImages[disease.id] ?? 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600&q=80'}
                      alt={disease.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        const fb = e.currentTarget.nextElementSibling as HTMLElement | null
                        if (fb) fb.style.display = 'flex'
                      }}
                    />
                    <div className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-emerald-400 to-emerald-600 absolute inset-0">
                      <span className="text-white font-bold text-sm text-center px-4">{disease.name}</span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                      <p className="text-white font-bold text-xs drop-shadow">{disease.plant}</p>
                      <SeverityBadge severity={disease.severity} />
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <h3 className="font-bold text-gray-900 text-base mb-1">{disease.name}</h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{disease.description}</p>

                    <button
                      onClick={() => setExpanded(expanded === disease.id ? null : disease.id)}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
                      {expanded === disease.id ? t('Hide details ▲','விவரங்களை மறை ▲') : t('View details ▼','விவரங்களை காண்க ▼')}
                    </button>

                    {expanded === disease.id && (
                      <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                        <div>
                          <p className="text-xs font-bold text-amber-600 mb-1.5">{t('Symptoms','அறிகுறிகள்')}</p>
                          <ul className="space-y-1">
                            {disease.symptoms.map((s, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mt-1 flex-shrink-0" />{s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 mb-1.5">{t('Treatment','சிகிச்சை')}</p>
                          <ul className="space-y-1">
                            {disease.treatment.map((t, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1 flex-shrink-0" />{t}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-blue-600 mb-1.5">{t('Medicines','மருந்துகள்')}</p>
                          <div className="space-y-1.5">
                            {disease.medicines.map((m, i) => (
                              <div key={i} className="bg-blue-50 rounded-xl px-3 py-2">
                                <p className="text-xs font-bold text-gray-800">{m.name}</p>
                                <p className="text-xs text-gray-500">{m.dosage} · {m.frequency}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-green-600 mb-1.5">{t('Prevention','தடுப்பு')}</p>
                          <ul className="space-y-1">
                            {disease.prevention.map((p, i) => (
                              <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-1 flex-shrink-0" />{p}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="col-span-2 text-center py-20 text-gray-400">
                  <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-30" />
                  <p className="font-medium">{t('No diseases found matching your search.','உங்கள் தேடலுக்கு பொருந்தும் நோய்கள் எதுவும் இல்லை.')}</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Quick Stats */}
            <div className="card bg-emerald-50 border-emerald-100">
              <div className="flex items-center gap-2 mb-3">
                <Sprout className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-gray-900 text-sm">{t('Quick Stats','விரைவு புள்ளிவிவரங்கள்')}</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: t('Total Diseases','மொத்த நோய்கள்'), value: diseases.length },
                  { label: t('High Severity','அதிக தீவிரம்'),   value: diseases.filter(d => d.severity === 'High').length,   color: 'text-red-600' },
                  { label: t('Medium Severity','நடுத்தர தீவிரம்'), value: diseases.filter(d => d.severity === 'Medium').length, color: 'text-amber-600' },
                  { label: t('Low Severity','குறைந்த தீவிரம்'),    value: diseases.filter(d => d.severity === 'Low').length,    color: 'text-emerald-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex justify-between items-center text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-bold ${color ?? 'text-gray-900'}`}>{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Severity legend */}
            <div className="card">
              <h3 className="font-bold text-gray-900 text-sm mb-3">{t('Severity Guide','தீவிர வழிகாட்டி')}</h3>
              <div className="space-y-2.5">
                {[
                  { level: t('High','அதிகம்'),   color: 'bg-red-100 text-red-700',     desc: t('Can destroy entire crop if untreated','சிகிச்சையளிக்காவிட்டால் முழு பயிரையும் அழிக்கலாம்') },
                  { level: t('Medium','நடுத்தரம்'), color: 'bg-amber-100 text-amber-700', desc: t('Significant yield loss possible','கணிசமான விளைச்சல் இழப்பு சாத்தியம்') },
                  { level: t('Low','குறைவு'),    color: 'bg-emerald-100 text-emerald-700', desc: t('Manageable with basic treatment','அடிப்படை சிகிச்சையுடன் நிர்வகிக்கலாம்') },
                ].map(({ level, color, desc }) => (
                  <div key={level} className="flex items-start gap-2">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${color}`}>{level}</span>
                    <p className="text-xs text-gray-500">{desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Scan CTA */}
            <div className="card bg-gradient-to-br from-emerald-600 to-emerald-800 text-white border-0 text-center">
              <p className="font-bold text-sm mb-1">{t('Spot a disease?','நோயை கண்டீர்களா?')}</p>
              <p className="text-emerald-100 text-xs mb-4">{t('Upload a photo and get an instant AI diagnosis.','ஒரு புகைப்படத்தை பதிவேற்றி உடனடி AI நோயறிதலைப் பெறுங்கள்.')}</p>
              <Link to="/scanner" className="bg-white text-emerald-700 font-bold text-xs px-4 py-2 rounded-xl hover:bg-emerald-50 transition-colors inline-block">
                {t('Scan Now →','இப்போது ஸ்கேன் செய் →')}
              </Link>
            </div>

            {/* Agri images */}
            {agriImages.map(({ src, label }) => (
              <div key={label} className="relative rounded-2xl overflow-hidden h-36 shadow-md group">
                <img src={src} alt={label} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-3 text-white font-bold text-xs">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
