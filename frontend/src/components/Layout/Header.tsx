import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { formatFileSize } from '@/api/client'

const navItems = [
  { path: '/', label: '画廊', icon: '🖼️' },
  { path: '/upload', label: '上传', icon: '📤' },
  { path: '/stats', label: '统计', icon: '📊' },
  { path: '/trash', label: '回收站', icon: '🗑️' },
]

export default function Header() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, setTheme, actualTheme } = useUIStore()

  const toggleTheme = () => {
    setTheme(actualTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-50 glass border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-bold text-sm">
            P
          </div>
          <span className="font-semibold text-lg">PicNest</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === item.path
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                  : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
              }`}
            >
              <span className="mr-1">{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* 存储用量 */}
          {user && (
            <div className="hidden sm:flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
              <span>💾</span>
              <span>{formatFileSize(user.storage_used)}</span>
              <span>/</span>
              <span>{formatFileSize(user.storage_quota)}</span>
            </div>
          )}

          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg hover:bg-[var(--color-surface)] transition-colors"
          >
            {actualTheme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* 用户菜单 */}
          <div className="relative group">
            <button className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-400 to-secondary-400 flex items-center justify-center text-white font-medium text-sm">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 py-2 bg-[var(--color-bg)] border border-[var(--color-border)] rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <div className="px-3 py-2 border-b border-[var(--color-border)]">
                <p className="font-medium text-sm">{user?.username}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">{user?.email || user?.role}</p>
              </div>
              <button
                onClick={logout}
                className="w-full px-3 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}