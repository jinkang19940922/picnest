import client from './client'
import type { ImageItem, ImageListResponse } from '@/types'

export interface GetImagesParams {
  page?: number
  per_page?: number
  folder_id?: string
  tag_ids?: string
  search?: string
  sort?: 'newest' | 'oldest' | 'size' | 'name'
  status?: 'active' | 'trashed'
}

export const imagesApi = {
  getImages: (params: GetImagesParams = {}) =>
    client.get<ImageListResponse>('/images', { params }),

  getImage: (id: string) =>
    client.get<ImageItem>(`/images/${id}`),

  updateImage: (id: string, data: {
    original_name?: string
    folder_id?: string
    is_public?: boolean
    is_starred?: boolean
    tag_ids?: string[]
  }) =>
    client.put<ImageItem>(`/images/${id}`, data),

  deleteImage: (id: string) =>
    client.delete(`/images/${id}`),

  batchDelete: (imageIds: string[]) =>
    client.post('/images/batch-delete', imageIds),

  restoreImage: (id: string) =>
    client.post(`/images/${id}/restore`),

  permanentDelete: (id: string) =>
    client.delete(`/images/${id}/permanent`),
}