import { motion } from 'framer-motion'
import ImageCard from './ImageCard'
import type { ImageItem } from '@/types'
import clsx from 'clsx'
import { useRef } from 'react'

interface MasonryGridProps {
  images: ImageItem[]
  isLoading: boolean
  selectedIds: Set<string>
  onSelect: (id: string) => void
  onPreview: (image: ImageItem) => void
  onLoadMore?: () => void
  isLoadingMore?: boolean
  hasMore?: boolean
  onDelete?: (id: string) => void
}

// 瀑布流加载时的骨架屏 — 随机高度模拟真实图片
const SKELETON_HEIGHTS = [220, 300, 260, 340, 200, 280, 320, 240, 300, 260]

function SkeletonCard({ index }: { index: number }) {
  const h = SKELETON_HEIGHTS[index % SKELETON_HEIGHTS.length]
  return (
    <div className="rounded-2xl overflow-hidden break-inside-avoid">
      <div
        className="skeleton rounded-2xl"
        style={{ height: h }}
      />
    </div>
  )
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
  onDelete,
}: MasonryGridProps) {
  const sentinelRef = useRef<HTMLDivElement>(null)

  if (isLoading) {
    return (
      <div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:columns-3 xl:columns-4 gap-3">
          {Array.from({ length: 16 }).map((_, i) => (
            <SkeletonCard key={i} index={i} />
          ))}
        </div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="text-6xl mb-5 opacity-30">📷</div>
        <h3 className="text-[17px] font-semibold mb-2 text-[var(--color-text-primary)]">
          还没有上传任何图片
        </h3>
        <p className="text-[14px] text-[var(--color-text-secondary)] max-w-xs">
          点击上方「上传」按钮或拖拽文件到此处，开始你的图床之旅
        </p>
      </div>
    )
  }

  return (
    <div>
      {/* 瀑布流 — CSS columns 实现 */}
      <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-3 space-y-3">
        {images.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{
              delay: Math.min(index * 0.025, 0.6),
              duration: 0.4,
              ease: [0.25, 0.1, 0.25, 1],
            }}
            className="break-inside-avoid"
          >
            <ImageCard
              image={image}
              isSelected={selectedIds.has(image.id)}
              onSelect={() => onSelect(image.id)}
              onPreview={() => onPreview(image)}
              onDelete={onDelete}
            />
          </motion.div>
        ))}
      </div>

      {/* 无限滚动 sentinel */}
      <div ref={sentinelRef} className="h-4" />

      {/* 加载更多状态 */}
      {hasMore && (
        <div className="mt-8 mb-4 flex justify-center">
          {isLoadingMore ? (
            <div className="flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[var(--color-surface)] shadow-apple-sm text-[13px] text-[var(--color-text-secondary)]">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              加载中...
            </div>
          ) : (
            <button
              onClick={onLoadMore}
              className="px-6 py-2.5 rounded-full bg-[var(--color-text-primary)] text-white text-[13px] font-medium shadow-apple-sm hover:opacity-80 transition-opacity"
            >
              加载更多
            </button>
          )}
        </div>
      )}

      {/* 全部加载完毕 */}
      {!hasMore && images.length > 8 && (
        <p className="text-center text-[12px] text-[var(--color-text-tertiary)] mt-6 mb-2">
          — 已加载全部 {images.length} 张图片 —
        </p>
      )}
    </div>
  )
}
