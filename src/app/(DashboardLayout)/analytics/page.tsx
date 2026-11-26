'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { ApexOptions } from 'apexcharts'
import { AdminShell, PageLoader } from '@/components/admin/shell'
import { Dot, ErrorBanner } from '@/components/admin/ui'
import { api, fmtUsd } from '@/lib/admin-api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { BarChart3, Facebook, Music2 } from 'lucide-react'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

/* ── Types ──────────────────────────────────────────────────────────── */

type AdRow = {
  date?: string
  name?: string
  earnings: number
  pageViews?: number
  impressions: number
  clicks: number
}
type AdTotals = {
  earnings: number
  pageViews: number
  impressions: number
  clicks: number
  rpm: number
  ctr: number
}
type AdSenseData = {
  ok: boolean
  connected: boolean
  error?: string
  currency?: string
  label?: string
  accountName?: string
  totals?: AdTotals
  series?: AdRow[]
  topUnits?: AdRow[]
  topCountries?: AdRow[]
  platforms?: AdRow[]
}
type Pt = { date: string; value: number }
type MetaData = {
  ok: boolean
  connected: boolean
  error?: string
  page?: any
  range?: string
  series?: { views?: Pt[]; engagedUsers?: Pt[]; fans?: Pt[] }
}
type TiktokData = {
  eventsApiReady?: boolean
  app?: { clientKeyMasked?: string }
  config?: { pixelId?: string; testEventCode?: string }
}

const fmtNum = (n: number | undefined | null) =>
  typeof n === 'number' && isFinite(n) ? n.toLocaleString('en-US') : '—'

const CHART_COLORS = {
  primary: '#5d87ff',
  secondary: '#49beff',
  success: '#26b49a',
  warning: '#f2a53c',
  error: '#fa696b',
}

const baseOptions = (id: string): ApexOptions => ({
  chart: {
    id,
    fontFamily: 'inherit',
    foreColor: '#adb0bb',
    toolbar: { show: false },
    zoom: { enabled: false },
  },
  dataLabels: { enabled: false },
  grid: {
    yaxis: { lines: { show: true } },
    xaxis: { lines: { show: false } },
    borderColor: 'rgba(160,170,190,0.25)',
  },
  tooltip: { theme: 'dark' },
  legend: { show: true, fontSize: '11px' },
})

