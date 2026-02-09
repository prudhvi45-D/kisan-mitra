import React, { useEffect, useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'
import chatBg from '../assets/chat-bg.svg'

interface Listing { _id: string; title: string; cropType: string; quantity: number; unit: string; location?: string; status: 'available' | 'sold' | 'hidden'; suggestedPrice?: number; images?: string[] }

const Row: React.FC<{ item: Listing; onChanged: () => void }> = ({ item, onChanged }) => {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(item.title)
  const [quantity, setQuantity] = useState<number>(item.quantity)
  const [unit, setUnit] = useState(item.unit)
  const [location, setLocation] = useState(item.location || '')
  const [status, setStatus] = useState<Listing['status']>(item.status)
  const { t } = useTranslation()
  const save = async () => {
    await API.put(`/listings/${item._id}`, { title, quantity, unit, location, status })
    setEditing(false)
    onChanged()
  }
  const markSold = async () => { await API.post(`/listings/${item._id}/sold`); onChanged() }
  const del = async () => { await API.delete(`/listings/${item._id}`); onChanged() }
  return (
    <div className="border rounded p-3 flex flex-col gap-2">
      {editing ? (
        <>
          <input className="border rounded px-2 py-1" value={title} onChange={e => setTitle(e.target.value)} />
          <div className="flex gap-2">
            <input type="number" className="border rounded px-2 py-1 w-32" value={quantity} onChange={e => setQuantity(Number(e.target.value))} />
            <input className="border rounded px-2 py-1 w-24" value={unit} onChange={e => setUnit(e.target.value)} />
            <input className="border rounded px-2 py-1 flex-1" placeholder={t('app.location') || 'Location'} value={location} onChange={e => setLocation(e.target.value)} />
            <select className="border rounded px-2 py-1" value={status} onChange={e => setStatus(e.target.value as any)}>
              <option value="available">{t('app.available')}</option>
              <option value="sold">{t('app.sold')}</option>
              <option value="hidden">{t('app.hidden')}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-primary-600 text-white" onClick={save}>{t('app.save')}</button>
            <button className="px-3 py-1 rounded bg-gray-200" onClick={() => setEditing(false)}>{t('app.cancel')}</button>
          </div>
        </>
      ) : (
        <>
          <div className="font-semibold">{item.title}</div>
          <div className="text-sm text-gray-600">{item.cropType} • {item.quantity} {item.unit} • {item.location || '-'}</div>
          <div className="text-sm">{t('app.status')}: <span className="font-medium">{item.status}</span>{item.suggestedPrice != null && <> • {t('app.suggested')} ₹ {item.suggestedPrice}</>}</div>
          {item.images?.[0] && <img src={`http://127.0.0.1:4000${item.images[0]}`} className="mt-1 w-full h-36 object-cover rounded" />}
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 rounded bg-gray-200" onClick={() => setEditing(true)}>{t('app.edit')}</button>
            {item.status !== 'sold' && <button className="px-3 py-1 rounded bg-amber-500 text-white" onClick={markSold}>{t('app.markSold')}</button>}
            <button className="px-3 py-1 rounded bg-red-600 text-white" onClick={del}>{t('app.delete')}</button>
          </div>
        </>
      )}
    </div>
  )
}

const MyListings: React.FC = () => {
  const [items, setItems] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()
  const load = () => {
    setLoading(true)
    API.get('/my/listings').then(({ data }) => setItems(data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])
  return (
    <div
      className="fixed inset-0 pt-16 bg-green-50 flex justify-center overflow-auto"
      style={{ backgroundImage: `url(${chatBg})`, backgroundSize: '120px 120px', backgroundBlendMode: 'overlay' }}
    >
      <div className="w-full max-w-5xl p-6 mb-10 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-green-100 text-green-700 flex items-center justify-center text-xl shadow-sm">
            📋
          </div>
          <h2 className="text-2xl font-bold text-green-900">{t('app.myListings')}</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="animate-spin text-4xl">🪴</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(it => <Row key={it._id} item={it} onChanged={load} />)}
            {items.length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-500 bg-white/50 backdrop-blur rounded-3xl border border-dashed border-gray-300">
                <div className="text-4xl mb-4">🍂</div>
                <div className="font-medium">{t('app.noListingsYet')}</div>
                <div className="text-sm mt-2 opacity-70">Start uploading your harvest to see it here!</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyListings

