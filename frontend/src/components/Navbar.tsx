import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Microscope, Home, Bug, Cloud } from 'lucide-react'
import { useLang } from '../context/LangContext'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const { pathname } = useLocation()
  const { lang, setLang, isTamil } = useLang()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close menu on route change
  useEffect(() => setOpen(false), [pathname])

  const navLinks = [
    { to: '/',             label: isTamil ? 'முகப்பு'           : 'Home',         icon: Home },
    { to: '/scanner',      label: isTamil ? 'ஸ்கேனர்'           : 'Scanner',      icon: Microscope },
    { to: '/pest-finder',  label: isTamil ? 'பூச்சி கண்டுபிடிப்பு' : 'Pest Finder', icon: Bug },
    { to: '/weather-risk', label: isTamil ? 'வானிலை அபாயம்'    : 'Weather Risk', icon: Cloud },
  ]

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-lg shadow-md border-b border-gray-100' : 'bg-white/90 backdrop-blur-md border-b border-gray-100'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-emerald-500 shadow-md shadow-emerald-500/20 flex-shrink-0 transition-transform group-hover:scale-105">
              <img src="/logo.png" alt="Leonux AI" className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                  const fb = e.currentTarget.nextElementSibling as HTMLElement | null
                  if (fb) fb.style.display = 'flex'
                }} />
              <div className="hidden w-full h-full items-center justify-center bg-gradient-to-br from-emerald-500 to-teal-600">
                <span className="text-white font-black text-sm">L</span>
              </div>
            </div>
            <div className="leading-none">
              <p className="font-extrabold text-[15px] text-gray-900">Leonux AI</p>
              <p className="text-[10px] text-emerald-600 font-semibold">Plant Disease Detector</p>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link key={to} to={to}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-150 ${
                  pathname === to
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}>
                <Icon className="w-3.5 h-3.5" />{label}
              </Link>
            ))}
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-bold transition-colors ${!isTamil ? 'text-emerald-700' : 'text-gray-300'}`}>EN</span>
              <button
                onClick={() => setLang(lang === 'en' ? 'ta' : 'en')}
                className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-1 ${
                  isTamil ? 'bg-emerald-600' : 'bg-gray-200'
                }`}
                aria-label="Toggle language">
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                  isTamil ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
              <span className={`text-[11px] font-bold transition-colors ${isTamil ? 'text-emerald-700' : 'text-gray-300'}`}>த</span>
            </div>

            {/* CTA — desktop only */}
            <Link to="/scanner"
              className="hidden md:inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-500/20 hover:-translate-y-0.5">
              <Microscope className="w-3.5 h-3.5" />
              {isTamil ? 'ஸ்கேன்' : 'Scan Now'}
            </Link>

            {/* Mobile hamburger */}
            <button onClick={() => setOpen(!open)}
              className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors focus:outline-none"
              aria-label="Toggle menu">
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`md:hidden overflow-hidden transition-all duration-300 ${open ? 'max-h-96' : 'max-h-0'}`}>
        <div className="border-t border-gray-100 bg-white/95 backdrop-blur-sm px-4 pb-4 pt-2 space-y-1">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link key={to} to={to} onClick={() => setOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                pathname === to ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <Icon className="w-4 h-4 flex-shrink-0" />{label}
            </Link>
          ))}
          <div className="pt-2">
            <Link to="/scanner" onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold py-3 rounded-xl text-sm shadow-lg shadow-emerald-500/20">
              <Microscope className="w-4 h-4" />
              {isTamil ? 'இப்போது ஸ்கேன் செய்' : 'Scan a Plant Now'}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
