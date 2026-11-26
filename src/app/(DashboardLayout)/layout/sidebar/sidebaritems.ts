import { uniqueId } from 'lodash'

export interface ChildItem {
  id?: number | string
  name?: string
  icon?: string
  children?: ChildItem[]
  item?: unknown
  url?: string
  color?: string
  disabled?: boolean
  subtitle?: string
  badge?: boolean
  badgeType?: string
  isPro?: boolean
}

export interface MenuItem {
  heading?: string
  name?: string
  icon?: string
  id?: number | string
  to?: string
  items?: MenuItem[]
  children?: ChildItem[]
  url?: string
  disabled?: boolean
  subtitle?: string
  badgeType?: string
  badge?: boolean
  isPro?: boolean
}

const SidebarContent: MenuItem[] = [
  {
    heading: 'Home',
    children: [
      {
        name: 'Dashboard',
        icon: 'solar:widget-2-linear',
        id: uniqueId(),
        url: '/',
        isPro: false,
      },
      {
        name: 'Analytics',
        icon: 'solar:chart-2-linear',
        id: uniqueId(),
        url: '/analytics',
        isPro: false,
      },
    ],
  },
  {
    heading: 'Commerce',
    children: [
      {
        name: 'Orders',
        icon: 'solar:cart-check-linear',
        id: uniqueId(),
        url: '/orders',
        isPro: false,
      },
      {
        name: 'Catalog',
        icon: 'solar:box-linear',
        id: uniqueId(),
        url: '/catalog',
        isPro: false,
      },
    ],
  },
  {
    heading: 'CRM',
    children: [
      {
        name: 'Inquiries',
        icon: 'solar:letter-linear',
        id: uniqueId(),
        url: '/inquiries',
        isPro: false,
      },
    ],
  },
  {
    heading: 'Platform',
    children: [
      {
        name: 'Integrations',
        icon: 'solar:link-circle-linear',
        id: uniqueId(),
        url: '/integrations',
        isPro: false,
      },
    ],
  },
]

export default SidebarContent

