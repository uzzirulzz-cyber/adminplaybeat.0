export type Stats = {
  digital?: {
    totalProducts?: number
    published?: number
    inStock?: number
    deals40plus?: number
    under25?: number
    groups?: Record<string, number>
    source?: string
    extractedAt?: string
  }
  services?: { total?: number }
  liveTv?: { channels?: number; plans?: number }
  crm?: { total?: number; open?: number }
  generatedAt?: string
}

export type Readiness = {
  readiness?: {
    usdToPkrRate?: number
    electronicFirst?: { configured?: boolean; baseUrl?: string }
    paypal?: { configured?: boolean; environment?: string }
    rapidGateway?: { configured?: boolean; merchantId?: string; environment?: string }
  }
  syncStatus?: {
    syncedAt?: string
    source?: string
    apiConfigured?: boolean
    httpStatus?: number
    message?: string
    productCount?: number
  }
}

export type Mini = {
  ok?: boolean
  connected?: boolean
  eventsApiReady?: boolean
  error?: string
}

export type OrderLite = {
  orderId: string
  createdAt: string
  status: string
  paymentRail: string
  manualChannel?: string
  currency: string
  totalUsd: number
  customerEmail: string
}

export type DayPoint = { day: string; label: string; usd: number; count: number }

export const DAY = 864e5
