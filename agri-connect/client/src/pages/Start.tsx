import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Start: React.FC = () => {
  const nav = useNavigate()
  const { t } = useTranslation()
  return (
    <div className="min-h-screen px-4" style={{ backgroundColor: '#F5FDF6' }}>
      <div id="home" className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center bg-white shadow-xl rounded-2xl p-10 space-y-6 max-w-3xl w-full border" style={{ borderColor: '#A5D6A7' }}>
          <h2 className="text-3xl font-bold" style={{ color: '#2E7D32' }}>{t('landing.homeTitle')}</h2>
          <p className="text-sm max-w-2xl mx-auto text-left" style={{ color: '#4E6353' }}>{t('landing.homeDesc')}</p>
        </div>
      </div>

      <section id="about" className="max-w-6xl mx-auto py-12 px-4">
        <h3 className="text-2xl font-semibold mb-6" style={{ color: '#1B4332' }}>{t('landing.featuresTitle')}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6 items-stretch">
          <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col" style={{ borderColor: '#A5D6A7' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: '#66BB6A' }}>
              <span className="text-lg">🌾</span>
              <span className="font-medium" style={{ color: '#1B4332' }}>{t('landing.featFarmersTitle')}</span>
            </div>
            <p className="text-sm" style={{ color: '#4E6353' }}>{t('landing.featFarmersDesc')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col" style={{ borderColor: '#A5D6A7' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: '#66BB6A' }}>
              <span className="text-lg">🛒</span>
              <span className="font-medium" style={{ color: '#1B4332' }}>{t('landing.featBuyersTitle')}</span>
            </div>
            <p className="text-sm" style={{ color: '#4E6353' }}>{t('landing.featBuyersDesc')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col" style={{ borderColor: '#A5D6A7' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: '#66BB6A' }}>
              <span className="text-lg">🧑‍💼</span>
              <span className="font-medium" style={{ color: '#1B4332' }}>{t('landing.featAdminsTitle')}</span>
            </div>
            <p className="text-sm" style={{ color: '#4E6353' }}>{t('landing.featAdminsDesc')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col" style={{ borderColor: '#A5D6A7' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: '#66BB6A' }}>
              <span className="text-lg">🤖</span>
              <span className="font-medium" style={{ color: '#1B4332' }}>{t('landing.featAITitle')}</span>
            </div>
            <p className="text-sm" style={{ color: '#4E6353' }}>{t('landing.featAIDesc')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col" style={{ borderColor: '#A5D6A7' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: '#66BB6A' }}>
              <span className="text-lg">💬</span>
              <span className="font-medium" style={{ color: '#1B4332' }}>{t('landing.featRealtimeTitle')}</span>
            </div>
            <p className="text-sm" style={{ color: '#4E6353' }}>{t('landing.featRealtimeDesc')}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border p-6 h-full flex flex-col" style={{ borderColor: '#A5D6A7' }}>
            <div className="flex items-center gap-2 mb-2" style={{ color: '#66BB6A' }}>
              <span className="text-lg">🌍</span>
              <span className="font-medium" style={{ color: '#1B4332' }}>{t('landing.featLangTitle')}</span>
            </div>
            <p className="text-sm" style={{ color: '#4E6353' }}>{t('landing.featLangDesc')}</p>
          </div>
        </div>
      </section>

      <section id="profile" className="max-w-6xl mx-auto py-12 px-4">
        <div className="bg-white rounded-2xl shadow-sm border p-8 max-w-3xl mx-auto" style={{ borderColor: '#A5D6A7' }}>
          <h3 className="text-xl font-semibold mb-3 text-center" style={{ color: '#1B4332' }}>{t('landing.profileTitle')}</h3>
          <div className="space-y-2 mb-5 text-sm" style={{ color: '#4E6353' }}>
            <div className="flex items-start gap-2">
              <span className="select-none">👨‍🌾</span>
              <p className="leading-relaxed">{t('landing.profileFarmers')}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="select-none">🛒</span>
              <p className="leading-relaxed">{t('landing.profileBuyers')}</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="select-none">🧑‍💼</span>
              <p className="leading-relaxed">{t('landing.profileAdmins')}</p>
            </div>
          </div>
          <div className="border-t my-4" style={{ borderColor: '#A5D6A7' }}></div>
          <p className="text-sm mb-4 text-center" style={{ color: '#4E6353' }}>{t('landing.profileCta')}</p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => nav('/login')}
              className="border-2 rounded-full px-5 py-2"
              style={{ borderColor: '#2E7D32', color: '#2E7D32', backgroundColor: 'transparent' }}
              onMouseOver={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#E8F5E9' }}
              onMouseOut={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent' }}
            >
              {t('app.login')}
            </button>
            <button
              onClick={() => nav('/register')}
              className="rounded-full px-5 py-2 text-white"
              style={{ backgroundColor: '#2E7D32' }}
              onMouseOver={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#43A047' }}
              onMouseOut={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E7D32' }}
            >
              {t('app.createAccount')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Start
