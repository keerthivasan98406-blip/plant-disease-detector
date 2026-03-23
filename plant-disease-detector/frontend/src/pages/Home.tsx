import { Link } from 'react-router-dom'
import {
  Camera, Zap, ShieldCheck, BarChart3, ArrowRight,
  Leaf, CheckCircle, Sun, Droplets, FlaskConical
} from 'lucide-react'

const features = [
  {
    icon: Camera,
    title: 'Instant Scanning',
    desc: 'Capture or upload a plant image and get results in seconds using AI-powered analysis.',
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: Zap,
    title: 'Fast & Accurate',
    desc: 'Our detection engine identifies diseases with high confidence across dozens of plant species.',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: ShieldCheck,
    title: 'Treatment Guidance',
    desc: 'Receive detailed treatment plans, medicine recommendations, and prevention tips.',
    color: 'bg-sky-50 text-sky-700',
  },
  {
    icon: BarChart3,
    title: 'Scan History',
    desc: 'Track all your previous scans and monitor disease trends across your fields.',
    color: 'bg-violet-50 text-violet-700',
  },
]

const steps = [
  { step: '01', icon: Camera, title: 'Capture or Upload', desc: 'Take a photo of the affected plant or upload from your gallery.' },
  { step: '02', icon: FlaskConical, title: 'AI Analysis', desc: 'Our engine analyzes the image and identifies the disease pattern.' },
  { step: '03', icon: CheckCircle, title: 'Get Diagnosis', desc: 'Receive a full report with treatment steps and medicine dosages.' },
]

