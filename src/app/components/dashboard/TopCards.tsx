'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'

import 'swiper/css'
import CardBox from '../shared/CardBox'
import { fmtUsd } from '@/lib/admin-api'
import type { Stats, OrderLite } from './types'

const KpiCards = ({
  stats,
  orders,
}: {
  stats: Stats | null
  orders: OrderLite[]
}) => {
  const list = orders || []
  const now = Date.now()
  const rev30 = list
    .filter((o) => now - new Date(o.createdAt).getTime() <= 30 * 864e5)
    .reduce((s, o) => s + (Number(o.totalUsd) || 0), 0)
  const pending = list.filter((o) =>
    String(o.status || '').toUpperCase().includes('PENDING')
  ).length

  const TopCardInfo = [
    {
      key: 'card1',
      title: 'Order value 30d',
      desc: fmtUsd(rev30),
      img: '/images/svgs/icon-briefcase.svg',
      bgcolor: 'bg-lightsuccess dark:bg-lightsuccess',
      textclr: 'text-success dark:text-success',
      url: '/orders/',
    },
    {
      key: 'card2',
      title: 'Pending orders',
      desc: String(pending),
      img: '/images/svgs/icon-mailbox.svg',
      bgcolor: 'bg-lighterror dark:bg-lighterror',
      textclr: 'text-error dark:text-error',
      url: '/orders/',
    },
    {
      key: 'card3',
      title: 'Digital products',
      desc: (stats?.digital?.totalProducts ?? 0).toLocaleString(),
      img: '/images/svgs/icon-connect.svg',
      bgcolor: 'bg-lightprimary dark:bg-lightprimary',
      textclr: 'text-primary dark:text-primary',
      url: '/catalog/',
    },
    {
      key: 'card4',
      title: 'Deals 40%+',
      desc: String(stats?.digital?.deals40plus ?? 0),
      img: '/images/svgs/icon-favorites.svg',
      bgcolor: 'bg-lightwarning dark:bg-lightwarning',
      textclr: 'text-warning dark:text-warning',
      url: '/catalog/',
    },
    {
      key: 'card5',
      title: 'Services',
      desc: String(stats?.services?.total ?? 0),
      img: '/images/svgs/icon-tasks.svg',
      bgcolor: 'bg-lightinfo dark:bg-lightinfo',
      textclr: 'text-info dark:text-info',
      url: '/catalog/',
    },
    {
      key: 'card6',
      title: 'TV channels/plans',
      desc: `${stats?.liveTv?.channels ?? 0}/${stats?.liveTv?.plans ?? 0}`,
      img: '/images/svgs/icon-bars.svg',
      bgcolor: 'bg-lightsecondary dark:bg-lightsecondary',
      textclr: 'text-secondary dark:text-secondary',
      url: '/catalog/',
    },
    {
      key: 'card7',
      title: 'Open leads',
      desc: String(stats?.crm?.open ?? 0),
      img: '/images/svgs/icon-user-male.svg',
      bgcolor: 'bg-lightsuccess dark:bg-lightsuccess',
      textclr: 'text-success dark:text-success',
      url: '/inquiries/',
    },
  ]

  return (
    <div>
      <Swiper
        slidesPerView={6}
        spaceBetween={24}
        loop={true}
        freeMode={true}
        grabCursor={true}
        speed={5000}
        autoplay={{ delay: 0, disableOnInteraction: false }}
        modules={[Autoplay]}
        breakpoints={{
          0: { slidesPerView: 1, spaceBetween: 10 },
          640: { slidesPerView: 2, spaceBetween: 14 },
          768: { slidesPerView: 3, spaceBetween: 18 },
          1030: { slidesPerView: 4, spaceBetween: 18 },
          1200: { slidesPerView: 6, spaceBetween: 24 },
        }}
        className='mySwiper'
      >
        {TopCardInfo.map((item) => {
          return (
            <SwiperSlide key={item.key}>
              <Link href={item.url}>
                <CardBox
                  className={`shadow-none ${item.bgcolor} w-full border-none!`}
                >
                  <div className='text-center hover:scale-105 transition-all ease-in-out py-2'>
                    <div className='flex justify-center'>
                      <Image
                        src={item.img}
                        width='42'
                        height='42'
                        className='mb-3'
                        alt={item.title}
                      />
                    </div>
                    <p className={`font-semibold ${item.textclr} mb-1`}>
                      {item.title}
                    </p>
                    <h5 className={`text-lg font-semibold ${item.textclr} mb-0`}>
                      {item.desc}
                    </h5>
                  </div>
                </CardBox>
              </Link>
            </SwiperSlide>
          )
        })}
      </Swiper>
    </div>
  )
}

export { KpiCards }
