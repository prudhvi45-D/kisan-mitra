import React, { useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'
import chatBg from '../assets/chat-bg.svg'

const Quality: React.FC = () => {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const { t } = useTranslation()

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setResult(null)
    setError(null)
    setFile(f || null)
    if (f) {
      const url = URL.createObjectURL(f)
      setPreview(url)
    } else {
      setPreview(null)
    }
  }

  const analyze = async () => {
    if (!file) return
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const form = new FormData()
      form.append('image', file)
      const { data } = await API.post('/quality/analyze', form, { headers: { 'Content-Type': 'multipart/form-data' } })
      setResult(data)
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || t('quality.error'))
    } finally {
      setLoading(false)
    }
  }

  // Normalize arbitrary score values to integer percentages that sum to 100
  const normalizeTo100 = (scores: Record<string, number> | undefined | null) => {
    if (!scores) return {} as Record<string, number>
    const entries = Object.entries(scores)
    const sum = entries.reduce((acc, [, v]) => acc + (typeof v === 'number' ? v : 0), 0)
    if (!sum) return Object.fromEntries(entries.map(([k]) => [k, 0])) as Record<string, number>
    const raw = entries.map(([k, v]) => [k, (v / sum) * 100] as const)
    const rounded = raw.map(([k, v]) => [k, Math.round(v)] as const)
    const diff = 100 - rounded.reduce((acc, [, v]) => acc + v, 0)
    if (diff !== 0) {
      // adjust the one with largest fractional part
      const adjustKey = raw
        .map(([k, v]) => ({ k, frac: v - Math.floor(v) }))
        .sort((a, b) => b.frac - a.frac)[0]?.k
      const adjusted = rounded.map(([k, v]) => [k, k === adjustKey ? v + diff : v] as const)
      return Object.fromEntries(adjusted) as Record<string, number>
    }
    return Object.fromEntries(rounded) as Record<string, number>
  }

  return (
    <div
      className="fixed inset-0 pt-16 bg-green-50 flex justify-center overflow-auto"
      style={{ backgroundImage: `url(${chatBg})`, backgroundSize: '120px 120px', backgroundBlendMode: 'overlay' }}
    >
      <div className="w-full max-w-3xl p-6 mb-10 pb-20">
        {/* Main Glass Card */}
        <div className="bg-white/60 backdrop-blur-md rounded-3xl shadow-xl border border-white/50 p-8">
          <h1 className="text-3xl font-bold text-green-900 mb-2">{t('quality.title')}</h1>
          <p className="text-green-800/60 mb-8 font-medium">Upload an image of your produce to get an instant AI quality assessment.</p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Left Column: Upload & Preview */}
            <div className="space-y-6">
              <div className="relative group">
                <input
                  type="file"
                  accept="image/*"
                  onChange={onFile}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all duration-300 ${file ? 'border-green-400 bg-green-50/50' : 'border-gray-300 hover:border-green-400 hover:bg-white/50'}`}>
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl shadow-sm">
                    📸
                  </div>
                  <div className="font-medium text-gray-700">
                    {file ? file.name : (t('quality.dropHint') || 'Click or Drag to Upload')}
                  </div>
                  <div className="text-xs text-gray-400 mt-2">
                    Supports JPG, PNG, WEBP
                  </div>
                </div>
              </div>

              <button
                type="button"
                disabled={!file || loading}
                onClick={analyze}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold shadow-lg shadow-green-200 hover:shadow-green-300 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:scale-100 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin text-xl">⚪</span> {t('quality.analyzing')}
                  </>
                ) : (
                  <>
                    ⚡ {t('quality.analyze')}
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50/90 border border-red-200 rounded-xl text-red-600 text-sm font-medium flex items-center gap-2">
                  <span>🚫</span> {error}
                </div>
              )}
            </div>

            {/* Right Column: Results & Visualization */}
            <div className="space-y-6">
              {preview ? (
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/40 group">
                    <img src={preview} className="w-full h-64 object-cover" alt="Original" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white font-medium text-sm">{t('quality.original')}</span>
                    </div>
                  </div>
                  {result?.mask_png_base64 && (
                    <div className="relative rounded-2xl overflow-hidden shadow-lg border border-white/40 group">
                      <img src={`data:image/png;base64,${result.mask_png_base64}`} className="w-full h-64 object-cover chat-bg-pattern bg-white" alt="Mask" />
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                        AI Segmentation
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400/50 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                  <span className="text-sm">Preview will appear here</span>
                </div>
              )}
            </div>
          </div>

          {/* Analysis Result Card */}
          {result && (
            <div className="mt-8 pt-8 border-t border-green-100 animation-fade-in-up">
              <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                📊 {t('quality.results')}
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from- emerald-50 to-green-50 border border-emerald-100">
                  <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">{t('quality.finalQuality')}</div>
                  <div className="text-3xl font-extrabold text-emerald-700">{result.final_quality}</div>
                </div>
                {typeof result.suggestedPricePerKg === 'number' && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                    <div className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-1">{t('quality.suggestedPrice')}</div>
                    <div className="text-3xl font-extrabold text-blue-700">₹{result.suggestedPricePerKg}<span className="text-base font-normal text-blue-500">/kg</span></div>
                  </div>
                )}
              </div>

              {result.vit_class && (
                <div className="mt-6">
                  <h4 className="font-semibold text-gray-700 mb-3 text-sm">{t('quality.breakdown')}</h4>
                  <div className="space-y-3">
                    {(() => {
                      const normalized = normalizeTo100(result.final_scores || result.vit_class?.scores)
                      const orderKeys = ['Good/Fresh', 'Rotten/Spoiled', 'Completely Bad/Decomposed'] as const
                      const colors = {
                        'Good/Fresh': 'bg-green-500',
                        'Rotten/Spoiled': 'bg-yellow-500',
                        'Completely Bad/Decomposed': 'bg-red-500'
                      }
                      const labelFor = (key: string) => {
                        switch (key) {
                          case 'Good/Fresh': return t('quality.class.good')
                          case 'Rotten/Spoiled': return t('quality.class.rotten')
                          case 'Completely Bad/Decomposed': return t('quality.class.bad')
                          default: return key
                        }
                      }
                      return orderKeys.map((key) => {
                        const val = normalized[key] ?? 0
                        if (val === 0) return null
                        return (
                          <div key={key}>
                            <div className="flex justify-between text-xs font-medium mb-1">
                              <span className="text-gray-600">{labelFor(key)}</span>
                              <span className="text-gray-900">{val}%</span>
                            </div>
                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full ${colors[key] || 'bg-gray-400'} transition-all duration-500 ease-out`} style={{ width: `${val}%` }}></div>
                            </div>
                          </div>
                        )
                      })
                    })()}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Quality

