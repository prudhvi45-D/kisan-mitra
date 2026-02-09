import React from 'react'
import { Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageToggle from './components/LanguageToggle'
import { AuthProvider, useAuth } from './auth'
import Login from './pages/Login'
import GetStarted from './pages/GetStarted'
import Start from './pages/Start'
import Register from './pages/Register'
import Listings from './pages/Listings'
import Upload from './pages/Upload'
import Quality from './pages/Quality'
import Profile from './pages/Profile'
import MyListings from './pages/MyListings'
import Chat from './pages/Chat'
import { SocketProvider, useSocketCtx } from './socket'
import AdminDashboard from './pages/AdminDashboard'
import AssistantWidget from './components/AssistantWidget'
import AdminCropPrices from './pages/AdminCropPrices'
import Logo from './assets/logo.svg?url'

const Nav: React.FC = () => {
  const { t } = useTranslation()
  const { role, logout } = useAuth()
  const nav = useNavigate()
  const { lastMsg, unreadCount, resetUnread } = useSocketCtx()
  const loc = useLocation()
  const onStart = loc.pathname === '/start'
  const linkCls = (path: string) => loc.pathname.startsWith(path)
    ? 'text-green-700 font-medium border-b-2 border-green-600'
    : 'text-gray-700 hover:text-green-700 hover:border-green-300 border-b-2 border-transparent'
  return (
    <div
      className={`fixed top-0 left-0 right-0 z-40 ${role ? 'bg-white/90 backdrop-blur border-b border-green-100 shadow-sm' : ''}`}
      style={!role ? { backgroundColor: '#F5FDF6', borderBottom: '1px solid #A5D6A7' } : undefined}
    >
      <div className="w-full h-14 px-6 flex items-center">
        <div className="flex items-center gap-5 flex-1 min-w-0">
          <Link to="/" className="flex items-center gap-2">
            <img src={Logo} alt="Kisan-Mitra" className="h-6 w-6" />
            <span className={`font-semibold tracking-tight ${role ? 'text-green-700' : 'text-green-700'}`}>{t('app.title')}</span>
          </Link>
          {!onStart && role && <Link to="/listings" className={`text-sm transition-colors ${linkCls('/listings')}`}>{t('app.listings')}</Link>}
          {role === 'farmer' && <Link to="/upload" className={`text-sm transition-colors ${linkCls('/upload')}`}>{t('app.upload')}</Link>}
          {role === 'farmer' && <Link to="/my-listings" className={`text-sm transition-colors ${linkCls('/my-listings')}`}>{t('app.myListings')}</Link>}
          {role && role !== 'admin' && <Link to="/quality" className={`text-sm transition-colors ${linkCls('/quality')}`}>{t('app.quality')}</Link>}
          {role === 'admin' && <Link to="/admin/dashboard" className={`text-sm transition-colors ${linkCls('/admin/dashboard')}`}>{t('app.dashboard')}</Link>}
          {role === 'admin' && <Link to="/admin/crop-prices" className={`text-sm transition-colors ${linkCls('/admin/crop-prices')}`}>{t('app.marketPrices')}</Link>}
        </div>
        <div className="flex items-center gap-3 ml-auto">
          {!role && (
            <nav className="hidden sm:flex items-center gap-4 mr-2">
              <a
                href="/"
                onClick={(e) => { e.preventDefault(); window.location.href = '/' }}
                className="text-sm text-gray-700 hover:text-green-700 border-b-2 border-transparent hover:border-green-300"
              >{t('nav.home')}</a>
              <a href="/#about" className="text-sm text-gray-700 hover:text-green-700 border-b-2 border-transparent hover:border-green-300">{t('nav.about')}</a>
              <a href="/#profile" className="text-sm text-gray-700 hover:text-green-700 border-b-2 border-transparent hover:border-green-300">{t('nav.profile')}</a>
            </nav>
          )}
          {role && (
            <Link to="/profile" className="text-sm text-gray-700 hover:text-green-700">{t('app.profile')}</Link>
          )}
          {unreadCount > 0 && (
            <Link
              to={lastMsg ? `/chat?peer=${lastMsg.peer ?? lastMsg.from}` : '/chat'}
              onClick={() => setTimeout(() => resetUnread(), 0)}
              className="text-xs px-2 py-1 rounded-full bg-amber-100 text-amber-700"
            >{unreadCount}</Link>
          )}
          <LanguageToggle />
          {role ? (
            <button onClick={() => { logout(); nav('/start') }} className="text-sm text-gray-700 hover:text-green-700">{t('app.logout')}</button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

const Protected: React.FC<{ children: React.ReactNode, roles?: string[] }> = ({ children, roles }) => {
  const { role, initialized } = useAuth()
  const location = useLocation()
  if (!initialized) return null
  if (!role) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  if (roles && !roles.includes(role)) return <Navigate to="/" replace />
  return <>{children}</>
}

const AppInner: React.FC = () => {
  const { role } = useAuth()
  const { i18n } = useTranslation()
  React.useEffect(() => {
    const saved = localStorage.getItem('locale')
    if (saved && saved !== i18n.language) i18n.changeLanguage(saved)
  }, [i18n])
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <div className="flex-1 pt-14 pb-24">
        <Routes>
          <Route path="/" element={<Start />} />
          <Route path="/start" element={<Start />} />
          <Route path="/register" element={<Register />} />
          <Route path="/listings" element={<Protected><Listings /></Protected>} />
          <Route path="/upload" element={<Protected roles={['farmer']}><Upload /></Protected>} />
          <Route path="/quality" element={<Protected roles={['farmer', 'buyer']}><Quality /></Protected>} />
          <Route path="/my-listings" element={<Protected roles={['farmer']}><MyListings /></Protected>} />
          <Route path="/profile" element={<Protected><Profile /></Protected>} />
          <Route path="/chat" element={<Protected><Chat /></Protected>} />
          <Route path="/admin/dashboard" element={<Protected roles={['admin']}><AdminDashboard /></Protected>} />
          <Route path="/admin/crop-prices" element={<Protected roles={['admin']}><AdminCropPrices /></Protected>} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
      <footer
        className={`${role ? 'bg-white border-t border-green-100 text-gray-700' : ''} fixed bottom-0 left-0 right-0 h-12 z-40`}
        style={!role ? { backgroundColor: '#C8E6C9', color: '#1B4332', borderTop: '1px solid #A5D6A7' } : undefined}
      >
        <div className="w-full h-full px-6 flex items-center justify-between text-sm font-semibold whitespace-nowrap">
          <div className="flex items-center">
            {/* Removed inline widget from footer to avoid duplication */}
          </div>
          <div className="flex items-center gap-10">
            <span className="text-[11px] font-semibold">© 2025 Kisan-Mitra. All rights reserved.</span>
            <span className="text-xs font-semibold mx-1">| Follow us on</span>
            <div className="flex items-center gap-5">
              <a
                href="https://www.linkedin.com/in/sathwik-pedapati/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition font-semibold"
                style={{ color: role ? undefined : '#2E7D32' }}
                onMouseOver={(e) => { if (!role) (e.currentTarget as HTMLAnchorElement).style.color = '#43A047' }}
                onMouseOut={(e) => { if (!role) (e.currentTarget as HTMLAnchorElement).style.color = '#2E7D32' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M20.452 20.452h-3.554v-5.569c0-1.328-.025-3.037-1.852-3.037-1.853 0-2.136 1.448-2.136 2.944v5.662H9.356V9h3.414v1.561h.049c.476-.9 1.637-1.852 3.368-1.852 3.603 0 4.268 2.372 4.268 5.456v6.287zM5.337 7.433a2.063 2.063 0 1 1 0-4.126 2.063 2.063 0 0 1 0 4.126zM3.56 20.452h3.556V9H3.56v11.452z" />
                </svg>
              </a>

              <a
                href="https://x.com/PedapatiSathwik"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 transition font-semibold"
                style={{ color: role ? undefined : '#2E7D32' }}
                onMouseOver={(e) => { if (!role) (e.currentTarget as HTMLAnchorElement).style.color = '#43A047' }}
                onMouseOut={(e) => { if (!role) (e.currentTarget as HTMLAnchorElement).style.color = '#2E7D32' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="w-4 h-4" viewBox="0 0 24 24">
                  <path d="M18.244 3H21l-6.56 7.493L22 21h-6.063l-4.748-5.59L5.7 21H3l7.04-8.03L2 3h6.187l4.311 5.19L18.244 3Zm-1.063 16h1.68L7.9 5h-1.7l11.98 14Z" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating Assistant Widget */}
      {role && <AssistantWidget />}
    </div>
  )
}

const App: React.FC = () => (
  <AuthProvider>
    <SocketProvider>
      <AppInner />
    </SocketProvider>
  </AuthProvider>
)

export default App
