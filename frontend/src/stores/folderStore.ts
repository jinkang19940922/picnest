import { create } from 'zustand'
import { foldersApi } from '@/api/folders'
import type { Folder } from '@/types'

interface FolderState {
  folders: Folder[]
  isLoading: boolean
  selectedFolderId: string | null
  fetchFolders: () => Promise<void>
  createFolder: (name: string, parentId?: string) => Promise<void>
  deleteFolder: (id: string) => Promise<void>
  selectFolder: (id: string | null) => void
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],
  isLoading: false,
  selectedFolderId: null,

  fetchFolders: async () => {
    set({ isLoading: true })
    try {
      const res = await foldersApi.getFolders()
      set({ folders: res.data })
    } finally {
      set({ isLoading: false })
    }
  },

  createFolder: async (name, parentId) => {
    await foldersApi.createFolder({ name, parent_id: parentId })
    await get().fetchFolders()
  },

  deleteFolder: async (id) => {
    await foldersApi.deleteFolder(id)
    set((state) => ({
      folders: state.folders.filter((f) => f.id !== id),
      selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId,
    }))
  },

  selectFolder: (id) => set({ selectedFolderId: id }),
}))