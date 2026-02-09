import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const GetStarted: React.FC = () => {
  const nav = useNavigate()
  const { t } = useTranslation()
  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5FDF6' }}>
      <div className="text-center bg-white shadow-xl rounded-2xl p-10 space-y-6 max-w-lg w-full border" style={{ borderColor: '#A5D6A7' }}>
        <h1 className="text-4xl font-extrabold tracking-tight" style={{ color: '#2E7D32' }}>
          {t('app.title')}
        </h1>
        <p className="text-lg leading-relaxed max-w-md mx-auto" style={{ color: '#4E6353' }}>
          {t('app.subtitle')}
        </p>
        <button
          onClick={() => nav('/start')}
          className="font-medium rounded-full px-8 py-3 transition-all duration-300 shadow-md hover:shadow-lg"
          style={{ backgroundColor: '#2E7D32', color: '#FFFFFF' }}
          onMouseOver={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#43A047' }}
          onMouseOut={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E7D32' }}
        >
          {t('app.getStarted')}
        </button>
      </div>
    </div>
  )
}

export default GetStarted
