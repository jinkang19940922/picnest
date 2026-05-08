import { motion } from 'framer-motion'
import ImageCard from './ImageCard'
import type { ImageItem } from '@/types'
import clsx from 'clsx'

interface MasonryGridProps {
  images: ImageItem[]
  isLoading: boolean
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onPreview: (image: ImageItem) => void
  onLoadMore?: () => void
  isLoadingMore?: boolean
  hasMore?: boolean
}

export default function MasonryGrid({
  images,
  isLoading,
  selectedIds,
  onSelect,
  onPreview,
  onLoadMore,
  isLoadingMore,
  hasMore = true,
}: MasonryGridProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-primary-100 to-secondary-100 dark:from-primary-900/30 dark:to-secondary-900/30 flex items-center justify-center text-5xl mb-6">
          🖼️
        </div>
        <h3 className="text-xl font-medium mb-2">还没有上传任何图片</h3>
        <p className="text-[var(--color-text-secondary)]">
          点击上方「上传」按钮开始你的图床之旅
        </p>
      </div>
    )
  }

  // 响应式列数
  const getColumns = () => {
    if (typeof window === 'undefined') return 4
    const width = window.innerWidth
    if (width < 480) return 1
    if (width < 768) return 2
    if (width < 1200) return 3
    return 4
  }

  // 使用 CSS columns 实现瀑布流
  return (
    <div>
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-4 space-y-4">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.05, 0.5), duration: 0.3 }}
            className="break-inside-avoid"
          >
            <ImageCard
              image={image}
              isSelected={selectedIds.has(image.id)}
              onSelect={() => onSelect(image.id)}
              onPreview={() => onPreview(image)}
            />
          </motion.div>
        ))}
      </div>

      {/* 加载更多 */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className={clsx(
              'px-6 py-3 rounded-xl font-medium transition-all',
              isLoadingMore
                ? 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] cursor-wait'
                : 'bg-primary-500 text-white hover:bg-primary-600'
            )}
          >
            {isLoadingMore ? '加载中...' : '加载更多'}
          </button>
        </div>
      )}
    </div>
  )
}

function SkeletonCard({ index }: { index: number }) {
  // 随机高度模拟不同图片比例
  const heights = ['h-32', 'h-48', 'h-40', 'h-56', 'h-44']
  const height = heights[index % heights.length]

  return (
    <div className={clsx('rounded-xl overflow-hidden skeleton', height)} />
  )
}