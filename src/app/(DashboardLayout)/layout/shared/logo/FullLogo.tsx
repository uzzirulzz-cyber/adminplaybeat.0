'use client'

import Link from 'next/link'

const FullLogo = () => {
  return (
    <Link href='/' className='flex items-center gap-2.5'>
      <span className='flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[15px] font-extrabold tracking-tight text-white'>
        PB
      </span>
      <span className='flex flex-col leading-none'>
        <span className='text-[17px] font-extrabold tracking-tight text-foreground'>
          PlayBeat
        </span>
        <span className='text-[10px] font-semibold uppercase tracking-[0.18em] text-primary'>
          Admin Console
        </span>
      </span>
    </Link>
  )
}

export default FullLogo
