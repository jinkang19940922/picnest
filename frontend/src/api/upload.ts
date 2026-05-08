import client from './client'
import type { UploadResult } from '@/types'

export const uploadApi = {
  uploadImage: (file: File, folderId?: string, isPublic = true) => {
    const formData = new FormData()
    formData.append('file', file)
    if (folderId) formData.append('folder_id', folderId)
    formData.append('is_public', String(isPublic))
    return client.post<UploadResult>('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  batchUpload: (files: File[], folderId?: string, isPublic = true) => {
    const formData = new FormData()
    files.forEach((file) => formData.append('files', file))
    if (folderId) formData.append('folder_id', folderId)
    formData.append('is_public', String(isPublic))
    return client.post<UploadResult>('/images/batch-upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}