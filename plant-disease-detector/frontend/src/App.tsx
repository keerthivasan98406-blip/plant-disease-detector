import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Scanner from './pages/Scanner'
import Results from './pages/Results'
import Library from './pages/Library'
import PestFinder from './pages/PestFinder'
import WeatherRisk from './pages/WeatherRisk'
import { LangProvider } from './context/LangContext'

export default function App() {
  return (
    <LangProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/scanner" element={<Scanner />} />
            <Route path="/results/:id" element={<Results />} />
            <Route path="/library" element={<Library />} />
            <Route path="/pest-finder" element={<PestFinder />} />
            <Route path="/weather-risk" element={<WeatherRisk />} />
          </Routes>
        </div>
      </BrowserRouter>
    </LangProvider>
  )
}
