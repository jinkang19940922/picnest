import { useEffect, useState } from 'react'
import { trashApi } from '@/api/trash'
import { imagesApi } from '@/api/images'
import type { ImageItem } from '@/types'
import { formatFileSize, formatDate } from '@/api/client'
import clsx from 'clsx'

export default function Trash() {
  const [images, setImages] = useState<ImageItem[]>([])
  const [meta, setMeta] = useState({ page: 1, per_page: 24, total: 0, total_pages: 0 })
  const [isLoading, setIsLoading] = useState(true)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const fetchTrash = async (page = 1) => {
    setIsLoading(true)
    try {
      const res = await trashApi.getTrash(page)
      setImages(res.data.data)
      setMeta(res.data.meta)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTrash()
  }, [])

  const handleRestore = async (id: string) => {
    await imagesApi.restoreImage(id)
    fetchTrash()
  }

  const handlePermanentDelete = async (id: string) => {
    if (!confirm('确定永久删除吗？此操作不可恢复！')) return
    await imagesApi.permanentDelete(id)
    fetchTrash()
  }

  const handleEmptyTrash = async () => {
    if (!confirm('确定清空回收站吗？此操作不可恢复！')) return
    await trashApi.emptyTrash()
    fetchTrash()
  }

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds)
    if (newSet.has(id)) newSet.delete(id)
    else newSet.add(id)
    setSelectedIds(newSet)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">🗑️ 回收站</h1>
          <p className="text-[var(--color-text-secondary)]">
            共有 {meta.total} 个项目，30 天后自动清理
          </p>
        </div>

        {images.length > 0 && (
          <button
            onClick={handleEmptyTrash}
            className="px-4 py-2 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
          >
            清空回收站
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl skeleton" />
          ))}
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-20 h-20 rounded-2xl bg-[var(--color-surface)] flex items-center justify-center text-4xl mb-4">
            🗑️
          </div>
          <h3 className="text-lg font-medium mb-2">回收站是空的</h3>
          <p className="text-[var(--color-text-secondary)]">
            删除的图片会出现在这里
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className={clsx(
                'rounded-xl overflow-hidden border-2 transition-all cursor-pointer',
                selectedIds.has(image.id)
                  ? 'border-primary-500'
                  : 'border-transparent hover:border-[var(--color-border)]'
              )}
              onClick={() => toggleSelect(image.id)}
            >
              <div className="relative bg-[var(--color-surface)] aspect-square">
                <img
                  src={image.thumbnails?.small || image.url}
                  alt={image.original_name}
                  className="w-full h-full object-cover"
                />

                {/* 悬停操作 */}
                <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleRestore(image.id) }}
                    className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium"
                  >
                    恢复
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handlePermanentDelete(image.id) }}
                    className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-sm font-medium"
                  >
                    删除
                  </button>
                </div>
              </div>

              <div className="p-2 bg-[var(--color-surface)]">
                <p className="text-xs truncate">{image.original_name}</p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {formatFileSize(image.file_size)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 分页 */}
      {meta.total_pages > 1 && (
        <div className="mt-8 flex justify-center gap-2">
          {Array.from({ length: meta.total_pages }).map((_, i) => (
            <button
              key={i}
              onClick={() => fetchTrash(i + 1)}
              className={clsx(
                'w-10 h-10 rounded-lg font-medium transition-colors',
                meta.page === i + 1
                  ? 'bg-primary-500 text-white'
                  : 'bg-[var(--color-surface)] hover:bg-[var(--color-border)]'
              )}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}