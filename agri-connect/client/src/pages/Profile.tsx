import React, { useEffect, useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'

const Profile: React.FC = () => {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [locale, setLocale] = useState('en')
  const [msg, setMsg] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [pwdMsg, setPwdMsg] = useState('')
  const { t } = useTranslation()

  useEffect(() => {
    API.get('/account/me').then(({ data }) => {
      setName(data.name || '')
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setLocation(data.location || '')
      setLocale(data.locale || 'en')
    }).catch(() => {})
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await API.put('/account/me', { name, phone, location, locale })
      setMsg(t('app.saved') || 'Saved')
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('app.error') || 'Error')
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await API.post('/account/change-password', { currentPassword, newPassword })
      setPwdMsg(t('app.updatePassword') || 'Update Password')
      setCurrentPassword('')
      setNewPassword('')
    } catch (e: any) {
      setPwdMsg(e?.response?.data?.message || t('app.error') || 'Error')
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-3">{t('app.myProfile')}</h2>
        <form onSubmit={save} className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-sm text-gray-600">{t('app.name')}</label>
              <input className="w-full border rounded px-3 py-2" value={name} onChange={e=>setName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">{t('app.email')}</label>
              <input className="w-full border rounded px-3 py-2 bg-gray-50" value={email} disabled />
            </div>
            <div>
              <label className="text-sm text-gray-600">{t('app.phone')}</label>
              <input className="w-full border rounded px-3 py-2" value={phone} onChange={e=>setPhone(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">{t('app.location')}</label>
              <input className="w-full border rounded px-3 py-2" value={location} onChange={e=>setLocation(e.target.value)} />
            </div>
            <div>
              <label className="text-sm text-gray-600">{t('app.language')}</label>
              <select className="w-full border rounded px-3 py-2" value={locale} onChange={e=>setLocale(e.target.value)}>
                <option value="en">English</option>
                <option value="hi">हिंदी</option>
                <option value="te">తెలుగు</option>
              </select>
            </div>
          </div>
          <button className="bg-primary-600 text-white rounded px-4 py-2" type="submit">{t('app.save')}</button>
          {msg && <span className="ml-2 text-sm text-gray-600">{msg}</span>}
        </form>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-3">{t('app.changePassword')}</h2>
        <form onSubmit={changePassword} className="space-y-3 max-w-md">
          <input type="password" className="w-full border rounded px-3 py-2" placeholder={t('app.currentPassword') || 'Current password'} value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} />
          <input type="password" className="w-full border rounded px-3 py-2" placeholder={t('app.newPassword') || 'New password'} value={newPassword} onChange={e=>setNewPassword(e.target.value)} />
          <button className="bg-primary-600 text-white rounded px-4 py-2" type="submit">{t('app.updatePassword')}</button>
          {pwdMsg && <span className="ml-2 text-sm text-gray-600">{pwdMsg}</span>}
        </form>
      </div>
    </div>
  )
}

export default Profile

