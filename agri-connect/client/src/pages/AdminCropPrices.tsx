import React, { useEffect, useMemo, useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'

const VEGETABLES = ['Tomato','Potato','Onion','Carrot','Spinach']
const FRUITS = ['Banana','Apple','Orange','Mango','Grapes']

const AdminCropPrices: React.FC = () => {
  const { t } = useTranslation()
  const [category, setCategory] = useState<'Vegetables'|'Fruits'>('Vegetables')
  const [crop, setCrop] = useState<string>('Tomato')
  const [price, setPrice] = useState<number>(0)
  const [items, setItems] = useState<{ name: string; unit: string; price: number }[]>([])
  const [msg, setMsg] = useState('')

  const options = useMemo(() => category === 'Vegetables' ? VEGETABLES : FRUITS, [category])

  useEffect(() => {
    API.get('/admin/market-prices')
      .then(({ data }) => setItems(Array.isArray(data?.items) ? data.items : []))
      .catch(() => setItems([]))
  }, [])

  useEffect(() => {
    if (options.length > 0 && !options.includes(crop)) setCrop(options[0])
  }, [options])

  useEffect(() => {
    const found = items.find(x => (x.name || '').trim().toLowerCase() === (crop || '').trim().toLowerCase())
    setPrice(typeof found?.price === 'number' ? found!.price : 0)
  }, [crop, items])

  const save = async () => {
    const next = (() => {
      const idx = items.findIndex(x => (x.name || '').trim().toLowerCase() === crop.trim().toLowerCase())
      if (idx >= 0) {
        const arr = [...items]
        arr[idx] = { ...arr[idx], name: crop, unit: 'kg', price }
        return arr
      }
      return [...items, { name: crop, unit: 'kg', price }]
    })()
    try {
      const { data } = await API.put('/admin/market-prices', { items: next })
      setItems(Array.isArray(data?.items) ? data.items : next)
      setMsg(t('app.saved') || 'Saved')
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('app.error') || 'Error')
    }
  }

  return (
    <div className="max-w-xl mx-auto p-4 space-y-3">
      <h2 className="text-xl font-semibold">{t('app.adminMarketPricesFull')}</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <select className="border rounded px-2 py-1" value={category} onChange={e=>setCategory(e.target.value as any)}>
          <option value="Vegetables">{t('categories.vegetables')}</option>
          <option value="Fruits">{t('categories.fruits')}</option>
        </select>
        <select className="border rounded px-2 py-1" value={crop} onChange={e=>setCrop(e.target.value)}>
          {options.map(opt => <option key={opt} value={opt}>{t(`crops.${opt}`)}</option>)}
        </select>
        <input type="number" className="border rounded px-2 py-1" placeholder={t('app.price') || 'Price'} value={price} onChange={e=>setPrice(Number(e.target.value))} />
      </div>
      <div>
        <button onClick={save} className="px-3 py-1 rounded bg-primary-600 text-white">{t('app.save')}</button>
      </div>
      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  )
}

export default AdminCropPrices
