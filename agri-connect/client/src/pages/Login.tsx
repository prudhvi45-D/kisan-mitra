import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'
import { useNavigate, useLocation } from 'react-router-dom'

const Login: React.FC = () => {
  const { t } = useTranslation()
  const { login } = useAuth()
  const nav = useNavigate()
  const location = useLocation() as any
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const role = await login(email, password)
      setMsg('OK')
      const from = location?.state?.from as string | undefined
      if (from) {
        nav(from, { replace: true })
      } else {
        if (role === 'admin') nav('/admin/crop-prices')
        else if (role === 'farmer') nav('/upload')
        else nav('/listings')
      }
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('app.error') || 'Error')
    } finally { setLoading(false) }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5FDF6' }}>
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full border" style={{ borderColor: '#A5D6A7' }}>
        <h1 className="text-3xl font-bold mb-6 text-center" style={{ color: '#2E7D32' }}>
          {t('app.title')}
        </h1>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder={t('app.email')!}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder={t('app.password')!}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            className="w-full font-medium rounded-lg px-4 py-2"
            style={{ backgroundColor: '#2E7D32', color: '#FFFFFF' }}
            onMouseOver={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#43A047' }}
            onMouseOut={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E7D32' }}
            disabled={loading}
            type="submit"
          >
            {loading ? t('app.loading') : t('app.login')}
          </button>
        </form>
        {msg && <p className="mt-3 text-center text-sm text-gray-600">{msg}</p>}
      </div>
    </div>
  )
}

export default Login
