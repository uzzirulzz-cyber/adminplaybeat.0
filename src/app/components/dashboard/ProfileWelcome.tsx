import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { fmtDate } from '@/lib/admin-api'
import type { Stats } from './types'

const ProfileWelcome = ({ stats }: { stats: Stats | null }) => {
  const d = stats?.digital
  return (
    <div className='relative flex items-center justify-between bg-lightsecondary rounded-lg p-6'>
      <div className='flex items-center gap-3'>
        <div>
          <Image
            src='/images/dashboard/customer-support-img.png'
            alt='admin'
            width={72}
            height={72}
            className='rounded-full'
          />
        </div>
        <div className='flex flex-col gap-0.5'>
          <h5 className='card-title'>Welcome back, Administrator</h5>
          <p className='text-sm text-muted-foreground'>
            Storefront sales, catalog health and campaign integrations at a glance.
          </p>
          <div className='mt-2 flex flex-wrap gap-2'>
            <Button asChild className='h-8 rounded-md text-[13px]'>
              <a href='https://playbeat.digital/' target='_blank' rel='noopener noreferrer'>
                View storefront
              </a>
            </Button>
            {stats?.generatedAt ? (
              <span className='inline-flex h-8 items-center rounded-md border border-primary/40 bg-white/60 px-3 text-[13px] text-primary'>
                Sync generated {fmtDate(stats.generatedAt)}
              </span>
            ) : null}
          </div>
        </div>
      </div>
      <div className='hidden lg:flex shrink-0 items-center gap-6 pr-4'>
        <div className='text-right'>
          <p className='text-xs text-muted-foreground'>Catalog snapshot</p>
          <p className='text-xl font-bold text-foreground'>
            {(d?.totalProducts ?? 0).toLocaleString()} products · {stats?.services?.total ?? 0} services
          </p>
          <p className='text-xs text-muted-foreground'>
            {stats?.liveTv?.channels ?? 0} TV channels · {stats?.liveTv?.plans ?? 0} plans ·{' '}
            {stats?.crm?.total ?? 0} leads
          </p>
        </div>
      </div>
    </div>
  )
}

export default ProfileWelcome
