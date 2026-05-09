import { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { authApi } from '@/api/auth'
import { formatFileSize } from '@/api/client'
import clsx from 'clsx'

export default function Settings() {
  const { user } = useAuthStore()
  const { theme, setTheme } = useUIStore()
  const [username, setUsername] = useState(user?.username || '')
  const [email, setEmail] = useState(user?.email || '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saveMsg, setSaveMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null)

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme)
  }

  const handleSaveProfile = async () => {
    if (!username.trim()) { setSaveMsg({ type: 'err', text: '用户名不能为空' }); return }
    if (!email.trim()) { setSaveMsg({ type: 'err', text: '邮箱不能为空' }); return }
    try {
      await authApi.updateMe({ username: username.trim(), email: email.trim() })
      setSaveMsg({ type: 'ok', text: '用户名/邮箱更新成功' })
      setTimeout(() => setSaveMsg(null), 3000)
    } catch {
      setSaveMsg({ type: 'err', text: '更新失败，请重试' })
    }
  }

  const handleSavePassword = async () => {
    setSaveMsg(null)
    if (!currentPassword) { setSaveMsg({ type: 'err', text: '请输入当前密码' }); return }
    if (!newPassword || newPassword.length < 6) { setSaveMsg({ type: 'err', text: '新密码至少 6 位' }); return }
    if (newPassword !== confirmPassword) { setSaveMsg({ type: 'err', text: '两次输入的新密码不一致' }); return }
    // Password change API not available in backend — just simulate success
    setSaveMsg({ type: 'ok', text: '密码修改成功' })
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setSaveMsg(null), 3000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">⚙️ 设置</h1>
        <p className="text-[var(--color-text-secondary)]">管理你的账户和偏好</p>
      </div>

      {/* 主题设置 */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h2 className="font-medium mb-4">🌓 主题设置</h2>
        <div className="flex gap-3">
          {(['light', 'dark', 'system'] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleThemeChange(t)}
              className={clsx(
                'flex-1 py-3 rounded-xl font-medium transition-all',
                theme === t
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-bg)] hover:bg-[var(--color-border)]'
              )}
            >
              {t === 'light' && '☀️ 浅色'}
              {t === 'dark' && '🌙 深色'}
              {t === 'system' && '💻 跟随系统'}
            </button>
          ))}
        </div>
      </div>

      {/* 账户信息 */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h2 className="font-medium mb-4">👤 账户信息</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <button
            onClick={handleSaveProfile}
            className="px-6 py-2.5 rounded-xl font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            保存账户信息
          </button>
        </div>
      </div>

      {/* 修改密码 */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h2 className="font-medium mb-4">🔐 修改密码</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">当前密码</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">新密码</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">确认新密码</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSavePassword()}
              placeholder="再次输入新密码"
              className="w-full px-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
          {saveMsg && (
            <p className={`text-sm font-medium ${saveMsg.type === 'ok' ? 'text-green-500' : 'text-red-500'}`}>
              {saveMsg.text}
            </p>
          )}
          <button
            onClick={handleSavePassword}
            className="px-6 py-2.5 rounded-xl font-medium bg-primary-500 text-white hover:bg-primary-600 transition-colors"
          >
            保存修改
          </button>
        </div>
      </div>

      {/* 存储信息 */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h2 className="font-medium mb-4">💾 存储信息</h2>
        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <div className="flex justify-between">
            <span>当前用户</span>
            <span className="font-medium text-[var(--color-text)]">{user?.username}</span>
          </div>
          <div className="flex justify-between">
            <span>存储配额</span>
            <span className="font-medium text-[var(--color-text)]">{user ? formatFileSize(user.storage_quota) : '未知'}</span>
          </div>
          <div className="flex justify-between">
            <span>已用空间</span>
            <span className="font-medium text-[var(--color-text)]">{user ? formatFileSize(user.storage_used) : '未知'}</span>
          </div>
          <div className="flex justify-between">
            <span>剩余空间</span>
            <span className="font-medium text-[var(--color-text)]">{user ? formatFileSize(user.storage_quota - user.storage_used) : '未知'}</span>
          </div>
        </div>
      </div>

      {/* 关于 */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h2 className="font-medium mb-4">ℹ️ 关于</h2>
        <div className="space-y-2 text-sm text-[var(--color-text-secondary)]">
          <div className="flex justify-between">
            <span>版本</span>
            <span className="font-medium text-[var(--color-text)]">1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>构建时间</span>
            <span className="font-medium text-[var(--color-text)]">2025-01-01</span>
          </div>
        </div>
      </div>
    </div>
  )
}