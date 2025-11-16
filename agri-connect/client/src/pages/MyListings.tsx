import React, { useEffect, useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'

interface Listing { _id: string; title: string; cropType: string; quantity: number; unit: string; location?: string; status: 'available'|'sold'|'hidden'; suggestedPrice?: number; images?: string[] }

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
          <input className="border rounded px-2 py-1" value={title} onChange={e=>setTitle(e.target.value)} />
          <div className="flex gap-2">
            <input type="number" className="border rounded px-2 py-1 w-32" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} />
            <input className="border rounded px-2 py-1 w-24" value={unit} onChange={e=>setUnit(e.target.value)} />
            <input className="border rounded px-2 py-1 flex-1" placeholder={t('app.location') || 'Location'} value={location} onChange={e=>setLocation(e.target.value)} />
            <select className="border rounded px-2 py-1" value={status} onChange={e=>setStatus(e.target.value as any)}>
              <option value="available">{t('app.available')}</option>
              <option value="sold">{t('app.sold')}</option>
              <option value="hidden">{t('app.hidden')}</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 rounded bg-primary-600 text-white" onClick={save}>{t('app.save')}</button>
            <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>setEditing(false)}>{t('app.cancel')}</button>
          </div>
        </>
      ) : (
        <>
          <div className="font-semibold">{item.title}</div>
          <div className="text-sm text-gray-600">{item.cropType} • {item.quantity} {item.unit} • {item.location || '-'}</div>
          <div className="text-sm">{t('app.status')}: <span className="font-medium">{item.status}</span>{item.suggestedPrice != null && <> • {t('app.suggested')} ₹ {item.suggestedPrice}</>}</div>
          {item.images?.[0] && <img src={`http://127.0.0.1:4000${item.images[0]}`} className="mt-1 w-full h-36 object-cover rounded" />}
          <div className="flex gap-2 mt-2">
            <button className="px-3 py-1 rounded bg-gray-200" onClick={()=>setEditing(true)}>{t('app.edit')}</button>
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
    API.get('/my/listings').then(({ data }) => setItems(data)).finally(()=>setLoading(false))
  }
  useEffect(() => { load() }, [])
  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-3">{t('app.myListings')}</h2>
      {loading ? <div>{t('app.loading')}</div> : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
          {items.map(it => <Row key={it._id} item={it} onChanged={load} />)}
          {items.length === 0 && <div className="text-gray-600">{t('app.noListingsYet')}</div>}
        </div>
      )}
    </div>
  )
}

export default MyListings

