import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ImageItem } from '@/types'
import { formatFileSize } from '@/api/client'
import clsx from 'clsx'

interface ImageCardProps {
  image: ImageItem
  isSelected: boolean
  onSelect: () => void
  onPreview: () => void
}

export default function ImageCard({ image, isSelected, onSelect, onPreview }: ImageCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [showActions, setShowActions] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      onSelect()
    } else {
      onPreview()
    }
  }

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelect()
  }

  const thumbnailUrl = image.thumbnails?.medium || image.url

  return (
    <div
      className={clsx(
        'relative rounded-xl overflow-hidden cursor-pointer image-card group',
        isSelected && 'ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-[var(--color-bg)]'
      )}
      onMouseEnter={() => { setIsHovered(true); setShowActions(true) }}
      onMouseLeave={() => { setIsHovered(false); setShowActions(false) }}
      onClick={handleClick}
    >
      {/* 图片 */}
      <div className="relative bg-[var(--color-surface)]">
        {!imageLoaded && (
          <div className="absolute inset-0 skeleton" />
        )}
        <img
          src={thumbnailUrl}
          alt={image.original_name}
          className={clsx(
            'w-full object-cover transition-opacity duration-300',
            imageLoaded ? 'opacity-100' : 'opacity-0'
          )}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
        />

        {/* 悬停遮罩 */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="text-white text-sm font-medium text-center truncate w-full mb-1">
                {image.original_name}
              </p>
              <p className="text-white/70 text-xs mb-3">
                {image.width && image.height && `${image.width} × ${image.height}`}
                {' • '}
                {formatFileSize(image.file_size)}
              </p>

              <div className="flex gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); onPreview() }}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors"
                >
                  👁 预览
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); copyLink() }}
                  className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-xs font-medium transition-colors"
                >
                  📋 链接
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 选择框 */}
        <button
          onClick={handleCheckboxClick}
          className={clsx(
            'absolute top-2 left-2 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all',
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white'
              : 'border-white/70 bg-black/30 opacity-0 group-hover:opacity-100'
          )}
        >
          {isSelected && <span className="text-xs">✓</span>}
        </button>

        {/* 收藏标识 */}
        {image.is_starred && (
          <div className="absolute top-2 right-2 text-yellow-400 text-sm">⭐</div>
        )}
      </div>

      {/* 底部信息 */}
      <div className="p-2 bg-[var(--color-surface)]">
        <p className="text-xs text-[var(--color-text-secondary)] truncate">
          {image.original_name}
        </p>
      </div>
    </div>
  )
}

async function copyLink() {
  // 复制逻辑在 LinkModal 中处理
}