const crops = [
  { name: 'Tomato', img: 'https://images.unsplash.com/photo-1592841200221-a6898f307baa?w=300&q=80' },
  { name: 'Rice', img: 'https://images.unsplash.com/photo-1536304929831-ee1ca9d44906?w=300&q=80' },
  { name: 'Wheat', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=300&q=80' },
  { name: 'Mango', img: 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=300&q=80' },
  { name: 'Grapes', img: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=300&q=80' },
  { name: 'Pepper', img: 'https://images.unsplash.com/photo-1563565375-f3fdfdbefa83?w=300&q=80' },
]

export default function Home() {
  return (
    <div className="overflow-x-hidden">

      {/* ── HERO ── */}
      <section className="relative min-h-[90vh] flex items-center">

        {/* Background — tractor spraying field at golden hour */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1574943320219-553eb213f72d?w=1800&q=90"
            alt="Tractor in field"
            className="w-full h-full object-cover object-center"
          />
          {/* Left-heavy dark green overlay — matches reference */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-transparent to-emerald-950/60" />
        </div>

        {/* LEFT-aligned content — shifted up */}
        <div className="relative w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 pt-20">
          <div className="max-w-xl">
            {/* Main headline */}
            <h1 className="text-5xl sm:text-6xl font-black text-white leading-[1.1] mb-5">
              Leonux AI
              <br />
              <span className="text-emerald-400">Disease Detection</span>
            </h1>

            {/* Sub description */}
            <p className="text-gray-300 text-base leading-relaxed mb-10 max-w-md">
              Instantly identify plant diseases from a photo. Get AI-powered diagnosis with treatment plans, medicine dosages, and prevention tips — built for farmers and agronomists.
            </p>

            {/* CTA buttons — pill shape like reference */}
            <div className="flex flex-wrap gap-4">
              <Link
                to="/scanner"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 py-3.5 rounded-full transition-all duration-200 shadow-lg hover:shadow-emerald-700/40 hover:-translate-y-0.5 text-sm"
              >
                Scan a Plant
                <Camera className="w-4 h-4" />
              </Link>
              <Link
                to="/library"
                className="inline-flex items-center gap-2 border border-yellow-400/70 text-yellow-300 hover:bg-yellow-400/10 font-bold px-7 py-3.5 rounded-full transition-all duration-200 text-sm"
              >
                View All Diseases
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Trust badges below buttons */}
            <div className="flex flex-wrap gap-6 mt-10">
              {[
                { icon: Sun, text: 'Real-time Detection' },
                { icon: Droplets, text: 'Treatment Guidance' },
                { icon: ShieldCheck, text: 'Trusted by Farmers' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-gray-400 text-xs">
                  <Icon className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom stat bar — removed */}

      </section>

      {/* ── FIELD SHOWCASE ── */}
      <section className="relative py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-emerald-600 font-semibold text-sm uppercase tracking-widest">Smart Agriculture</span>
              <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-6 leading-tight">
                AI That Works Right in Your Field
              </h2>
              <p className="text-gray-500 text-lg mb-8 leading-relaxed">
                PlantGuard brings laboratory-grade disease detection to your smartphone. Whether you're managing a small farm or large-scale crops, get instant insights without waiting for lab results.
              </p>
              <ul className="space-y-4">
                {[
                  'Detects 50+ plant diseases across major crops',
                  'Step-by-step treatment with exact medicine dosages',
                  'Works offline — no internet required after setup',
                  'Scan history to track field health over time',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3 text-gray-700">
                    <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/scanner" className="inline-flex items-center gap-2 mt-10 btn-primary">
                Try It Free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Stacked farm images */}
            <div className="relative h-[500px]">
              <img
                src="https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=700&q=80"
                alt="Farmer in field"
                className="absolute top-0 right-0 w-4/5 h-72 object-cover rounded-3xl shadow-2xl"
              />
              <img
                src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=500&q=80"
                alt="Crop close-up"
                className="absolute bottom-0 left-0 w-3/5 h-64 object-cover rounded-3xl shadow-2xl border-4 border-white"
              />
              {/* Floating badge */}
              <div className="absolute top-56 left-8 bg-white rounded-2xl shadow-xl px-5 py-4 flex items-center gap-3 border border-gray-100">
                <div className="bg-emerald-100 p-2 rounded-xl">
                  <Leaf className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Disease Detected</p>
                  <p className="font-bold text-gray-900 text-sm">Late Blight — 92%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="relative py-24 overflow-hidden">
        {/* Subtle field texture background */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?w=1600&q=60"
            alt=""
            className="w-full h-full object-cover opacity-5"
          />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-widest">Simple Process</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">How It Works</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Three simple steps to identify and treat plant diseases instantly.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, icon: Icon, title, desc }, i) => (
              <div key={step} className="relative">
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-emerald-200 to-transparent z-0 -translate-x-8" />
                )}
                <div className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative z-10">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="bg-emerald-600 text-white w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0">
                      {step}
                    </div>
                    <Icon className="w-5 h-5 text-emerald-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CROP GALLERY ── */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-widest">Supported Crops</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">Covers Your Key Crops</h2>
            <p className="text-gray-500 max-w-xl mx-auto">From staple grains to fruits and vegetables — PlantGuard has you covered.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {crops.map(({ name, img }) => (
              <div key={name} className="group relative rounded-2xl overflow-hidden aspect-square shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <p className="absolute bottom-3 left-0 right-0 text-center text-white font-semibold text-sm">{name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-emerald-600 font-semibold text-sm uppercase tracking-widest">Features</span>
            <h2 className="text-4xl font-bold text-gray-900 mt-3 mb-4">Everything You Need</h2>
            <p className="text-gray-500 max-w-xl mx-auto">A complete toolkit for plant disease management in the field.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-5 ${color} bg-opacity-10`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FULL-WIDTH FARM BANNER ── */}
      <section className="relative h-80 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1600&q=80"
          alt="Farm landscape"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-emerald-900/60" />
        <div className="absolute inset-0 flex items-center justify-center text-center px-4">
          <div>
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-4 drop-shadow">
              Healthy Crops. Better Yields.
            </h2>
            <p className="text-emerald-200 text-lg mb-8">Start protecting your farm with Leonux AI disease detection.</p>
            <Link
              to="/scanner"
              className="inline-flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-10 py-4 rounded-2xl transition-all duration-200 shadow-xl text-base"
            >
              <Camera className="w-5 h-5" />
              Scan a Plant Now
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-gray-900 text-gray-400 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
                <img
                  src="/logo.png"
                  alt="Leonux AI"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                    const fb = e.currentTarget.nextElementSibling as HTMLElement | null
                    if (fb) fb.style.display = 'flex'
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center bg-emerald-600 rounded-xl">
                  <span className="text-white font-black text-sm">L</span>
                </div>
              </div>
              <div>
                <span className="font-bold text-white text-lg">Leonux AI</span>
                <p className="text-xs text-gray-500">Disease Detection</p>
              </div>
            </div>
            <div className="flex gap-8 text-sm">
              <Link to="/" className="hover:text-white transition-colors">Home</Link>
              <Link to="/scanner" className="hover:text-white transition-colors">Scanner</Link>
              <Link to="/library" className="hover:text-white transition-colors">Library</Link>
            </div>
            <p className="text-xs text-gray-600">© 2026 Leonux AI Disease Detection. Built for modern agriculture.</p>
          </div>
        </div>
      </footer>

    </div>
  )
}
