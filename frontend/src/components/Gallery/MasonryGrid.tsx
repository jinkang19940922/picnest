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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 12 }).map((_, i) => (
          <SkeletonCard key={i} index={i} />
        ))}
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📷</div>
        <h3 className="text-[17px] font-semibold mb-1.5 text-[var(--color-text-primary)]">还没有上传任何图片</h3>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          点击上方「上传」按钮开始你的图床之旅
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* 图片计数 */}
      <div className="flex items-center justify-between mb-4 px-0.5">
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          共 {images.length} 张图片
        </p>
        {selectedIds.size > 0 && (
          <span className="text-[12px] text-primary-500 font-medium">
            已选择 {selectedIds.size} 项
          </span>
        )}
      </div>

      {/* 瀑布流 */}
      <div className="columns-1 sm:columns-2 md:columns-3 lg:columns-4 gap-3 space-y-3">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(index * 0.03, 0.5), duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
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
              'flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-medium transition-all',
              isLoadingMore
                ? 'bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)]'
                : 'bg-[var(--color-text-primary)] text-white hover:opacity-85'
            )}
          >
            {isLoadingMore ? (
              <>
                <div className="spinner-apple w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                加载中...
              </>
            ) : (
              '加载更多'
            )}
          </button>
        </div>
      )}
    </div>
  )
}

function SkeletonCard({ index }: { index: number }) {
  const heights = ['h-36', 'h-52', 'h-44', 'h-60', 'h-40', 'h-48', 'h-56', 'h-44']
  const h = heights[index % heights.length]
  return (
    <div className={clsx('rounded-2xl skeleton', h)} />
  )
}