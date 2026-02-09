import React, { useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'
import chatBg from '../assets/chat-bg.svg'

const Upload: React.FC = () => {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'Vegetables' | 'Fruits'>('Vegetables')
  const [cropType, setCropType] = useState('Tomato')
  const [quantity, setQuantity] = useState<number>(0)
  const [files, setFiles] = useState<FileList | null>(null)
  const [msg, setMsg] = useState('')
  const { t } = useTranslation()
  const VEGETABLES = ['Tomato', 'Potato', 'Onion', 'Carrot', 'Spinach']
  const FRUITS = ['Banana', 'Apple', 'Orange', 'Mango', 'Grapes']
  const options = category === 'Vegetables' ? VEGETABLES : FRUITS

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    const fd = new FormData()
    fd.append('title', title)
    fd.append('cropType', cropType)
    fd.append('quantity', String(quantity))
    if (files) Array.from(files).forEach(f => fd.append('images', f))
    try {
      const { data } = await API.post('/listings', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setMsg(`${t('app.created') || 'Created'}: ${data._id}`)
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('app.error') || 'Error')
    }
  }

  return (
    <div
      className="fixed inset-0 pt-16 bg-green-50 flex justify-center overflow-auto"
      style={{ backgroundImage: `url(${chatBg})`, backgroundSize: '120px 120px', backgroundBlendMode: 'overlay' }}
    >
      <div className="w-full max-w-2xl p-6 mb-10 pb-24">
        <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl shadow-green-200 shadow-lg">
              📤
            </div>
            <div>
              <h2 className="text-2xl font-bold text-green-900">{t('app.uploadListing')}</h2>
              <p className="text-sm text-green-800/60 font-medium">Share your harvest with buyers instantly.</p>
            </div>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{t('app.titleLabel') || 'Title'}</label>
              <input
                className="w-full bg-white/70 border border-green-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400/50 focus:bg-white transition-all outline-none"
                placeholder="e.g. Fresh Organic Tomatoes"
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{t('categories.category') || 'Category'}</label>
                <select
                  className="w-full bg-white/70 border border-green-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400/50 outline-none appearance-none"
                  value={category}
                  onChange={e => { const v = e.target.value as 'Vegetables' | 'Fruits'; setCategory(v); setCropType((v === 'Vegetables' ? 'Tomato' : 'Banana')) }}
                >
                  <option value="Vegetables">{t('categories.vegetables')}</option>
                  <option value="Fruits">{t('categories.fruits')}</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{t('app.crop') || 'Crop Type'}</label>
                <div className="relative">
                  <select
                    className="w-full bg-white/70 border border-green-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400/50 outline-none appearance-none"
                    value={cropType}
                    onChange={e => setCropType(e.target.value)}
                  >
                    {options.map(opt => <option key={opt} value={opt}>{t(`crops.${opt}`)}</option>)}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-green-600">▼</div>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{t('app.quantity') || 'Quantity (kg)'}</label>
              <input
                type="number"
                className="w-full bg-white/70 border border-green-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-400/50 focus:bg-white transition-all outline-none"
                placeholder="0"
                value={quantity}
                onChange={e => setQuantity(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">{t('app.images') || 'Images'}</label>
              <div className="relative group">
                <input
                  type="file"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  multiple
                  onChange={e => setFiles(e.target.files)}
                />
                <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all bg-white/40 ${files ? 'border-green-500 bg-green-50' : 'border-green-200 hover:border-green-400 hover:bg-green-50/50'}`}>
                  <div className="text-3xl mb-2">{files ? '✅' : '📷'}</div>
                  <div className="text-sm font-medium text-gray-600">
                    {files ? `${files.length} file(s) selected` : 'Click or Drag photos here'}
                  </div>
                </div>
              </div>
            </div>

            <button
              className="w-full py-4 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-lg shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
              type="submit"
            >
              {t('app.submit')}
            </button>
          </form>
          {msg && (
            <div className={`mt-4 p-3 rounded-xl text-center text-sm font-medium ${msg.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {msg}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
export default Upload
