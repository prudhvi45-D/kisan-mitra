import React, { useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'

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
    <div className="max-w-3xl mx-auto p-4 space-y-4">
      <h1 className="text-xl font-semibold">{t('quality.title')}</h1>
      <div className="flex items-center gap-3">
        <input type="file" accept="image/*" onChange={onFile} />
        <button type="button" disabled={!file || loading} onClick={analyze} className="px-3 py-1 rounded bg-blue-600 text-white disabled:opacity-50">{loading ? t('quality.analyzing') : t('quality.analyze')}</button>
      </div>
      {preview && (
        <div className="flex gap-4">
          <div>
            <div className="text-sm mb-1">{t('quality.original')}</div>
            <img src={preview} className="max-h-64 rounded border" />
          </div>
          {result?.mask_png_base64 && (
            <div>
              <div className="text-sm mb-1">{t('quality.mask')}</div>
              <img src={`data:image/png;base64,${result.mask_png_base64}`} className="max-h-64 rounded border bg-white" />
            </div>
          )}
        </div>
      )}
      {error && <div className="text-red-600 text-sm">{error}</div>}
      {result && (
        <div className="border rounded p-3 space-y-2">
          <div><span className="font-medium">{t('quality.finalQuality')}:</span> {result.final_quality}</div>
          {typeof result.suggestedPricePerKg === 'number' && (
            <div><span className="font-medium">{t('quality.suggestedPrice')}:</span> {result.suggestedPricePerKg}</div>
          )}
          {result.vit_class && (
            <div>
              <div className="font-medium">{t('quality.breakdown')}:</div>
              {(() => {
                const normalized = normalizeTo100(result.vit_class?.scores)
                const orderKeys = [
                  'Good/Fresh',
                  'Rotten/Spoiled',
                  'Completely Bad/Decomposed',
                ] as const
                const labelFor = (key: string) => {
                  switch (key) {
                    case 'Good/Fresh': return t('quality.class.good')
                    case 'Rotten/Spoiled': return t('quality.class.rotten')
                    case 'Completely Bad/Decomposed': return t('quality.class.bad')
                    default: return key
                  }
                }
                return (
                  <ul className="list-disc ml-5 text-sm">
                    {orderKeys.map((key) => (
                      <li key={key}>{labelFor(key)}: {normalized[key] ?? 0}%</li>
                    ))}
                  </ul>
                )
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Quality

