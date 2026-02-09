import React, { useEffect, useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'

const Profile: React.FC = () => {
  const { role } = useAuth()
  const { t } = useTranslation()

  // Form State
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [location, setLocation] = useState('')
  const [locale, setLocale] = useState('en')
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  
  // UI State
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<{ type: 'success'|'error', text: string } | null>(null)
  const [pwdMsg, setPwdMsg] = useState<{ type: 'success'|'error', text: string } | null>(null)

  useEffect(() => {
    API.get('/account/me').then(({ data }) => {
      setName(data.name || '')
      setEmail(data.email || '')
      setPhone(data.phone || '')
      setLocation(data.location || '')
      setLocale(data.locale || 'en')
    }).catch(() => {
      // safe fallback
    }).finally(() => setLoading(false))
  }, [])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setMsg(null)
    try {
      await API.put('/account/me', { name, phone, location, locale })
      setMsg({ type: 'success', text: t('app.saved') || 'Profile updated successfully' })
      // Clear success message after 3s
      setTimeout(() => setMsg(null), 3000)
    } catch (e: any) {
      setMsg({ type: 'error', text: e?.response?.data?.message || t('app.error') || 'Failed to update profile' })
    }
  }

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setPwdMsg(null)
    try {
      await API.post('/account/change-password', { currentPassword, newPassword })
      setPwdMsg({ type: 'success', text: t('app.updatePassword') || 'Password updated successfully' })
      setCurrentPassword('')
      setNewPassword('')
      setTimeout(() => setPwdMsg(null), 3000)
    } catch (e: any) {
      setPwdMsg({ type: 'error', text: e?.response?.data?.message || t('app.error') || 'Failed to update password' })
    }
  }

  const getInitials = (n: string) => {
    return n ? n.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase() : 'U'
  }

  const RoleBadge = ({ role }: { role?: string }) => {
    if (!role) return null;
    const colors = role === 'farmer' 
      ? 'bg-green-100 text-green-800 border-green-200' 
      : role === 'admin' 
        ? 'bg-purple-100 text-purple-800 border-purple-200'
        : 'bg-blue-100 text-blue-800 border-blue-200';
        
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colors} capitalize inline-flex items-center gap-1`}>
        {role === 'farmer' && (
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        )}
        {role === 'buyer' && (
           <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
        )}
        {role}
      </span>
    )
  }

  if (loading) {
     return <div className="flex justify-center items-center h-64 text-gray-500">{t('app.loading')}...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Profile Header Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="h-32 bg-gradient-to-r from-green-500 to-emerald-600 relative">
          <div className="absolute inset-0 bg-black/5"></div>
        </div>
        <div className="px-6 pb-6 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end -mt-12 mb-4 gap-4">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-white shadow-md flex items-center justify-center text-2xl font-bold text-green-700 bg-gradient-to-br from-green-50 to-green-100">
              {getInitials(name)}
            </div>
            <div className="flex-1 pt-2 md:pb-2">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-2xl font-bold text-gray-900">{name || 'User'}</h1>
                <RoleBadge role={role} />
              </div>
              <p className="text-gray-500 text-sm flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  {email}
                </span>
                {location && (
                  <span className="flex items-center gap-1">
                     <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                     {location}
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Personal Details Section */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                {t('app.personalDetails') || 'Personal Details'}
              </h2>
            </div>
            
            <form onSubmit={save} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.name')}</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
                    value={name} 
                    onChange={e=>setName(e.target.value)}
                    placeholder="Your Name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.phone')}</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
                    value={phone} 
                    onChange={e=>setPhone(e.target.value)} 
                    placeholder="+91 98765 43210"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.location')}</label>
                  <input 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none" 
                    value={location} 
                    onChange={e=>setLocation(e.target.value)} 
                    placeholder="City, State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.language')}</label>
                  <select 
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none bg-white" 
                    value={locale} 
                    onChange={e=>setLocale(e.target.value)}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                    <option value="te">తెలుగు</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-1">{t('app.email')}</label>
                   <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                      </div>
                      <input className="w-full border border-gray-200 bg-gray-50 text-gray-500 rounded-lg pl-9 pr-3 py-2 cursor-not-allowed" value={email} disabled />
                   </div>
                   <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between">
                 {msg && (
                    <div className={`text-sm px-3 py-1.5 rounded-lg flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                       <span className={`w-2 h-2 rounded-full ${msg.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                       {msg.text}
                    </div>
                 )}
                 {!msg && <div></div>} {/* Spacer */}
                 <button className="bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg px-6 py-2 transition-colors shadow-sm focus:ring-2 focus:ring-green-500 focus:ring-offset-1" type="submit">
                    {t('app.saveChanges') || 'Save Changes'}
                 </button>
              </div>
            </form>
          </div>
        </div>

        {/* Security Section */}
        <div className="space-y-6">
           <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                {t('app.security') || 'Security'}
              </h2>
              <form onSubmit={changePassword} className="space-y-3">
                 <div>
                    <input 
                      type="password" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm" 
                      placeholder={t('app.currentPassword') || 'Current password'} 
                      value={currentPassword} 
                      onChange={e=>setCurrentPassword(e.target.value)} 
                    />
                 </div>
                 <div>
                    <input 
                      type="password" 
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none text-sm" 
                      placeholder={t('app.newPassword') || 'New password'} 
                      value={newPassword} 
                      onChange={e=>setNewPassword(e.target.value)} 
                    />
                 </div>
                 
                 <button className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm shadow-sm" type="submit">
                    {t('app.updatePassword')}
                 </button>
                 
                 {pwdMsg && (
                    <div className={`text-sm px-3 py-1.5 rounded-lg text-center ${pwdMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                       {pwdMsg.text}
                    </div>
                 )}
              </form>
           </div>
           
           {/* Account Summary/Stats could go here */}
           <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100 p-4">
              <div className="flex items-start gap-3">
                 <div className="text-green-600 mt-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 </div>
                 <div className="text-sm">
                    <p className="font-medium text-green-900 mb-1">Account Status</p>
                    <p className="text-green-800 opacity-80 leading-relaxed">
                       Your account is <span className="font-semibold">Active</span>. 
                       {role === 'farmer' ? ' You can list crops and connect with buyers.' : ' You can browse listings and contact farmers.'}
                    </p>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

export default Profile

