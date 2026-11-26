'use client'

import { useEffect, useMemo, useState } from 'react'
import { ErrorBanner } from '@/components/admin/ui'
import { api, fmtUsd } from '@/lib/admin-api'
import ProfileWelcome from '../components/dashboard/ProfileWelcome'
import { KpiCards } from '../components/dashboard/TopCards'
import { SalesOverview } from '../components/dashboard/SalesOverview'
import { StatusBreakup } from '../components/dashboard/YearlyBreakup'
import { MonthlyEarning } from '../components/dashboard/MonthlyEarning'
import { RecentTransaction } from '../components/dashboard/RecentTransaction'
import { ProductPerformance } from '../components/dashboard/ProductPerformance'
import { IntegrationStatus } from '../components/dashboard/IntegrationStatus'
import { Footer } from '../components/dashboard/Footer'
import {
  Stats,
  Readiness,
  Mini,
  OrderLite,
  DayPoint,
  DAY,
} from '../components/dashboard/types'

const page = () => {
  const [stats, setStats] = useState<Stats | null>(null)
  const [readiness, setReadiness] = useState<Readiness | null>(null)
  const [orders, setOrders] = useState<OrderLite[] | null>(null)
  const [adsense, setAdsense] = useState<any>(null)
  const [tiktok, setTiktok] = useState<Mini | null>(null)
  const [meta, setMeta] = useState<Mini | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      try {
        const [s, r, a, t, m, o] = await Promise.all([
          api<Stats>('/api/admin/stats'),
          api<Readiness>('/api/integrations/readiness'),
          api<any>('/api/admin/adsense/status'),
          api<Mini>('/api/admin/tiktok/status'),
          api<Mini>('/api/admin/meta/overview'),
          api<{ orders: OrderLite[] }>('/api/orders'),
        ])
        setStats(s)
        setReadiness(r)
        setAdsense(a)
        setTiktok(t)
        setMeta(m)
        setOrders(o.orders || [])
      } catch (err: any) {
        setError(err?.message || 'Failed to load dashboard.')
      }
    })()
  }, [])

  const rev = useMemo(() => {
    const list = orders || []
    const now = Date.now()
    const last30 = list.filter(
      (o) => now - new Date(o.createdAt).getTime() <= 30 * DAY
    )
    const totalRev = list.reduce((s, o) => s + (Number(o.totalUsd) || 0), 0)
    const rev30 = last30.reduce((s, o) => s + (Number(o.totalUsd) || 0), 0)
    const pending = list.filter((o) =>
      String(o.status || '').toUpperCase().includes('PENDING')
    )
    const fulfilled = list.filter((o) => {
      const s = String(o.status || '').toUpperCase()
      return s.includes('COMPLETE') || s.includes('DELIVER') || s.includes('PAID')
    })

    const days: DayPoint[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now - i * DAY)
      const key = d.toISOString().slice(0, 10)
      days.push({
        day: key,
        label: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
        usd: 0,
        count: 0,
      })
    }
    const idx = new Map(days.map((d, i) => [d.day, i]))
    for (const o of list) {
      const k = String(o.createdAt || '').slice(0, 10)
      const i = idx.get(k)
      if (i !== undefined) {
        days[i].usd += Number(o.totalUsd) || 0
        days[i].count += 1
      }
    }

    const fulfilledN = fulfilled.length
    const pendingN = pending.length
    const otherN = Math.max(0, list.length - fulfilledN - pendingN)

    const monthKey = new Date().toISOString().slice(0, 7)
    const prev = new Date()
    prev.setMonth(prev.getMonth() - 1)
    const prevKey = prev.toISOString().slice(0, 7)
    const monthRev = list
      .filter((o) => String(o.createdAt || '').slice(0, 7) === monthKey)
      .reduce((s, o) => s + (Number(o.totalUsd) || 0), 0)
    const prevRev = list
      .filter((o) => String(o.createdAt || '').slice(0, 7) === prevKey)
      .reduce((s, o) => s + (Number(o.totalUsd) || 0), 0)

    const latest = [...list]
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 6)

    return {
      list,
      last30,
      rev30,
      totalRev,
      pending,
      days,
      donut: [
        { name: 'Fulfilled', value: fulfilledN },
        { name: 'Pending', value: pendingN },
        { name: 'Other', value: otherN },
      ],
      fulfilledPct: list.length ? Math.round((fulfilledN / list.length) * 100) : 0,
      monthRev,
      monthDelta:
        prevRev > 0 ? Math.round(((monthRev - prevRev) / prevRev) * 100) : null,
      monthShare: totalRev > 0 ? Math.min(100, Math.round((monthRev / totalRev) * 100)) : 0,
      latest,
    }
  }, [orders])

  const d = stats?.digital
  const groups = Object.entries(d?.groups || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)

  return (
    <>
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12'>
          <ErrorBanner message={error} />
        </div>
        <div className='col-span-12'>
          <ProfileWelcome stats={stats} />
        </div>
        <div className='col-span-12'>
          <KpiCards stats={stats} orders={orders || []} />
        </div>
        <div className='lg:col-span-8 col-span-12'>
          <SalesOverview
            days={rev.days}
            rev30={rev.rev30}
            orders30={rev.last30.length}
          />
        </div>
        <div className='lg:col-span-4 col-span-12'>
          <div className='grid grid-cols-12 gap-6'>
            <div className='col-span-12'>
              <StatusBreakup
                donut={rev.donut}
                totalRev={rev.totalRev}
                fulfilledPct={rev.fulfilledPct}
              />
            </div>
            <div className='col-span-12'>
              <MonthlyEarning
                monthRev={rev.monthRev}
                monthDelta={rev.monthDelta}
                monthShare={rev.monthShare}
                days={rev.days}
              />
            </div>
          </div>
        </div>
        <div className='lg:col-span-4 col-span-12'>
          <RecentTransaction latest={rev.latest} />
        </div>
        <div className='lg:col-span-4 col-span-12'>
          <IntegrationStatus
            readiness={readiness}
            meta={meta}
            tiktok={tiktok}
            adsense={adsense}
          />
        </div>
        <div className='lg:col-span-4 col-span-12 flex flex-col justify-between gap-6'>
          <div className='grid grid-cols-2 gap-6'>
            <div className='rounded-lg border border-border bg-card p-4'>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
                All-time revenue
              </p>
              <p className='mt-1 text-xl font-bold text-primary'>{fmtUsd(rev.totalRev)}</p>
            </div>
            <div className='rounded-lg border border-border bg-card p-4'>
              <p className='text-[11px] font-semibold uppercase tracking-wider text-muted-foreground'>
                Avg order value
              </p>
              <p className='mt-1 text-xl font-bold text-success'>
                {fmtUsd(rev.list.length ? rev.totalRev / rev.list.length : 0)}
              </p>
            </div>
          </div>
          <IntegrationFootnote readiness={readiness} />
        </div>
        <div className='lg:col-span-8 col-span-12 flex'>
          <ProductPerformance groups={groups} />
        </div>
        <div className='col-span-12'>
          <Footer />
        </div>
      </div>
    </>
  )
}

function IntegrationFootnote({ readiness }: { readiness: Readiness | null }) {
  const rate = readiness?.readiness?.usdToPkrRate
  const sync = readiness?.syncStatus
  return (
    <div className='rounded-lg bg-lightprimary p-4 text-xs text-muted-foreground'>
      <p>
        USD→PKR rate <span className='font-semibold text-foreground'>{rate ? rate.toFixed(2) : '—'}</span>
        {' · '}Sync source <span className='font-semibold text-foreground'>{sync?.source || '—'}</span>
        {' · '}Synced products <span className='font-semibold text-foreground'>{(sync?.productCount ?? 0).toLocaleString()}</span>
      </p>
      {sync?.message ? (
        <p className='mt-1 line-clamp-2'>{sync.message}</p>
      ) : null}
    </div>
  )
}

export default page
