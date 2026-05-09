import { motion } from 'framer-motion'
import type { ImageItem } from '@/types'
import clsx from 'clsx'
import { useState } from 'react'

interface ImageCardProps {
  image: ImageItem
  isSelected: boolean
  onSelect: () => void
  onPreview: () => void
  onDelete?: (id: string) => void
}

function formatBytes(bytes: number): string {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function ImageCard({ image, isSelected, onSelect, onPreview, onDelete }: ImageCardProps) {
  const [imgError, setImgError] = useState(false)

  const thumbUrl =
    image.thumbnails?.large ||
    image.thumbnails?.medium ||
    image.thumbnails?.small ||
    image.url

  const displayUrl = imgError
    ? (image.thumbnails?.small || image.url)
    : thumbUrl

  const infoParts: string[] = []
  if (image.width && image.height) infoParts.push(`${image.width} x ${image.height}`)
  if (image.file_size) infoParts.push(formatBytes(image.file_size))

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={clsx(
        'group relative rounded-2xl overflow-hidden cursor-pointer break-inside-avoid',
        'bg-[var(--color-surface)]',
        'shadow-[0_2px_8px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.14)]',
        'transition-all duration-300 ease-out',
        isSelected
          ? 'ring-[2.5px] ring-primary-500 shadow-[0_0_0_4px_rgba(0,122,255,0.12),0_8px_32px_rgba(0,0,0,0.14)]'
          : 'hover:scale-[1.025] hover:-translate-y-0.5'
      )}
      onClick={onPreview}
    >
      {/* Image */}
      <div className="relative overflow-hidden">
        <img
          src={displayUrl}
          alt={image.original_name}
          loading="lazy"
          onError={() => setImgError(true)}
          className="w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          style={{
            aspectRatio: image.width && image.height ? `${image.width}/${image.height}` : 'auto',
            minHeight: '80px',
          }}
        />

        {/* Load error placeholder */}
        {imgError && (
          <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg-sunken)]">
            <span className="text-3xl opacity-30">IMG</span>
          </div>
        )}

        {/* Top gradient */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Select checkbox */}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect() }}
          className={clsx(
            'absolute top-2.5 left-2.5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200',
            isSelected
              ? 'bg-primary-500 border-primary-500 text-white scale-100'
              : 'bg-white/50 backdrop-blur-sm border-white/80 text-transparent group-hover:text-[var(--color-text-secondary)] group-hover:scale-110'
          )}
        >
          {isSelected && (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* Top-right action buttons */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-x-2 group-hover:translate-x-0">
          <ActionButton icon="eye" title="预览大图" onClick={(e) => { e.stopPropagation(); onPreview() }} />
          <ActionButton
            icon="trash"
            title="删除图片"
            onClick={(e) => {
              e.stopPropagation()
              if (confirm('确定删除该图片吗？')) onDelete?.(image.id)
            }}
          />
        </div>

        {/* Bottom info overlay */}
        <div className="absolute inset-x-0 bottom-0 p-3 pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
          <div className="bg-black/55 backdrop-blur-md rounded-xl p-2.5">
            <p className="text-white text-[11px] font-medium truncate leading-tight">
              {image.original_name}
            </p>
            {infoParts.length > 0 && (
              <p className="text-white/70 text-[10px] mt-0.5">
                {infoParts.join(' · ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function ActionButton({ icon, onClick, title }: { icon: string; onClick: (e: React.MouseEvent) => void; title?: string }) {
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
      title={title}
      className="w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm text-white flex items-center justify-center hover:bg-black/70 transition-colors"
    >
      {icons[icon]}
    </button>
  )
}
