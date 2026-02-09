import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import API from '../api'
import { useTranslation } from 'react-i18next'

const Register: React.FC = () => {
  const nav = useNavigate()
  const { t } = useTranslation()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<'admin' | 'farmer' | 'buyer'>('buyer')
  const [msg, setMsg] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await API.post('/auth/register', { name, email, password, role })
      setMsg(t('app.saved') || 'Saved')
      setTimeout(() => nav('/login'), 800)
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('app.error') || 'Error')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#F5FDF6' }}>
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md w-full border" style={{ borderColor: '#A5D6A7' }}>
        <h2 className="text-2xl font-bold mb-5 text-center" style={{ color: '#2E7D32' }}>
          {t('app.createAccount')}
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <input
            className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder={t('app.name') || 'Name'}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder={t('app.email') || 'Email'}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            placeholder={t('app.password') || 'Password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <select
            className="w-full border border-green-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-300"
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
          >
            <option value="buyer">{t('app.roleBuyer')}</option>
            <option value="farmer">{t('app.roleFarmer')}</option>
            <option value="admin">{t('app.roleAdmin')}</option>
          </select>
          <button
            className="w-full font-medium rounded-full px-4 py-2 transition-all duration-300 shadow-md"
            style={{ backgroundColor: '#2E7D32', color: '#FFFFFF' }}
            onMouseOver={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#43A047' }}
            onMouseOut={(e)=>{ (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#2E7D32' }}
            type="submit"
          >
            {t('app.register')}
          </button>
        </form>
        {msg && <p className="mt-3 text-center text-sm text-gray-600">{msg}</p>}
      </div>
    </div>
  )
}

export default Register
