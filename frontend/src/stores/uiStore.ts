import { create } from 'zustand'
import { persist } from 'zustand/middleware'

type Theme = 'light' | 'dark' | 'system'

interface UIState {
  theme: Theme
  actualTheme: 'light' | 'dark'
  sidebarCollapsed: boolean
  isPreviewOpen: boolean
  setTheme: (theme: Theme) => void
  toggleSidebar: () => void
  setPreviewOpen: (open: boolean) => void
}

const getSystemTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

const applyTheme = (theme: 'light' | 'dark') => {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'light',
      actualTheme: 'light',
      sidebarCollapsed: false,
      isPreviewOpen: false,

      setTheme: (theme) => {
        const actual = theme === 'system' ? getSystemTheme() : theme
        applyTheme(actual)
        set({ theme, actualTheme: actual })
      },

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setPreviewOpen: (open) => set({ isPreviewOpen: open }),
    }),
    {
      name: 'picnest-ui',
      onRehydrateStorage: () => (state) => {
        if (state) {
          const actual = state.theme === 'system' ? getSystemTheme() : state.theme
          applyTheme(actual)
          state.actualTheme = actual
        }
      },
    }
  )
)
