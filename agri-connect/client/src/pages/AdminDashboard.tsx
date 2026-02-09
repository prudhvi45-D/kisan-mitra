import React, { useEffect, useState } from 'react'
import API from '../api'
import { useTranslation } from 'react-i18next'

type Summary = {
  users: { total: number; farmers: number; buyers: number }
  listings: { total: number; sold: number }
  topRatedFarmers: Array<{ _id: string; name: string; ratingAverage: number; ratingCount: number }>
  charts: { revenueDaily: any[]; revenueWeekly: any[]; revenueMonthly: any[] }
}

const StatCard: React.FC<{ title: string; value: string|number }> = ({ title, value }) => (
  <div className="border rounded p-4 bg-white">
    <div className="text-sm text-gray-500">{title}</div>
    <div className="text-2xl font-semibold">{value}</div>
  </div>
)

const AdminDashboard: React.FC = () => {
  const [data, setData] = useState<Summary | null>(null)
  const [loading, setLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    API.get('/admin/analytics/summary').then(({ data }) => setData(data)).finally(()=>setLoading(false))
  }, [])

  if (loading) return <div className="p-4">{t('app.loading')}</div>
  if (!data) return <div className="p-4">{t('app.noData')}</div>

  return (
    <div className="p-4 space-y-6">
      <h2 className="text-xl font-semibold">{t('app.adminDashboard')}</h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title={t('app.totalUsers')} value={data.users.total} />
        <StatCard title={t('app.farmers')} value={data.users.farmers} />
        <StatCard title={t('app.buyers')} value={data.users.buyers} />
        <StatCard title={t('app.listingsTotal')} value={data.listings.total} />
        <StatCard title={t('app.listingsSold')} value={data.listings.sold} />
      </div>

      <div>
        <h3 className="font-medium mb-2">{t('app.topRatedFarmers')}</h3>
        <div className="overflow-auto border rounded">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-2">{t('app.nameHeader')}</th>
                <th className="text-left p-2">{t('app.avgRating')}</th>
                <th className="text-left p-2">{t('app.ratings')}</th>
              </tr>
            </thead>
            <tbody>
              {data.topRatedFarmers.map(f => (
                <tr key={f._id} className="border-t">
                  <td className="p-2">{f.name}</td>
                  <td className="p-2">{f.ratingAverage.toFixed(1)}</td>
                  <td className="p-2">{f.ratingCount}</td>
                </tr>
              ))}
              {data.topRatedFarmers.length === 0 && (
                <tr><td className="p-2" colSpan={3}>{t('app.noData')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      
    </div>
  )
}

export default AdminDashboard
