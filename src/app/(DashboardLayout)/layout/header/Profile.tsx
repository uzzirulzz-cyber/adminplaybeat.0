'use client'

import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { clearToken } from '@/lib/admin-api'

const Profile = () => {
  const router = useRouter()

  function signOut() {
    clearToken()
    router.replace('/login/')
  }

  return (
    <div className='relative group/menu ps-15 shrink-0'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <span className='hover:text-primary hover:bg-lightprimary rounded-full flex justify-center items-center cursor-pointer group-hover/menu:bg-lightprimary group-hover/menu:text-primary'>
            <Avatar className='h-9 w-9'>
              <AvatarFallback className='bg-primary text-[13px] font-bold text-white'>
                PB
              </AvatarFallback>
            </Avatar>
          </span>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          className='w-screen sm:w-[200px] pb-4 pt-2 rounded-sm'>
          <DropdownMenuLabel>
            <p className='text-sm font-semibold text-foreground'>Administrator</p>
            <p className='text-xs font-normal text-muted-foreground'>
              admin.playbeat.digital
            </p>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={signOut}
            className='px-4 py-2 flex justify-between items-center group/link w-full hover:bg-lighterror hover:text-error cursor-pointer'>
            <div className='flex items-center gap-3 w-full'>
              <Icon
                icon='tabler:logout'
                className='text-lg text-muted-foreground group-hover/link:text-error'
              />
              <h5 className='mb-0 text-sm text-muted-foreground group-hover/link:text-error'>
                Sign out
              </h5>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export default Profile
