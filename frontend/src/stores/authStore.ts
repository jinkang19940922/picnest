import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { authApi } from '@/api/auth'
import type { User } from '@/types'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  fetchUser: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (username: string, password: string) => {
        set({ isLoading: true })
        try {
          const res = await authApi.login({ username, password })
          const token = res.data.access_token
          set({ token, isAuthenticated: true })
          // 获取用户信息
          await get().fetchUser()
        } finally {
          set({ isLoading: false })
        }
      },

      logout: () => {
        set({ token: null, user: null, isAuthenticated: false })
      },

      fetchUser: async () => {
        try {
          const res = await authApi.getMe()
          set({ user: res.data })
        } catch {
          get().logout()
        }
      },
    }),
    {
      name: 'picnest-auth',
      partialize: (state) => ({ token: state.token }),
    }
  )
)