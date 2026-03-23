import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Microscope, BookOpen, Home } from 'lucide-react'

const navLinks = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/scanner', label: 'Scanner', icon: Microscope },
  { to: '/library', label: 'Library', icon: BookOpen },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

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
              <p className="text-xs text-emerald-600 font-medium leading-none">Disease Detection</p>
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
            <Link to="/scanner" className="ml-3 btn-primary text-sm py-2 px-5">
              Scan Now
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
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
              <Microscope className="w-4 h-4" /> Scan a Plant
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
