import React from 'react'
import { useTranslation } from 'react-i18next'

const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation()
  const change = (lng: string) => {
    i18n.changeLanguage(lng)
    localStorage.setItem('locale', lng)
  }
  return (
    <select className="border rounded px-2 py-1" value={i18n.language} onChange={(e) => change(e.target.value)}>
      <option value="en">English</option>
      <option value="hi">हिंदी</option>
      <option value="te">తెలుగు</option>
    </select>
  )
}
export default LanguageToggle
