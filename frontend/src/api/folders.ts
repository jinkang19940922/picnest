import client from './client'
import type { Folder } from '@/types'

export const foldersApi = {
  getFolders: () =>
    client.get<Folder[]>('/folders'),

  createFolder: (data: { name: string; parent_id?: string; color?: string }) =>
    client.post<Folder>('/folders', data),

  updateFolder: (id: string, data: { name?: string; parent_id?: string; color?: string }) =>
    client.put<Folder>(`/folders/${id}`, data),

  deleteFolder: (id: string) =>
    client.delete(`/folders/${id}`),
}