import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Microscope, BookOpen, Home, Bug } from 'lucide-react'
import { useLang } from '../context/LangContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const { lang, setLang, isTamil } = useLang()

  const navLinks = [
    { to: '/', label: isTamil ? 'முகப்பு' : 'Home', icon: Home },
    { to: '/scanner', label: isTamil ? 'ஸ்கேனர்' : 'Scanner', icon: Microscope },
    { to: '/pest-finder', label: isTamil ? 'பூச்சி கண்டுபிடிப்பு' : 'Pest Finder', icon: Bug },
    { to: '/library', label: isTamil ? 'நூலகம்' : 'Library', icon: BookOpen },
  ]

  return (
    <nav className="bg-white/95 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-emerald-500 flex-shrink-0 shadow-md">
              <img
                src="/logo.png"
                alt="Leonux AI"
                className="w-full h-full object-cover"
                onError={(e) => {
                  const t = e.currentTarget
                  t.style.display = 'none'
                  const next = t.nextElementSibling as HTMLElement | null
                  if (next) next.style.display = 'flex'
                }}
              />
              <div className="hidden w-full h-full items-center justify-center bg-emerald-600">
                <span className="text-white font-black text-sm">L</span>
              </div>
            </div>
            <div>
              <span className="font-extrabold text-lg text-gray-900 leading-none">Leonux AI</span>
              <p className="text-xs text-emerald-600 font-medium leading-none">Plant Disease Detector</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  pathname === to
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            ))}

            {/* Language toggle switch */}
            <div className="ml-3 flex items-center gap-2">
              <span className={`text-xs font-semibold ${!isTamil ? 'text-emerald-700' : 'text-gray-400'}`}>EN</span>
              <button
                onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${
                  isTamil ? 'bg-emerald-600' : 'bg-gray-300'
                }`}
                aria-label="Toggle language"
              >
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${
                  isTamil ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
              <span className={`text-xs font-semibold ${isTamil ? 'text-emerald-700' : 'text-gray-400'}`}>தமிழ்</span>
            </div>

            <Link to="/scanner" className="ml-3 btn-primary text-sm py-2 px-5">
              {isTamil ? 'இப்போது ஸ்கேன் செய்' : 'Scan Now'}
            </Link>
          </div>

          {/* Mobile toggle */}
          <div className="md:hidden flex items-center gap-3">
            {/* Mobile language switch */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
              className={`relative w-10 h-5 rounded-full transition-colors duration-300 ${
                isTamil ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-300 ${
                isTamil ? 'translate-x-5' : 'translate-x-0'
              }`} />
            </button>
            <span className="text-xs font-bold text-gray-600">{isTamil ? 'தமிழ்' : 'EN'}</span>
            <button
              className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setOpen(!open)}
              aria-label="Toggle menu"
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                pathname === to
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
          <div className="pt-2 pb-1">
            <Link
              to="/scanner"
              onClick={() => setOpen(false)}
              className="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            >
              <Microscope className="w-4 h-4" /> {isTamil ? 'இப்போது ஸ்கேன் செய்' : 'Scan a Plant'}
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
