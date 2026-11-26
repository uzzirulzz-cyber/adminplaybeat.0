'use client'

import CardBox from '../shared/CardBox'
import { Icon } from '@iconify/react/dist/iconify.js'
import { fmtDate } from '@/lib/admin-api'
import type { Mini, Readiness } from './types'

function Dot({ ok, unknown }: { ok: boolean | null | undefined; unknown?: boolean }) {
  const cls = unknown
    ? 'bg-muted-foreground/50'
    : ok
      ? 'bg-success shadow-[0_0_6px_rgba(46,164,79,0.6)]'
      : 'bg-error'
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />
}

function Row({
  name,
  detail,
  ok,
  unknown,
}: {
  name: string
  detail: string
  ok: boolean | null | undefined
  unknown?: boolean
}) {
  return (
    <div className='flex items-center justify-between py-2'>
      <div className='flex items-center gap-2.5'>
        <Dot ok={ok} unknown={unknown} />
        <div>
          <p className='text-sm font-medium text-foreground'>{name}</p>
          <p className='text-xs text-muted-foreground'>{detail}</p>
        </div>
      </div>
      <Icon
        icon='solar:arrow-right-up-linear'
        className='text-lg text-muted-foreground'
      />
    </div>
  )
}

export const IntegrationStatus = ({
  readiness,
  meta,
  tiktok,
  adsense,
}: {
  readiness: Readiness | null
  meta: Mini | null
  tiktok: Mini | null
  adsense: (Mini & { serviceAccount?: { connected?: boolean }; oauth?: { connected?: boolean } }) | null
}) => {
  const ef = readiness?.readiness?.electronicFirst?.configured
  const paypal = readiness?.readiness?.paypal?.configured
  const rapid = readiness?.readiness?.rapidGateway?.configured
  const saOk = adsense?.serviceAccount?.connected ?? adsense?.ok
  const sync = readiness?.syncStatus

  return (
    <CardBox className='h-full'>
      <div className='flex items-center justify-between mb-2'>
        <div>
          <h5 className='card-title'>Integration status</h5>
          <p className='text-sm text-muted-foreground font-normal'>
            Live pipeline health — manage under Integrations
          </p>
        </div>
        <div className='text-white bg-primary rounded-full h-11 w-11 flex items-center justify-center'>
          <Icon icon='solar:link-circle-bold' className='text-xl' />
        </div>
      </div>
      <div className='mt-3 divide-y divide-border'>
        <Row
          name='Google AdSense'
          detail={saOk ? 'Service account connected' : 'Not connected'}
          ok={!!saOk}
        />
        <Row
          name='Meta (CAPI)'
          detail={
            meta?.error
              ? String(meta.error).slice(0, 44)
              : meta?.connected
                ? 'Token valid'
                : 'Token expired / missing'
          }
          ok={!!meta?.connected}
        />
        <Row
          name='TikTok Events API'
          detail={
            tiktok?.eventsApiReady
              ? 'Pixel + token ready'
              : tiktok?.error
                ? String(tiktok.error).slice(0, 44)
                : 'Not linked'
          }
          ok={!!tiktok?.eventsApiReady}
        />
        <Row name='PayPal' detail={paypal ? 'Configured' : 'Manual rail active'} ok={!!paypal} unknown={paypal === undefined} />
        <Row name='Rapid Gateway' detail={rapid ? 'Configured' : 'Manual rail active'} ok={!!rapid} unknown={rapid === undefined} />
        <Row name='ElectronicFirst sync' detail={sync?.syncedAt ? 'Synced ' + fmtDate(sync.syncedAt) : ef ? 'Configured' : 'Snapshot mode'} ok={!!ef} />
      </div>
    </CardBox>
  )
}
