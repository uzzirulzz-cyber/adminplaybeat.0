'use client'
import dynamic from 'next/dynamic'
import { Icon } from '@iconify/react/dist/iconify.js'
import CardBox from '../shared/CardBox'
import { ApexOptions } from 'apexcharts'
import { fmtUsd } from '@/lib/admin-api'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface DonutSeg {
  name: string
  value: number
}

const StatusBreakup = ({
  donut,
  totalRev,
  fulfilledPct,
}: {
  donut: DonutSeg[]
  totalRev: number
  fulfilledPct: number
}) => {
  const series = donut.map((s) => s.value)

  const ChartData: ApexOptions = {
    series,
    labels: donut.map((s) => s.name),
    chart: {
      type: 'donut',
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
      height: 200,
      offsetX: 18,
      toolbar: { show: false },
    },
    plotOptions: {
      pie: {
        startAngle: 0,
        endAngle: 360,
        donut: { size: '75%' },
      },
    },
    stroke: { show: false },
    dataLabels: { enabled: false },
    legend: { show: false },
    colors: ['var(--color-success)', 'var(--color-warning)', 'var(--color-secondary)'],
    tooltip: {
      theme: 'dark',
      fillSeriesColor: false,
      y: {
        formatter: (val: number) => `${val} order(s)`,
      },
    },
  }

  return (
    <CardBox>
      <div className='grid grid-cols-12'>
        <div className='flex flex-col lg:col-span-6 md:col-span-6 col-span-7'>
          <div>
            <h5 className='card-title mb-4 lg:whitespace-nowrap'>Order status</h5>
            <h4 className='text-xl mb-2'>{fmtUsd(totalRev)}</h4>
            <div className='flex items-center mb-3 gap-2'>
              <span className='rounded-full p-1 bg-lightsuccess dark:bg-darksuccess flex items-center justify-center'>
                <Icon
                  icon={
                    fulfilledPct >= 50 ? 'tabler:arrow-up-left' : 'tabler:arrow-down-right'
                  }
                  className={fulfilledPct >= 50 ? 'text-success' : 'text-error'}
                />
              </span>
              <p className='text-muted-foreground mb-0'>{fulfilledPct}% fulfilled</p>
            </div>
          </div>
          <div className='flex flex-wrap gap-4 items-center mt-4'>
            {donut.map((seg, i) => (
              <div key={seg.name} className='flex items-center'>
                <Icon
                  icon='tabler:point-filled'
                  className={
                    (i === 0
                      ? 'text-success'
                      : i === 1
                        ? 'text-warning'
                        : 'text-secondary') + ' text-xl me-1'
                  }
                />
                <span className='text-xs text-muted-foreground'>
                  {seg.name} · {seg.value}
                </span>
              </div>
            ))}
          </div>
        </div>
        <div className='lg:col-span-6 md:col-span-6 col-span-4'>
          <div className='flex justify-center'>
            <Chart
              options={ChartData}
              series={series}
              type='donut'
              height={200}
              width={180}
            />
          </div>
        </div>
      </div>
    </CardBox>
  )
}

export { StatusBreakup }
