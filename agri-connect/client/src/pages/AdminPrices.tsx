import React, { useEffect, useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'

const AdminPrices: React.FC = () => {
  const [items, setItems] = useState<{ name: string; unit: string; price: number }[]>([])
  const [msg, setMsg] = useState('')
  const { t } = useTranslation()
  const REQUIRED = ['Good/Fresh', 'Rotten/Spoiled', 'Completely Bad/Decomposed']

  useEffect(() => {
    API.get('/admin/market-prices')
      .then(({ data }) => {
        const fetched: { name: string; unit: string; price: number }[] = data.items || []
        const existingNames = new Set(fetched.map(x => (x.name || '').trim()))
        const ensured = [...fetched]
        for (const req of REQUIRED) {
          if (!existingNames.has(req)) ensured.push({ name: req, unit: 'kg', price: 0 })
        }
        setItems(ensured)
      })
      .catch(() => {
        setItems(REQUIRED.map(name => ({ name, unit: 'kg', price: 0 })))
      })
  }, [])

  const save = async () => {
    try {
      const { data } = await API.put('/admin/market-prices', { items })
      setItems(data.items || [])
      setMsg(t('app.saved') || 'Saved')
    } catch (e: any) {
      setMsg(e?.response?.data?.message || t('app.error') || 'Error')
    }
  }

  const add = () => setItems(prev => [...prev, { name: '', unit: 'kg', price: 0 }])

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-3">{t('app.adminMarketPricesFull')}</h2>
      <div className="mb-4 border rounded p-3">
        <div className="font-medium mb-2">Quality-based prices (per kg)</div>
        <div className="space-y-2">
          {REQUIRED.map((label) => {
            const idx = items.findIndex(x => (x.name || '').trim() === label)
            const it = idx >= 0 ? items[idx] : { name: label, unit: 'kg', price: 0 }
            return (
              <div key={label} className="grid grid-cols-3 gap-2 items-center">
                <div className="col-span-2">
                  <label className="text-sm">{label}</label>
                </div>
                <input
                  type="number"
                  className="border rounded px-2 py-1"
                  value={it.price}
                  onChange={e => {
                    const v = Number(e.target.value)
                    setItems(s => {
                      const arr = [...s]
                      const i = arr.findIndex(x => (x.name || '').trim() === label)
                      if (i >= 0) arr[i] = { ...arr[i], unit: 'kg', price: v }
                      else arr.push({ name: label, unit: 'kg', price: v })
                      return arr
                    })
                  }}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="space-y-2">
        {items.map((it, idx) => (
          <div key={idx} className="grid grid-cols-3 gap-2">
            <input className="border rounded px-2 py-1" placeholder={t('app.name') || 'Name'} value={it.name} onChange={e=>{
              const v = e.target.value; setItems(s=> s.map((x,i)=> i===idx? {...x, name:v}: x))
            }} />
            <input className="border rounded px-2 py-1" placeholder={t('app.unit') || 'Unit'} value={it.unit} onChange={e=>{
              const v = e.target.value; setItems(s=> s.map((x,i)=> i===idx? {...x, unit:v}: x))
            }} />
            <input type="number" className="border rounded px-2 py-1" placeholder={t('app.price') || 'Price'} value={it.price} onChange={e=>{
              const v = Number(e.target.value); setItems(s=> s.map((x,i)=> i===idx? {...x, price:v}: x))
            }} />
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={add} className="px-3 py-1 rounded bg-gray-200">{t('app.add')}</button>
        <button onClick={save} className="px-3 py-1 rounded bg-primary-600 text-white">{t('app.save')}</button>
      </div>
      {msg && <p className="mt-2 text-sm text-gray-600">{msg}</p>}
    </div>
  )
}
export default AdminPrices

