import React, { useEffect, useMemo, useState } from 'react'
import API from '../api'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../auth'
import StarRating from '../ui/StarRating'
import chatBg from '../assets/chat-bg.svg'

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
    <div
      className="fixed inset-0 pt-16 bg-green-50 flex justify-center overflow-auto"
      style={{ backgroundImage: `url(${chatBg})`, backgroundSize: '120px 120px', backgroundBlendMode: 'overlay' }}
    >
      <div className="w-full max-w-7xl p-6 pb-24">

        {/* Modern Search & Filter Bar */}
        <div className="mb-8 bg-white/60 backdrop-blur-md rounded-2xl p-4 shadow-sm border border-white/50 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/70 border border-white/60 focus:ring-2 focus:ring-green-400/50 focus:bg-white transition-colors outline-none text-sm"
              placeholder={t('app.searchPlaceholder') || 'Search for vegetables, fruits...'}
              value={q}
              onChange={e => setQ(e.target.value)}
              onKeyDown={onKeyDown}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <select className="px-3 py-2.5 rounded-xl bg-white/70 border border-white/60 text-sm focus:ring-2 focus:ring-green-400/50 outline-none cursor-pointer" value={cropType} onChange={e => setCropType(e.target.value)}>
              <option value="">{t('app.allCrops') || 'All Crops'}</option>
              <option value="Tomato">{t('crops.Tomato')}</option>
              <option value="Potato">{t('crops.Potato')}</option>
              <option value="Onion">{t('crops.Onion')}</option>
              <option value="Carrot">{t('crops.Carrot')}</option>
              <option value="Banana">{t('crops.Banana')}</option>
              <option value="Apple">{t('crops.Apple')}</option>
            </select>
            <div className="flex items-center bg-white/70 rounded-xl border border-white/60 px-2">
              <span className="text-gray-400 text-xs px-1">₹</span>
              <input className="w-20 py-2.5 bg-transparent text-sm outline-none" placeholder="Min" type="number" value={minPrice} onChange={e => setMinPrice(e.target.value)} />
              <span className="text-gray-300">-</span>
              <input className="w-20 py-2.5 bg-transparent text-sm outline-none text-right" placeholder="Max" type="number" value={maxPrice} onChange={e => setMaxPrice(e.target.value)} />
            </div>
            <button
              onClick={() => load()}
              className="px-6 py-2.5 rounded-xl bg-green-600 text-white font-semibold text-sm shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              {t('app.apply')}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin text-5xl">🚜</div>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((x) => {
              const topRated = x.farmerId?.ratingAverage >= 3 && x.farmerId?.ratingCount > 0
              return (
                <div
                  key={x._id}
                  className="group bg-white/80 backdrop-blur-sm hover:bg-white/95 border border-white/60 rounded-2xl p-4 cursor-pointer shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                  onClick={() => {
                    const farmerId = x.farmerId?._id || x.farmerId
                    const farmerName = x.farmerId?.name || ''
                    if (farmerId) {
                      const qs = new URLSearchParams({ peer: farmerId, name: farmerName }).toString()
                      nav(`/chat?${qs}`)
                    }
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {/* Initials Avatar if no image */}
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                        {(x.farmerId?.name?.[0] || 'F').toUpperCase()}
                      </div>
                      <div className="text-xs">
                        <div className="font-semibold text-gray-900 leading-tight">{x.farmerId?.name}</div>
                        {x.farmerId?.ratingCount > 0 && (
                          <div className="text-yellow-500 text-[10px] font-bold">★ {x.farmerId.ratingAverage.toFixed(1)} <span className="text-gray-400 font-normal">({x.farmerId.ratingCount})</span></div>
                        )}
                      </div>
                    </div>
                    {topRated && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white shadow-sm">{t('app.topRated')}</span>}
                  </div>

                  <div className="relative aspect-[4/3] rounded-xl overflow-hidden mb-3 bg-gray-100">
                    {x.images?.[0] ? (
                      <img src={`http://127.0.0.1:4000${x.images[0]}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="flex items-center justify-center h-full text-4xl opacity-30">🥦</div>
                    )}
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-lg">
                      {x.quantity} {x.unit}
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="font-bold text-gray-800 text-lg leading-tight">{x.title}</div>
                    <div className="text-xs font-medium text-green-600 mt-0.5">{x.cropType}</div>
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                    {x.suggestedPrice != null && x.quantity > 0 ? (
                      <div>
                        <div className="text-[10px] text-gray-500 font-bold uppercase">{t('app.suggested')}</div>
                        <div className="text-lg font-extrabold text-green-700">₹{(x.suggestedPrice / x.quantity).toFixed(0)}<span className="text-sm font-medium text-gray-400">/{x.unit}</span></div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400 italic">Price on request</div>
                    )}
                    <div className="w-10 h-10 rounded-full bg-green-50 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                      💬
                    </div>
                  </div>

                  {role === 'buyer' && (
                    <div className="mt-3 bg-gray-50 rounded-lg p-2" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-[10px] font-bold text-gray-500 uppercase">{t('listings.rateHeader')}</div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-center scale-90 origin-left">
                          <StarRating
                            value={ratingInputs[x._id] ?? 0}
                            onChange={(v) => {
                              setRatingInputs(prev => ({ ...prev, [x._id]: v }))
                              setSubmittedOk(prev => ({ ...prev, [x._id]: false }))
                              setSubmitErr(prev => ({ ...prev, [x._id]: '' }))
                            }}
                          />
                        </div>
                        <div className="flex gap-1">
                          <input
                            className="flex-1 min-w-0 bg-white border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-green-400 outline-none"
                            placeholder={t('listings.commentPlaceholder')}
                            maxLength={200}
                            value={commentInputs[x._id] ?? ''}
                            onChange={(e) => {
                              setCommentInputs(prev => ({ ...prev, [x._id]: e.target.value }))
                              setSubmittedOk(prev => ({ ...prev, [x._id]: false }))
                              setSubmitErr(prev => ({ ...prev, [x._id]: '' }))
                            }}
                          />
                          <button
                            className={`px-3 py-1 text-xs font-bold rounded text-white transition-colors ${submitting[x._id] ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'}`}
                            disabled={!ratingInputs[x._id] || submitting[x._id]}
                            onClick={async () => {
                              const rating = ratingInputs[x._id]
                              if (!rating || rating < 1 || rating > 5) return
                              setSubmitting(prev => ({ ...prev, [x._id]: true }))
                              setSubmittedOk(prev => ({ ...prev, [x._id]: false }))
                              setSubmitErr(prev => ({ ...prev, [x._id]: '' }))
                              try {
                                await API.post(`/listings/${x._id}/feedback`, { rating, comment: commentInputs[x._id] || '' })
                                await load()
                                setSubmittedOk(prev => ({ ...prev, [x._id]: true }))
                              } catch (e: any) {
                                setSubmitErr(prev => ({ ...prev, [x._id]: e?.response?.data?.message || 'Failed' }))
                              } finally {
                                setSubmitting(prev => ({ ...prev, [x._id]: false }))
                              }
                            }}
                          >{submitting[x._id] ? '...' : '✓'}</button>
                        </div>
                        {(submittedOk[x._id] || submitErr[x._id]) && (
                          <div className={`text-[10px] ${submittedOk[x._id] ? 'text-green-600' : 'text-red-500'}`}>
                            {submittedOk[x._id] ? t('listings.thanks') : submitErr[x._id]}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
export default Listings
