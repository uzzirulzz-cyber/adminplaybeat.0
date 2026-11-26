import { Suspense } from 'react'
import { Login } from '@/app/components/auth/Login'

const page = () => {
  return (
    <Suspense fallback={null}>
      <Login />
    </Suspense>
  )
}

export default page
