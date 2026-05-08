import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { formatFileSize } from '@/api/client'
import { motion, AnimatePresence } from 'framer-motion'

const navItems = [
  { path: '/', label: '画廊', icon: 'photo.stack' },
  { path: '/upload', label: '上传', icon: 'square.and.arrow.up' },
  { path: '/stats', label: '统计', icon: 'chart.bar' },
  { path: '/trash', label: '回收站', icon: 'trash' },
]

export default function Header() {
  const location = useLocation()
  const { user, logout } = useAuthStore()
  const { theme, setTheme, actualTheme } = useUIStore()

  const toggleTheme = () => {
    setTheme(actualTheme === 'light' ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-50 glass-sidebar">
      <div className="max-w-7xl mx-auto px-5 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-apple-indigo flex items-center justify-center shadow-apple-sm group-hover:shadow-apple-md transition-all">
            <span className="text-white font-semibold text-[13px]">P</span>
          </div>
          <span className="font-semibold text-[15px] tracking-tight text-[var(--color-text-primary)]">PicNest</span>
        </Link>

        {/* Nav */}
        <nav className="flex items-center gap-0.5">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`
                  relative px-3.5 py-1.5 rounded-lg text-[13px] font-medium 
                  transition-all duration-200
                  ${isActive
                    ? 'text-primary-500'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-sunken)]'
                  }
                `}
              >
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-0 bg-[var(--color-primary-light)] rounded-lg -z-10"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                  />
                )}
                <span className="relative z-10">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Right */}
        <div className="flex items-center gap-2">
          {/* 存储用量 */}
          {user && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-bg-sunken)] text-[12px] text-[var(--color-text-secondary)]">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7M4 7l8 5 8-5M4 7l8-5 8 5" />
              </svg>
              <span>{formatFileSize(user.storage_used)}</span>
              <span className="opacity-40">/</span>
              <span>{formatFileSize(user.storage_quota)}</span>
            </div>
          )}

          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-bg-sunken)] transition-colors"
          >
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {actualTheme === 'light' ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1118.21 3 7 7 0 0021 12.79z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              )}
            </svg>
          </button>

          {/* 用户菜单 */}
          <div className="relative group">
            <button className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-apple-indigo flex items-center justify-center text-white font-semibold text-[13px] shadow-apple-sm hover:shadow-apple-md transition-all">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </button>

            {/* 下拉菜单 */}
            <AnimatePresence>
              <div className="absolute right-0 top-full mt-2 w-56 origin-top-right scale-95 opacity-0 invisible group-hover:scale-100 group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="glass-panel p-1.5">
                  <div className="px-3 py-2.5 mb-1">
                    <p className="font-medium text-[13px]">{user?.username}</p>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">{user?.email || user?.role}</p>
                  </div>
                  <div className="h-px bg-[var(--color-border)] mx-2 my-1" />
                  <Link
                    to="/settings"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    设置
                  </Link>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] text-apple-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    退出登录
                  </button>
                </div>
              </div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  )
}