import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import Results from './pages/Results'
import PestFinder from './pages/PestFinder'
import { LangProvider } from './context/LangContext'
import { useLang } from './context/LangContext'
import { AlertTriangle } from 'lucide-react'

function DisclaimerFooter() {
  const { isTamil } = useLang()
  return (
    <div className="w-full bg-amber-50 border-t border-amber-200 px-4 py-3">
      <div className="max-w-5xl mx-auto flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          <span className="font-bold">
            {isTamil ? '⚠️ மறுப்பு: ' : '⚠️ Disclaimer: '}
          </span>
          {isTamil
            ? 'Leonux AI கணிப்புகள் AI மூலம் உருவாக்கப்பட்டவை மற்றும் 100% துல்லியமாக இருக்காது. எந்தவொரு சிகிச்சையையும் பயன்படுத்துவதற்கு முன் தொழில்முறை வேளாண் அறிஞர் அல்லது வேளாண் அதிகாரியிடம் ஆலோசனை பெறுங்கள்.'
            : 'Leonux AI predictions are AI-generated and may not be 100% accurate. Always consult a professional agronomist or agricultural officer before applying any treatments.'}
        </p>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Navbar />
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scanner" element={<Scanner />} />
              <Route path="/results/:id" element={<Results />} />
              <Route path="/pest-finder" element={<PestFinder />} />
            </Routes>
          </div>
          <DisclaimerFooter />
        </div>
      </BrowserRouter>
    </LangProvider>
  )
}
