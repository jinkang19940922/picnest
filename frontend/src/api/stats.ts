import client from './client'
import type { StatsOverview, StorageStats } from '@/types'

export const statsApi = {
  getOverview: () =>
    client.get<StatsOverview>('/stats/overview'),

  getStorage: () =>
    client.get<StorageStats>('/stats/storage'),
}