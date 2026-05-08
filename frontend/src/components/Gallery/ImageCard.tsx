import { motion } from 'framer-motion'
import type { ImageItem } from '@/types'
import clsx from 'clsx'

interface ImageCardProps {
  image: ImageItem
  isSelected: boolean
  onSelect: () => void
  onPreview: () => void
}

export default function ImageCard({ image, isSelected, onSelect, onPreview }: ImageCardProps) {
  return (
    <div
      className={clsx(
        'group relative rounded-2xl overflow-hidden cursor-pointer bg-[var(--color-surface)] shadow-apple-sm hover:shadow-apple-lg transition-all duration-300',
        isSelected && 'ring-2 ring-primary-500 ring-offset-2 ring-offset-[var(--color-bg-base)]'
      )}
      onClick={onPreview}
    >
      {/* 图片 */}
      <img
        src={image.thumbnails?.large || image.thumbnails?.medium || image.thumbnails?.small || image.url}
        alt={image.original_name}
        loading="lazy"
        className="w-full object-cover"
        style={{ aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : 'auto' }}
      />

      {/* 悬停遮罩 */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* 选择框 */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect() }}
        className={clsx(
          'absolute top-3 left-3 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
          isSelected
            ? 'bg-primary-500 border-primary-500 text-white'
            : 'bg-white/60 border-white/80 text-transparent group-hover:text-[var(--color-text-secondary)]'
        )}
      >
        {isSelected && (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* 悬停时显示的文件名 */}
      <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <p className="text-white text-[11px] font-medium truncate drop-shadow-md">
          {image.original_name}
        </p>
        {image.width && image.height && (
          <p className="text-white/70 text-[10px] mt-0.5">
            {image.width} × {image.height}
          </p>
        )}
      </div>

      {/* 操作按钮组 */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <ActionButton icon="link" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(image.url) }} />
        <ActionButton icon="eye" onClick={(e) => { e.stopPropagation(); onPreview() }} />
        <ActionButton icon="trash" onClick={(e) => { e.stopPropagation(); /* TODO: delete */ }} />
      </div>
    </div>
  )
}

function ActionButton({ icon, onClick }: { icon: string; onClick: (e: any) => void }) {
  const icons: Record<string, JSX.Element> = {
    link: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    eye: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    trash: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
      </svg>
    ),
  }

  return (
    <button
      onClick={onClick}
      className="w-7 h-7 rounded-lg bg-black/40 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/60 transition-colors"
    >
      {icons[icon]}
    </button>
  )
}