const dayLabel = (iso: string) => {
  const d = new Date(iso + 'T00:00:00Z')
  if (isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

/* ── AdminLTE-style KPI box ─────────────────────────────────────────── */

function KpiBox({
  label,
  value,
  sub,
  tone,
}: {
  label: string
  value: string
  sub?: string
  tone: string
}) {
  return (
    <div className={`rounded-xl px-5 py-4 text-white shadow-sm ${tone}`}>
      <p className="text-[11px] font-semibold uppercase tracking-wider opacity-85">{label}</p>
      <p className="mt-1 text-2xl font-bold leading-tight">{value}</p>
      {sub ? <p className="mt-0.5 text-[11px] opacity-85">{sub}</p> : null}
    </div>
  )
}

function RangePick({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { v: string; label: string }[]
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-40 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((r) => (
          <SelectItem key={r.v} value={r.v} className="text-xs">
            {r.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/* ── AdSense section ───────────────────────────────────────────────── */

const AD_RANGES = [
  { v: 'today', label: 'Today' },
  { v: 'yesterday', label: 'Yesterday' },
  { v: '7', label: 'Last 7 days' },
  { v: '28', label: 'Last 28 days' },
  { v: 'mtd', label: 'Month to date' },
]

function AdSenseSection() {
  const [range, setRange] = useState('7')
  const [data, setData] = useState<AdSenseData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (r: string) => {
      setLoading(true)
      try {
        const res = await api<AdSenseData>('/api/admin/adsense/analytics?range=' + r)
        setData(res)
      } catch (err: any) {
        toast.error('AdSense analytics: ' + (err?.message || 'load failed'))
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    load(range)
  }, [range, load])

  const t = data?.totals
  const series = data?.series || []
  const connected = !!(data && data.ok !== false && data.connected !== false)

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Dot ok={connected ? true : null} />
          <CardTitle className="text-sm text-foreground">
            AdSense revenue analytics
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          {data?.accountName ? (
            <span className="font-mono text-[11px] text-muted-foreground">{data.accountName}</span>
          ) : null}
          <RangePick value={range} onChange={setRange} options={AD_RANGES} />
          <Button
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground"
            disabled={loading}
            onClick={() => load(range)}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!connected ? (
          <ErrorBanner
            message={
              (data && data.error) ||
              'AdSense API is not connected. Open Integrations and connect with Google (or paste a refresh token) to enable revenue analytics.'
            }
          />
        ) : null}

        {connected && t ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiBox
                label="Est. earnings"
                value={fmtUsd(t.earnings)}
                sub={`Page RPM ${fmtUsd(t.rpm)} · CTR ${(t.ctr || 0).toFixed(2)}%`}
                tone="bg-primary"
              />
              <KpiBox
                label="Page views"
                value={fmtNum(t.pageViews)}
                sub={data?.label || range}
                tone="bg-success"
              />
              <KpiBox
                label="Ad impressions"
                value={fmtNum(t.impressions)}
                sub={`currency ${data?.currency || 'USD'}`}
                tone="bg-warning"
              />
              <KpiBox
                label="Ad clicks"
                value={fmtNum(t.clicks)}
                sub={`${series.length} day(s) in range`}
                tone="bg-error"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <p className="mb-2 text-xs font-semibold text-foreground/90">
                  Daily estimated earnings
                </p>
                <Chart
                  type="area"
                  height={260}
                  options={{
                    ...baseOptions('adsense-earnings'),
                    colors: [CHART_COLORS.primary],
                    fill: {
                      type: 'gradient',
                      gradient: { shadeIntensity: 0.5, opacityFrom: 0.45, opacityTo: 0.06 },
                    },
                    stroke: { curve: 'smooth', width: 2 },
                    xaxis: {
                      categories: series.map((r) => dayLabel(r.date || '')),
                      axisBorder: { show: false },
                      axisTicks: { show: false },
                      labels: {
                        show: true,
                        style: { fontSize: '10px' },
                        hideOverlappingLabels: true,
                      },
                    },
                    yaxis: {
                      labels: {
                        formatter: (v: number) => '$' + v.toFixed(2),
                        style: { fontSize: '10px' },
                      },
                    },
                  }}
                  series={[
                    {
                      name: 'Earnings',
                      data: series.map((r) => Number(r.earnings.toFixed(2))),
                    },
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground/90">
                  Earnings by platform
                </p>
                {(data?.platforms || []).length ? (
                  <Chart
                    type="donut"
                    height={260}
                    options={{
                      ...baseOptions('adsense-platforms'),
                      labels: (data?.platforms || []).map((r) => r.name || '—'),
                      colors: [
                        CHART_COLORS.primary,
                        CHART_COLORS.secondary,
                        CHART_COLORS.success,
                        CHART_COLORS.warning,
                        CHART_COLORS.error,
                        '#8f6fe8',
                      ],
                      legend: { position: 'bottom', fontSize: '11px' },
                      tooltip: { theme: 'dark' },
                    }}
                    series={(data?.platforms || []).map((r) => Number(r.earnings.toFixed(2)))}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">No platform data in range.</p>
                )}
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground/90">
                  Top countries by earnings
                </p>
                {(data?.topCountries || []).length ? (
                  <Chart
                    type="bar"
                    height={300}
                    options={{
                      ...baseOptions('adsense-countries'),
                      colors: [CHART_COLORS.secondary],
                      plotOptions: {
                        bar: { horizontal: true, borderRadius: 4, barHeight: '55%' },
                      },
                      xaxis: {
                        categories: (data?.topCountries || []).map((r) => r.name || '—'),
                        labels: { formatter: (v: string) => '$' + Number(v).toFixed(2), style: { fontSize: '10px' } },
                      },
                      yaxis: { labels: { style: { fontSize: '10px' } } },
                    }}
                    series={[
                      {
                        name: 'Earnings',
                        data: (data?.topCountries || []).map((r) =>
                          Number(r.earnings.toFixed(2))
                        ),
                      },
                    ]}
                  />
                ) : (
                  <p className="text-xs text-muted-foreground">No country data in range.</p>
                )}
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold text-foreground/90">
                  Top ad units
                </p>
                {(data?.topUnits || []).length ? (
                  <ul className="space-y-2">
                    {(data?.topUnits || []).slice(0, 8).map((r, i) => (
                      <li
                        key={i}
                        className="flex items-center justify-between rounded-md border border-border bg-muted/40 px-3 py-2 text-xs"
                      >
                        <span className="truncate text-foreground/90">{r.name || '—'}</span>
                        <span className="ml-3 shrink-0 font-mono text-muted-foreground">
                          {fmtUsd(r.earnings)} · {fmtNum(r.impressions)} imp · {fmtNum(r.clicks)} clk
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">No ad-unit data in range.</p>
                )}
              </div>
            </div>
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

/* ── Meta (Facebook) section ───────────────────────────────────────── */

const META_RANGES = [
  { v: '7', label: 'Last 7 days' },
  { v: '30', label: 'Last 30 days' },
]

function MetaSection() {
  const [range, setRange] = useState('30')
  const [data, setData] = useState<MetaData | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(
    async (r: string) => {
      setLoading(true)
      try {
        const res = await api<MetaData>('/api/admin/meta/analytics?range=' + r)
        setData(res)
      } catch (err: any) {
        toast.error('Meta analytics: ' + (err?.message || 'load failed'))
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    load(range)
  }, [range, load])

  const views = data?.series?.views || []
  const engaged = data?.series?.engagedUsers || []
  const fans = data?.series?.fans || []
  const totalViews = views.reduce((s, p) => s + p.value, 0)
  const totalEngaged = engaged.reduce((s, p) => s + p.value, 0)
  const page = data?.page || {}
  const connected = !!(data && data.connected)

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="flex flex-col gap-2 pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Dot ok={connected ? true : null} />
          <CardTitle className="flex items-center gap-2 text-sm text-foreground">
            <Facebook className="h-4 w-4 text-primary" />
            Meta (Facebook) Page analytics
          </CardTitle>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <RangePick value={range} onChange={setRange} options={META_RANGES} />
          <Button
            size="sm"
            variant="outline"
            className="border-border text-muted-foreground"
            disabled={loading}
            onClick={() => load(range)}
          >
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!connected ? (
          <ErrorBanner
            message={
              (data && data.error) ||
              'Facebook Page session is not available. Reconnect the Page in Integrations to enable Page analytics.'
            }
          />
        ) : null}

        {connected ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <KpiBox
                label="Followers"
                value={fmtNum(page.followers_count ?? page.fan_count)}
                sub={page.category || 'Facebook Page'}
                tone="bg-primary"
              />
              <KpiBox
                label="Page views"
                value={fmtNum(totalViews)}
                sub={`${views.length} day(s) in range`}
                tone="bg-success"
              />
              <KpiBox
                label="Engaged users"
                value={fmtNum(totalEngaged)}
                sub="daily engaged users"
                tone="bg-warning"
              />
              <KpiBox
                label="Page"
                value={String(page.name || '—').slice(0, 18)}
                sub={page.link || ''}
                tone="bg-secondary"
              />
            </div>

            {views.length || engaged.length ? (
              <Chart
                type="line"
                height={250}
                options={{
                  ...baseOptions('meta-insights'),
                  colors: [CHART_COLORS.secondary, CHART_COLORS.warning],
                  stroke: { curve: 'smooth', width: 2 },
                  xaxis: {
                    categories: views.length ? views.map((p) => dayLabel(p.date)) : engaged.map((p) => dayLabel(p.date)),
                    axisBorder: { show: false },
                    axisTicks: { show: false },
                    labels: { show: true, style: { fontSize: '10px' }, hideOverlappingLabels: true },
                  },
                  yaxis: { labels: { style: { fontSize: '10px' } } },
                }}
                series={[
                  ...(views.length
                    ? [{ name: 'Page views', data: views.map((p) => p.value) }]
                    : []),
                  ...(engaged.length
                    ? [{ name: 'Engaged users', data: engaged.map((p) => p.value) }]
                    : []),
                ]}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                No daily insight metrics returned for this Page (the Page token may lack
                read_engagement, or the Page has no traffic yet).
              </p>
            )}

            {fans.length ? (
              <p className="text-[11px] text-muted-foreground">
                Total page fans (latest): {fmtNum(fans[fans.length - 1]?.value)} as of{' '}
                {dayLabel(fans[fans.length - 1]?.date || '')}
              </p>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  )
}

/* ── TikTok section ────────────────────────────────────────────────── */

function TikTokSection() {
  const [data, setData] = useState<TiktokData | null>(null)

  useEffect(() => {
    (async () => {
      try {
        setData(await api<TiktokData>('/api/admin/tiktok/status'))
      } catch (err: any) {
        toast.error('TikTok status: ' + (err?.message || 'load failed'))
      }
    })()
  }, [])

  const ready = !!data?.eventsApiReady
  const pixelId = data?.config?.pixelId || ''

  return (
    <Card className="border-border/70 bg-card/80">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Dot ok={ready ? true : null} />
          <CardTitle className="flex items-center gap-2 text-sm text-foreground">
            <Music2 className="h-4 w-4 text-error" />
            TikTok Events API
          </CardTitle>
          <span className="ml-auto font-mono text-[11px] text-muted-foreground">
            {data?.app?.clientKeyMasked || 'app key not set'}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-3 text-xs">
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-muted-foreground">Events API</p>
            <p className="mt-1 font-semibold text-foreground/90">
              {ready ? 'Ready (pixel + token saved)' : 'Awaiting pixel + token'}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-muted-foreground">Pixel code</p>
            <p className="mt-1 font-mono font-semibold text-foreground/90">
              {pixelId ? pixelId : 'not set'}
            </p>
          </div>
          <div className="rounded-lg border border-border bg-muted/40 p-3">
            <p className="text-muted-foreground">Browser pixel embed</p>
            <p className="mt-1 font-semibold text-foreground/90">
              {pixelId ? 'Live on storefront (ttq)' : 'Embeds automatically once pixel is saved'}
            </p>
          </div>
        </div>
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Save the TikTok pixel code and Events API access token in Integrations → TikTok. The
          browser pixel then loads on every storefront page and lead events flow to the Events API
          server-side.
        </p>
      </CardContent>
    </Card>
  )
}

/* ── Page ──────────────────────────────────────────────────────────── */

function AnalyticsInner() {
  const [ready, setReady] = useState(false)
  useEffect(() => setReady(true), [])
  if (!ready) return <PageLoader />
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-4 py-3">
        <BarChart3 className="h-4 w-4 text-primary" />
        <p className="text-xs text-muted-foreground">
          Storefront marketing analytics — AdSense revenue, Meta/Facebook Page insights and TikTok
          Events API. Pixels for Meta and TikTok are embedded on every storefront page from the
          Integrations configuration.
        </p>
      </div>
      <AdSenseSection />
      <MetaSection />
      <TikTokSection />
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <AdminShell title="Analytics">
      <AnalyticsInner />
    </AdminShell>
  )
}
