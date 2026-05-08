import { create } from 'zustand'
import { imagesApi } from '@/api/images'
import type { ImageItem, ImageListMeta } from '@/types'

interface ImageState {
  images: ImageItem[]
  meta: ImageListMeta
  isLoading: boolean
  isLoadingMore: boolean
  selectedIds: Set<string>
  previewImage: ImageItem | null
  fetchImages: (params?: Parameters<typeof imagesApi.getImages>[0]) => Promise<void>
  loadMore: () => Promise<void>
  selectImage: (id: string) => void
  deselectImage: (id: string) => void
  toggleSelect: (id: string) => void
  selectAll: () => void
  deselectAll: () => void
  deleteImage: (id: string) => Promise<void>
  restoreImage: (id: string) => Promise<void>
  setPreview: (image: ImageItem | null) => void
}

export const useImageStore = create<ImageState>((set, get) => ({
  images: [],
  meta: { page: 1, per_page: 24, total: 0, total_pages: 0 },
  isLoading: false,
  isLoadingMore: false,
  selectedIds: new Set(),
  previewImage: null,

  fetchImages: async (params = {}) => {
    set({ isLoading: true })
    try {
      const res = await imagesApi.getImages({ page: 1, per_page: 24, ...params })
      set({ images: res.data.data, meta: res.data.meta })
    } finally {
      set({ isLoading: false })
    }
  },

  loadMore: async () => {
    const { meta, isLoadingMore, images } = get()
    if (isLoadingMore || meta.page >= meta.total_pages) return
    
    set({ isLoadingMore: true })
    try {
      const nextPage = meta.page + 1
      const res = await imagesApi.getImages({ page: nextPage, per_page: meta.per_page })
      set({
        images: [...images, ...res.data.data],
        meta: res.data.meta,
      })
    } finally {
      set({ isLoadingMore: false })
    }
  },

  selectImage: (id) => {
    set((state) => {
      const newSet = new Set(state.selectedIds)
      newSet.add(id)
      return { selectedIds: newSet }
    })
  },

  deselectImage: (id) => {
    set((state) => {
      const newSet = new Set(state.selectedIds)
      newSet.delete(id)
      return { selectedIds: newSet }
    })
  },

  toggleSelect: (id) => {
    const { selectedIds } = get()
    if (selectedIds.has(id)) {
      get().deselectImage(id)
    } else {
      get().selectImage(id)
    }
  },

  selectAll: () => {
    set((state) => ({
      selectedIds: new Set(state.images.map((img) => img.id)),
    }))
  },

  deselectAll: () => {
    set({ selectedIds: new Set() })
  },

  deleteImage: async (id) => {
    await imagesApi.deleteImage(id)
    set((state) => ({
      images: state.images.filter((img) => img.id !== id),
      meta: { ...state.meta, total: state.meta.total - 1 },
    }))
  },

  restoreImage: async (id) => {
    await imagesApi.restoreImage(id)
    await get().fetchImages()
  },

  setPreview: (image) => set({ previewImage: image }),
}))