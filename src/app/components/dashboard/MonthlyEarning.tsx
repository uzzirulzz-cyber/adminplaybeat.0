'use client'
import dynamic from 'next/dynamic'
import { Icon } from '@iconify/react/dist/iconify.js'
import CardBox from '../shared/CardBox'
import { ApexOptions } from 'apexcharts'
import { fmtUsd } from '@/lib/admin-api'
import type { DayPoint } from './types'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

const MonthlyEarning = ({
  monthRev,
  monthDelta,
  monthShare,
  days,
}: {
  monthRev: number
  monthDelta: number | null
  monthShare: number
  days: DayPoint[]
}) => {
  const ChartData: ApexOptions = {
    series: [
      {
        name: 'daily order value',
        color: 'var(--color-secondary)',
        data: days.map((d) => Math.round(d.usd * 100) / 100),
      },
    ],
    chart: {
      id: 'monthly-earning-spark',
      type: 'area',
      height: 60,
      sparkline: { enabled: true },
      group: 'sparklines',
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
    },
    stroke: { curve: 'smooth', width: 2 },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 0,
        inverseColors: false,
        opacityFrom: 0.1,
        opacityTo: 0,
        stops: [20, 180],
      },
    },
    markers: { size: 0 },
    tooltip: {
      theme: 'dark',
      fixed: { enabled: true, position: 'right' },
      x: { show: false },
      y: {
        formatter: (val: number) => fmtUsd(val),
      },
    },
  }

  return (
    <CardBox className='p-0! mt-0'>
      <div className='px-6 pt-6'>
        <div className='flex items-center justify-between mb-2'>
          <h5 className='card-title mb-0'>This month</h5>
          <div className='text-white bg-secondary rounded-full h-11 w-11 flex items-center justify-center'>
            <Icon icon='tabler:currency-dollar' className='text-xl' />
          </div>
        </div>
        <div className='grid grid-cols-12 gap-6 mb-4'>
          <div className='lg:col-span-8 md:col-span-8 col-span-8'>
            <h4 className='text-xl mb-3'>{fmtUsd(monthRev)}</h4>
            <div className='flex items-center gap-2'>
              <span
                className={`rounded-full p-1 flex items-center justify-center ${
                  (monthDelta ?? 0) >= 0 ? 'bg-lightsuccess' : 'bg-lighterror'
                }`}
              >
                <Icon
                  icon={(monthDelta ?? 0) >= 0 ? 'tabler:arrow-up-right' : 'tabler:arrow-down-right'}
                  className={(monthDelta ?? 0) >= 0 ? 'text-success' : 'text-error'}
                />
              </span>
              <p className='text-muted-foreground mb-0'>
                {monthDelta === null ? 'first month' : monthDelta + '% vs last month'}
              </p>
            </div>
          </div>
          <div className='lg:col-span-4 md:col-span-4 col-span-4 flex items-center justify-end'>
            <div className='text-right'>
              <p className='text-xs text-muted-foreground'>share of all-time</p>
              <p className='text-lg font-bold text-foreground'>{monthShare}%</p>
            </div>
          </div>
        </div>
      </div>
      <Chart
        options={ChartData}
        series={ChartData.series}
        type='area'
        height={60}
        width={'100%'}
      />
    </CardBox>
  )
}

export { MonthlyEarning }
