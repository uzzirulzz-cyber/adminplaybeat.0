'use client'

import React from 'react'
import BreadcrumbComp from '@/app/(DashboardLayout)/layout/shared/breadcrumb/BreadcrumbComp'

/**
 * Bridge between the PlayBeat functional pages and the Tailwind-Admin
 * (DashboardLayout) route group. Pages render inside the template's
 * Sidebar + Header shell; AdminShell just adds the template breadcrumb.
 */
export function AdminShell({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <>
      <BreadcrumbComp
        title={title}
        items={[{ title: 'PlayBeat', to: '/' }, { title }]}
      />
      {children}
    </>
  )
}

export function PageLoader() {
  return (
    <div className='flex items-center justify-center py-24'>
      <div className='flex flex-col items-center gap-3'>
        <span className='h-8 w-8 animate-spin rounded-full border-2 border-border border-t-primary' />
        <p className='text-sm text-muted-foreground'>Loading…</p>
      </div>
    </div>
  )
}
