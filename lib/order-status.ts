import type { OrderStatus } from '@prisma/client'

export function getAggregateOrderStatus(statuses: OrderStatus[]): OrderStatus {
  if (statuses.some((status) => status === 'PENDING' || status === 'PROCESSING')) {
    return 'PROCESSING'
  }

  return statuses.length > 0 && statuses.every((status) => status === 'SUCCESS')
    ? 'SUCCESS'
    : 'FAILED'
}
