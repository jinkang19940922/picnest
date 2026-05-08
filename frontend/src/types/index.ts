// 类型定义
export interface User {
  id: string
  username: string
  email?: string
  role: string
  avatar_url?: string
  storage_quota: number
  storage_used: number
  is_active: boolean
  created_at: string
}

export interface Folder {
  id: string
  name: string
  parent_id?: string
  user_id: string
  color: string
  sort_order: number
  created_at: string
  image_count: number
  children?: Folder[]
}

export interface Tag {
  id: string
  name: string
  color: string
  user_id: string
}

export interface ImageItem {
  id: string
  filename: string
  original_name: string
  url: string
  thumbnails: {
    small?: string
    medium?: string
    large?: string
  }
  width?: number
  height?: number
  file_size: number
  mime_type: string
  folder_id?: string
  folder_name?: string
  tags: Tag[]
  is_starred: boolean
  is_public: boolean
  view_count: number
  download_count: number
  created_at: string
}

export interface ImageListMeta {
  page: number
  per_page: number
  total: number
  total_pages: number
}

export interface ImageListResponse {
  data: ImageItem[]
  meta: ImageListMeta
}

export interface StatsOverview {
  total_images: number
  total_storage: number
  today_uploads: number
  month_uploads: number
  trash_count: number
  top_folders: { name: string; count: number }[]
  top_tags: { name: string; color: string; count: number }[]
}

export interface StorageStats {
  used: number
  quota: number
  used_percent: number
  by_folder: { name: string; total: number }[]
}

export interface UploadResult {
  uploaded: {
    id: string
    original_name: string
    url: string
    thumbnails: Record<string, string>
  }[]
  errors: { filename: string; error: string }[]
  total: number
  success_count: number
  error_count: number
}