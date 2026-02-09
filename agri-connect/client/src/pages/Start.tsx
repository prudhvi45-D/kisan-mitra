import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const Start: React.FC = () => {
  const nav = useNavigate()
  const { t } = useTranslation()

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-green-50 to-white pt-16 pb-24 lg:pt-32">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#80ffdb] to-[#64f4ac] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-700 pb-2">
              {t('landing.homeTitle')}
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
              {t('landing.homeDesc')}
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => nav('/register')}
                className="rounded-full bg-green-600 px-8 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-green-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-600 transition-all hover:scale-105 active:scale-95"
              >
                {t('app.createAccount')}
              </button>
              <button
                onClick={() => nav('/login')}
                className="text-sm font-semibold leading-6 text-gray-900 hover:text-green-600 transition-colors flex items-center gap-1 group"
              >
                {t('app.login')} <span className="group-hover:translate-x-1 transition-transform" aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </div>

        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#80ffdb] to-[#72efad] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ clipPath: 'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)' }}></div>
        </div>
      </div>

      {/* Features Grid */}
      <section id="features" className="py-20 sm:py-24 bg-white relative">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-16">
            <h2 className="text-base font-semibold leading-7 text-green-600">{t('landing.whyChooseUs') || 'Why Choose Us'}</h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">{t('landing.featuresTitle')}</p>
          </div>

          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <div className="grid grid-cols-1 gap-x-8 gap-y-10 lg:grid-cols-3">
              {[
                { icon: '🌾', title: t('landing.featFarmersTitle'), desc: t('landing.featFarmersDesc') },
                { icon: '🛒', title: t('landing.featBuyersTitle'), desc: t('landing.featBuyersDesc') },
                { icon: '🧑‍💼', title: t('landing.featAdminsTitle'), desc: t('landing.featAdminsDesc') },
                { icon: '🤖', title: t('landing.featAITitle'), desc: t('landing.featAIDesc') },
                { icon: '💬', title: t('landing.featRealtimeTitle'), desc: t('landing.featRealtimeDesc') },
                { icon: '🌍', title: t('landing.featLangTitle'), desc: t('landing.featLangDesc') },
              ].map((feat, idx) => (
                <div key={idx} className="relative pl-16 group hover:bg-green-50/50 p-6 rounded-2xl transition-colors duration-300">
                  <div className="absolute left-6 top-6 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl group-hover:scale-110 transition-transform duration-300">
                    {feat.icon}
                  </div>
                  <div className="text-base font-semibold leading-7 text-gray-900 mb-2">
                    {feat.title}
                  </div>
                  <div className="text-base leading-7 text-gray-600">
                    {feat.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Profile/Roles Section as CTA */}
      <section id="roles" className="py-16 sm:py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1625246333195-bf8f76f4028?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-12">{t('landing.profileTitle')}</h2>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16 text-left">
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="text-4xl mb-4">👨‍🌾</div>
              <h3 className="text-xl font-semibold mb-2 text-green-300">Farmers</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{t('landing.profileFarmers')}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="text-4xl mb-4">🛒</div>
              <h3 className="text-xl font-semibold mb-2 text-blue-300">Buyers</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{t('landing.profileBuyers')}</p>
            </div>
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 hover:bg-white/10 transition-colors">
              <div className="text-4xl mb-4">🧑‍💼</div>
              <h3 className="text-xl font-semibold mb-2 text-purple-300">Admins</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{t('landing.profileAdmins')}</p>
            </div>
          </div>

          <div className="inline-flex flex-col items-center">
            <p className="text-lg text-gray-300 mb-8 max-w-2xl">{t('landing.profileCta')}</p>
            <button
              onClick={() => nav('/register')}
              className="rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-gray-900 shadow-xl hover:bg-gray-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white transition-all hover:scale-105 active:scale-95"
            >
              {t('app.getStarted')}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Start
