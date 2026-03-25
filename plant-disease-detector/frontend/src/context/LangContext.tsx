import { createContext, useContext, useState, ReactNode } from 'react'

type Lang = 'en' | 'ta'

interface LangContextType {
  lang: Lang
  setLang: (l: Lang) => void
  isTamil: boolean
}

const LangContext = createContext<LangContextType>({ lang: 'en', setLang: () => {}, isTamil: false })

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en')
  return (
    <LangContext.Provider value={{ lang, setLang, isTamil: lang === 'ta' }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
