import client from './client'
import type { Tag } from '@/types'

export const tagsApi = {
  getTags: () =>
    client.get<Tag[]>('/tags'),

  createTag: (name: string, color?: string) =>
    client.post<Tag>('/tags', null, { params: { name, color } }),

  deleteTag: (id: string) =>
    client.delete(`/tags/${id}`),
}