import { useEffect, useState } from 'react'
import { statsApi } from '@/api/stats'
import { authApi } from '@/api/auth'
import type { StatsOverview, StorageStats } from '@/types'
import { formatFileSize } from '@/api/client'

export default function Stats() {
  const [overview, setOverview] = useState<StatsOverview | null>(null)
  const [storage, setStorage] = useState<StorageStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [storageQuota, setStorageQuota] = useState(1099511627776) // default 1 TB

  useEffect(() => {
    const fetch = async () => {
      try {
        const [overviewRes, storageRes, userRes] = await Promise.all([
          statsApi.getOverview(),
          statsApi.getStorage(),
          authApi.getMe(),
        ])
        setOverview(overviewRes.data)
        setStorage(storageRes.data)
        setStorageQuota(userRes.data.storage_quota || 1099511627776)
      } finally {
        setIsLoading(false)
      }
    }
    fetch()
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl skeleton" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">📊 统计概览</h1>
        <p className="text-[var(--color-text-secondary)]">查看你的图床数据</p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon="🖼️"
          label="图片总数"
          value={overview?.total_images || 0}
        />
        <StatCard
          icon="💾"
          label="存储用量"
          value={formatFileSize(overview?.total_storage || 0)}
        />
        <StatCard
          icon="📅"
          label="今日上传"
          value={overview?.today_uploads || 0}
        />
        <StatCard
          icon="📆"
          label="本月上传"
          value={overview?.month_uploads || 0}
        />
      </div>

      {/* 存储进度 */}
      <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">💾 存储空间</h3>
          <span className="text-sm text-[var(--color-text-secondary)]">
            {storage ? `${formatFileSize(storage.used)} / ${formatFileSize(storage.quota)}` : `${formatFileSize(overview?.total_storage || 0)} / 1 TB`}
          </span>
        </div>
        <div className="h-4 bg-[var(--color-border)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
            style={{ width: `${Math.min(storage?.used_percent || (overview?.total_storage ? (overview.total_storage / storageQuota) * 100 : 0), 100)}%` }}
          />
        </div>
        <p className="text-sm text-[var(--color-text-secondary)] mt-2">
          {storage ? `已使用 ${storage.used_percent}%` : `已使用 ${((overview?.total_storage || 0) / storageQuota * 100).toFixed(2)}%`}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 文件夹分布 */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h3 className="font-medium mb-4">📁 文件夹分布</h3>
          {overview?.top_folders?.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {overview?.top_folders?.slice(0, 5).map((folder, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-sm w-20 truncate">{folder.name}</span>
                  <div className="flex-1 h-2 bg-[var(--color-border)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500"
                      style={{
                        width: `${(folder.count / (overview?.total_images || 1)) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)] w-12 text-right">
                    {folder.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 标签分布 */}
        <div className="p-6 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)]">
          <h3 className="font-medium mb-4">🏷️ 标签分布</h3>
          {overview?.top_tags?.length === 0 ? (
            <p className="text-sm text-[var(--color-text-secondary)]">暂无数据</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {overview?.top_tags?.slice(0, 8).map((tag) => (
                <span
                  key={tag.name}
                  className="px-3 py-1.5 rounded-full text-sm font-medium"
                  style={{
                    backgroundColor: tag.color + '20',
                    color: tag.color,
                  }}
                >
                  {tag.name} ({tag.count})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: string; label: string; value: number | string }) {
  return (
    <div className="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-[var(--color-text-secondary)]">{label}</p>
    </div>
  )
}