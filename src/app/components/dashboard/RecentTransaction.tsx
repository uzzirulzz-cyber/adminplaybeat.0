import Link from 'next/link'
import CardBox from '../shared/CardBox'
import { fmtDate, fmtUsd } from '@/lib/admin-api'
import type { OrderLite } from './types'

function statusTone(status: string): string {
  const s = String(status || '').toUpperCase()
  if (s.includes('COMPLETE') || s.includes('DELIVER') || s.includes('PAID'))
    return 'border-success'
  if (s.includes('PENDING') || s.includes('AWAITING')) return 'border-warning'
  if (s.includes('CANCEL') || s.includes('FAIL')) return 'border-error'
  return 'border-primary'
}

export const RecentTransaction = ({ latest }: { latest: OrderLite[] }) => {
  const items = (latest || []).slice(0, 6)

  return (
    <CardBox className='h-full w-full'>
      <div className='flex flex-col'>
        <h5 className='card-title'>Recent orders</h5>
        <p className='text-sm text-muted-foreground font-normal'>
          Latest activity across all payment rails
        </p>
      </div>
      <div className='mt-6'>
        {items.length === 0 ? (
          <p className='text-sm text-muted-foreground'>
            No orders yet — manual and storefront orders appear here.
          </p>
        ) : (
          items.map((item, i) => {
            const isLast = i === items.length - 1
            return (
              <div key={item.orderId} className='flex gap-x-3'>
                <div className='w-1/4 text-end'>
                  <span className='font-medium text-foreground dark:text-muted-foreground text-xs'>
                    {fmtDate(item.createdAt).split(',').pop()?.trim() || '—'}
                  </span>
                </div>
                <div
                  className={`relative ${isLast ? 'after:hidden' : ''} after:absolute after:top-7 after:bottom-0 after:start-3.5 after:w-px after:-translate-x-[0.5px] after:bg-border`}
                >
                  <div className='relative z-1 w-7 h-7 flex justify-center items-center'>
                    <div
                      className={`h-3 w-3 rounded-full bg-transparent border-2 ${statusTone(item.status)}`}
                    ></div>
                  </div>
                </div>
                <div className='grow pt-0.5 pb-6'>
                  <p className='font-medium text-sm text-foreground dark:text-muted-foreground'>
                    {item.customerEmail || 'guest'} · {fmtUsd(item.totalUsd)}
                  </p>
                  <div className='flex items-center gap-2'>
                    <Link href='/orders/' className='text-primary text-sm'>
                      {item.orderId}
                    </Link>
                    <span className='text-[10px] uppercase tracking-wide text-muted-foreground'>
                      {item.status}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </CardBox>
  )
}
