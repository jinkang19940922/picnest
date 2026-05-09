import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import Layout from '@/components/Layout/Layout'
import Login from '@/pages/Login'
import Gallery from '@/pages/Gallery'
import UploadPage from '@/pages/UploadPage'
import Trash from '@/pages/Trash'
import Stats from '@/pages/Stats'
import Settings from '@/pages/Settings'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false)
  const token = useAuthStore((s) => s.token)

  useEffect(() => {
    // Wait for zustand persist to rehydrate from localStorage before checking auth
    const checkHydrated = () => {
      const state = useAuthStore.getState() as any
      if (state._hasHydrated !== false) {
        setIsReady(true)
      }
    }
    checkHydrated()
    // Also listen for when zustand finishes rehydrating
    const interval = setInterval(checkHydrated, 50)
    // Timeout after 2s to avoid infinite loading
    const timeout = setTimeout(() => { clearInterval(interval); setIsReady(true) }, 2000)
    return () => { clearInterval(interval); clearTimeout(timeout) }
  }, [])

  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-bg)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-2xl mb-4 mx-auto">
            P
          </div>
          <p className="text-[var(--color-text-secondary)]">加载中...</p>
        </div>
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />
  return <>{children}</>
}

export default function App() {
  const { token, fetchUser } = useAuthStore()
  const isPreviewOpen = useUIStore((s) => s.isPreviewOpen)

  useEffect(() => {
    if (token) {
      fetchUser()
    }
  }, [token])

  // 预览弹窗打开时彻底禁止背景滚动（body 层面，阻止触控板手势穿透）
  useEffect(() => {
    if (isPreviewOpen) {
      document.body.style.overflow = 'hidden'
      document.body.style.overscrollBehavior = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.overscrollBehavior = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isPreviewOpen])

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Gallery />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/trash" element={<Trash />} />
                <Route path="/stats" element={<Stats />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        }
      />
    </Routes>
  )
}