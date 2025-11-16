import React, { useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'

const Upload: React.FC = () => {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<'Vegetables'|'Fruits'>('Vegetables')
  const [cropType, setCropType] = useState('Tomato')
  const [quantity, setQuantity] = useState<number>(0)
  const [files, setFiles] = useState<FileList | null>(null)
  const [msg, setMsg] = useState('')
  const { t } = useTranslation()
  const VEGETABLES = ['Tomato','Potato','Onion','Carrot','Spinach']
  const FRUITS = ['Banana','Apple','Orange','Mango','Grapes']
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
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-3">{t('app.uploadListing')}</h2>
      <form onSubmit={submit} className="space-y-3">
        <input className="w-full border rounded px-3 py-2" placeholder={t('app.titleLabel') || 'Title'} value={title} onChange={e=>setTitle(e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <select className="border rounded px-3 py-2" value={category} onChange={e=>{ const v = e.target.value as 'Vegetables'|'Fruits'; setCategory(v); setCropType((v==='Vegetables'?'Tomato':'Banana')) }}>
            <option value="Vegetables">{t('categories.vegetables')}</option>
            <option value="Fruits">{t('categories.fruits')}</option>
          </select>
          <select className="border rounded px-3 py-2" value={cropType} onChange={e=>setCropType(e.target.value)}>
            {options.map(opt => <option key={opt} value={opt}>{t(`crops.${opt}`)}</option>)}
          </select>
        </div>
        <input type="number" className="w-full border rounded px-3 py-2" placeholder={t('app.quantity') || 'Quantity'} value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />
        <input type="file" className="w-full" multiple onChange={e=>setFiles(e.target.files)} />
        <button className="bg-primary-600 text-white rounded px-4 py-2" type="submit">{t('app.submit')}</button>
      </form>
      {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
    </div>
  )
}
export default Upload

