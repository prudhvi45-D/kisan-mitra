import React, { useEffect, useMemo, useState } from 'react'
import API from '../api'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'
import StarRating from '../ui/StarRating'

const Listings: React.FC = () => {
  const [items, setItems] = useState<any[]>([])
  const [q, setQ] = useState('')
  const [cropType, setCropType] = useState('')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const { t } = useTranslation()
  const { role } = useAuth()
  const [ratingInputs, setRatingInputs] = useState<Record<string, number>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})
  const [submittedOk, setSubmittedOk] = useState<Record<string, boolean>>({})
  const [submitErr, setSubmitErr] = useState<Record<string, string>>({})

  const params = useMemo(() => {
    const p: any = {}
    if (q) p.q = q
    if (cropType) p.cropType = cropType
    if (minPrice) p.minPrice = minPrice
    if (maxPrice) p.maxPrice = maxPrice
    return p
  }, [q, cropType, minPrice, maxPrice])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await API.get('/listings', { params })
      setItems(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const nav = useNavigate()

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      load()
    }
  }

  return (
    <div className="p-4">

      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {items.map((x) => {
          const topRated = x.farmerId?.ratingAverage >= 3 && x.farmerId?.ratingCount > 0
          return (
            <div
              key={x._id}
              className="border border-green-100 rounded-xl p-4 bg-white cursor-pointer shadow-sm hover:shadow-md transition-shadow"
              onClick={() => {
                const farmerId = x.farmerId?._id || x.farmerId
                const farmerName = x.farmerId?.name || ''
                if (farmerId) {
                  const qs = new URLSearchParams({ peer: farmerId, name: farmerName }).toString()
                  nav(`/chat?${qs}`)
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="font-semibold text-gray-800">{x.title}</div>
                {topRated && <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">{t('app.topRated')}</span>}
              </div>
              <div className="text-sm text-gray-600 mt-0.5">{x.cropType} • {x.quantity} {x.unit}</div>
              {x.suggestedPrice != null && x.quantity > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    ₹ {(x.suggestedPrice / x.quantity).toFixed(2)} / {(x.unit || 'kg')}
                  </span>
                </div>
              )}
              {x.farmerId?.name && (
                <div className="text-xs text-gray-600 mt-1">{t('app.farmer')}: {x.farmerId.name} {x.farmerId?.ratingCount>0 && `(${x.farmerId.ratingAverage.toFixed(1)}★)`}</div>
              )}
              {x.images?.[0] && <img src={`http://127.0.0.1:4000${x.images[0]}`} className="mt-3 w-full h-40 object-cover rounded-lg border border-green-100" />}

              {role === 'buyer' && (
                <div className="mt-3 border-t pt-3" onClick={(e)=>e.stopPropagation()}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">{t('listings.rateHeader')}</div>
                    <div className="text-xs text-gray-500">{t('listings.ratingScale')}</div>
                  </div>
                  <div className="space-y-2">
                    <StarRating
                      value={ratingInputs[x._id] ?? 0}
                      onChange={(v)=>{
                        setRatingInputs(prev=>({ ...prev, [x._id]: v }))
                        setSubmittedOk(prev=>({ ...prev, [x._id]: false }))
                        setSubmitErr(prev=>({ ...prev, [x._id]: '' }))
                      }}
                    />
                    <input
                      className="border rounded px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-primary-300"
                      placeholder={t('listings.commentPlaceholder')}
                      maxLength={200}
                      value={commentInputs[x._id] ?? ''}
                      onChange={(e)=>{
                        setCommentInputs(prev=>({ ...prev, [x._id]: e.target.value }))
                        setSubmittedOk(prev=>({ ...prev, [x._id]: false }))
                        setSubmitErr(prev=>({ ...prev, [x._id]: '' }))
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        className={`rounded px-4 py-2 text-sm text-white ${submitting[x._id] ? 'bg-gray-400' : 'bg-primary-600 hover:bg-primary-700'} disabled:opacity-60`}
                        disabled={!ratingInputs[x._id] || submitting[x._id]}
                        onClick={async ()=>{
                          const rating = ratingInputs[x._id]
                          if (!rating || rating < 1 || rating > 5) return
                          setSubmitting(prev=>({ ...prev, [x._id]: true }))
                          setSubmittedOk(prev=>({ ...prev, [x._id]: false }))
                          setSubmitErr(prev=>({ ...prev, [x._id]: '' }))
                          try {
                            await API.post(`/listings/${x._id}/feedback`, { rating, comment: commentInputs[x._id] || '' })
                            await load()
                            setSubmittedOk(prev=>({ ...prev, [x._id]: true }))
                          } catch (e:any) {
                            setSubmitErr(prev=>({ ...prev, [x._id]: e?.response?.data?.message || 'Failed to submit feedback' }))
                          } finally {
                            setSubmitting(prev=>({ ...prev, [x._id]: false }))
                          }
                        }}
                      >{submitting[x._id] ? t('listings.submitting') : t('listings.submit')}</button>
                      {submittedOk[x._id] && <span className="text-xs text-emerald-600">{t('listings.thanks')}</span>}
                      {submitErr[x._id] && <span className="text-xs text-red-600">{submitErr[x._id] || t('listings.failed')}</span>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
export default Listings

