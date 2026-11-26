'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import CardBox from '../shared/CardBox'
import { ApexOptions } from 'apexcharts'
import { fmtUsd } from '@/lib/admin-api'
import type { DayPoint } from './types'

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false })

interface Props {
  days: DayPoint[]
  rev30: number
  orders30: number
}

const SalesOverview = ({ days, rev30, orders30 }: Props) => {
  const options: ApexOptions = {
    chart: {
      id: 'orders-overview',
      type: 'bar',
      fontFamily: 'inherit',
      foreColor: '#adb0bb',
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: '70%',
        borderRadiusApplication: 'end',
      },
    },
    dataLabels: { enabled: false },
    grid: {
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
      borderColor: 'var(--color-border)',
    },
    xaxis: {
      categories: days.map((d) => d.label),
      axisBorder: { show: false },
      axisTicks: { show: false },
      labels: {
        show: true,
        style: { fontSize: '10px' },
        rotate: 0,
        hideOverlappingLabels: true,
      },
    },
    yaxis: {
      labels: {
        formatter: (val: number) => (val >= 1000 ? '$' + (val / 1000).toFixed(1) + 'k' : '$' + val),
        style: { fontSize: '10px' },
      },
    },
    tooltip: {
      theme: 'dark',
      y: {
        formatter: (val: number, opts: any) => {
          const pt = days[opts.dataPointIndex]
          return (
            fmtUsd(val) + ' · ' + (pt?.count || 0) + ' order(s)'
          )
        },
      },
    },
    colors: ['var(--color-primary)'],
  }

  const series = [
    {
      name: 'Order value',
      data: days.map((d) => Math.round(d.usd * 100) / 100),
    },
  ]

  const hasData = days.some((d) => d.usd > 0)

  return (
    <CardBox className='h-full'>
      <div className='flex flex-wrap items-center justify-between gap-3 mb-6'>
        <div>
          <h5 className='card-title'>Revenue updates</h5>
          <p className='text-sm text-muted-foreground font-normal'>
            Daily order value — last 30 days
          </p>
        </div>
        <div className='flex gap-2'>
          <span className='rounded-full bg-lightprimary px-3 py-1 text-xs font-semibold text-primary'>
            {fmtUsd(rev30)} · 30d
          </span>
          <span className='rounded-full bg-lightsuccess px-3 py-1 text-xs font-semibold text-success'>
            {orders30} orders
          </span>
        </div>
      </div>
      {hasData ? (
        <Chart options={options} series={series} type='bar' height={280} width={'100%'} />
      ) : (
        <div className='flex h-64 flex-col items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground'>
          No orders yet — the revenue chart fills in automatically as orders arrive.
        </div>
      )}
    </CardBox>
  )
}

export { SalesOverview }
