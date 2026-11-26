'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import FullLogo from '@/app/(DashboardLayout)/layout/shared/logo/FullLogo'
import CardBox from '@/app/components/shared/CardBox'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  adminLogin,
  adminLoginWithIdToken,
  getToken,
  FIREBASE_BRIDGE_URL,
  BRIDGE_ORIGIN,
} from '@/lib/admin-api'
import { Icon } from '@iconify/react'

export const Login = () => {
  const router = useRouter()
  const params = useSearchParams()
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fbBusy, setFbBusy] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (getToken()) {
      router.replace('/')
    }
  }, [router])

  function firebaseSignIn() {
    setFbBusy(true)
    setError('')
    let poll: ReturnType<typeof setInterval> | undefined
    const handler = (ev: MessageEvent) => {
      if (ev.origin !== BRIDGE_ORIGIN) return
      const d = ev.data as { type?: string; idToken?: string }
      if (d && d.type === 'pb_admin_firebase_token' && d.idToken) {
        window.removeEventListener('message', handler)
        if (poll) clearInterval(poll)
        adminLoginWithIdToken(d.idToken)
          .then(() => router.replace('/'))
          .catch((e: any) => {
            setError(e?.message || 'Firebase sign-in rejected.')
            setFbBusy(false)
          })
      }
    }
    window.addEventListener('message', handler)
    const w = window.open(
      FIREBASE_BRIDGE_URL,
      'pb_admin_firebase',
      'width=470,height=660'
    )
    if (!w) {
      window.removeEventListener('message', handler)
      setFbBusy(false)
      setError('Popup blocked — allow popups for this site and try again.')
      return
    }
    poll = setInterval(() => {
      if (w.closed) {
        clearInterval(poll)
        window.removeEventListener('message', handler)
        setFbBusy(false)
      }
    }, 800)
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await adminLogin(password.trim())
      router.replace('/')
    } catch (err: any) {
      setError(err?.message || 'Sign-in failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className='h-screen w-full flex justify-center items-center bg-lightprimary px-4'>
      <div className='md:min-w-[450px] min-w-max w-full max-w-[450px]'>
        <CardBox className='relative overflow-hidden'>
          <div className='flex justify-center mb-4'>
            <FullLogo />
          </div>
          <p className='text-sm text-muted-foreground text-center mb-6'>
            Welcome to admin.playbeat.digital — merchant access only.
          </p>

          {params.get('expired') ? (
            <div className='mb-4 rounded-md border border-warning/40 bg-lightwarning px-3 py-2 text-xs text-warning'>
              Session expired or missing — sign in again.
            </div>
          ) : null}

          {error ? (
            <div className='mb-4 rounded-md border border-error/40 bg-lighterror px-4 py-3 text-sm text-error'>
              {error}
            </div>
          ) : null}

          <Button
            type='button'
            variant='outline'
            disabled={fbBusy || busy}
            onClick={firebaseSignIn}
            className='w-full'>
            <Icon icon='logos:google-icon' width={18} height={18} />
            {fbBusy ? 'Waiting for Firebase sign-in…' : 'Sign in with Google (passwordless)'}
          </Button>

          <div className='my-5 flex items-center gap-3'>
            <span className='h-px flex-1 bg-border' />
            <span className='text-[10px] uppercase tracking-wider text-muted-foreground'>
              or admin password
            </span>
            <span className='h-px flex-1 bg-border' />
          </div>

          <form onSubmit={submit} className='space-y-5'>
            <div>
              <div className='mb-2 block'>
                <Label htmlFor='admin-password' className='font-medium'>
                  Admin password
                </Label>
              </div>
              <div className='relative'>
                <Input
                  id='admin-password'
                  type={showPw ? 'text' : 'password'}
                  autoComplete='current-password'
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder='Enter your admin password'
                  required
                  className='pr-10'
                />
                <span
                  onClick={() => setShowPw(!showPw)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer text-muted-foreground hover:text-primary'>
                  <Icon
                    icon={showPw ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
                    width={18}
                    height={18}
                  />
                </span>
              </div>
            </div>
            <Button type='submit' disabled={busy || !password} className='w-full'>
              {busy ? 'Signing in…' : 'Sign In'}
            </Button>
            <p className='text-center text-[11px] leading-relaxed text-muted-foreground'>
              Passwordless sign-in uses your Firebase Google account and only works
              for emails allow-listed under Integrations → Admin access.
            </p>
          </form>
        </CardBox>
        <p className='mt-6 text-center text-xs text-muted-foreground'>
          © {new Date().getFullYear()} PlayBeat Digital — internal system, no public access.
        </p>
      </div>
    </div>
  )
}
