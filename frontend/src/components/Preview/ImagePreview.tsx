import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ImageItem } from '@/types'
import { formatFileSize, formatDate, copyToClipboard } from '@/api/client'
import clsx from 'clsx'

interface ImagePreviewProps {
  image: ImageItem | null
  onClose: () => void
  onDelete?: (id: string) => void
}

type LinkFormat = 'markdown' | 'html' | 'url' | 'bbcode'

export default function ImagePreview({ image, onClose, onDelete }: ImagePreviewProps) {
  const [linkFormat, setLinkFormat] = useState<LinkFormat>('markdown')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [copied, setCopied] = useState(false)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const positionRef = useRef({ x: 0, y: 0 })

  const scaleRef = useRef(1)

  // 切换图片时重置缩放和平移
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    positionRef.current = { x: 0, y: 0 }
    scaleRef.current = 1
  }, [image?.id])

  useEffect(() => {
    scaleRef.current = scale
  }, [scale])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // 阻止所有滚轮事件穿透到背景
  const handleWheelCapture = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.stopPropagation()
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.15 : 0.15
    const next = Math.min(Math.max(scaleRef.current + delta, 0.3), 5)
    if (next < 1) {
      setPosition({ x: 0, y: 0 })
      positionRef.current = { x: 0, y: 0 }
    }
    setScale(next)
  }, [])

  const handleDoubleClick = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
    positionRef.current = { x: 0, y: 0 }
    scaleRef.current = 1
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    setIsDragging(true)
    dragStart.current = { x: e.clientX - positionRef.current.x, y: e.clientY - positionRef.current.y }
  }, [scale])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return
    const nx = e.clientX - dragStart.current.x
    const ny = e.clientY - dragStart.current.y
    positionRef.current = { x: nx, y: ny }
    setPosition({ x: nx, y: ny })
  }, [isDragging])

  const handleMouseUp = useCallback(() => setIsDragging(false), [])

  if (!image) return null

  const imageUrl = `${window.location.origin}${image.url}`

  const getLinkText = () => {
    switch (linkFormat) {
      case 'markdown': return `![${image.original_name}](${imageUrl})`
      case 'html': return `<img src="${imageUrl}" alt="${image.original_name}"/>`
      case 'url': return imageUrl
      case 'bbcode': return `[img]${imageUrl}[/img]`
      default: return imageUrl
    }
  }

  const handleCopy = async () => {
    await copyToClipboard(getLinkText())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        style={{ overscrollBehavior: 'none' }}
        onClick={onClose}
        onWheel={(e) => { e.stopPropagation(); e.preventDefault() }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-5xl max-h-[90vh] w-full bg-[var(--color-bg)] rounded-2xl overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 顶部工具栏 */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/60 to-transparent">
            <span className="text-white font-medium truncate max-w-xs">{image.original_name}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowLinkModal(true)} title="复制图片链接"
                className="px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-colors">
                📋 复制链接
              </button>
              <button onClick={() => { if (confirm('确定删除该图片吗？')) onDelete?.(image.id) }} title="删除图片"
                className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-red-500/70 rounded-lg text-white transition-colors">
                🗑️
              </button>
              <button onClick={onClose} title="关闭 (Esc)"
                className="w-8 h-8 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-lg text-white transition-colors">
                ✕
              </button>
            </div>
          </div>

          {/* 图片 — 滚轮缩放 + 拖拽平移 */}
          <div
            className={clsx(
              'flex items-center justify-center bg-black/90 min-h-[400px] max-h-[75vh] overflow-hidden select-none',
              scale > 1 ? 'cursor-grab' : '',
              isDragging ? 'cursor-grabbing' : ''
            )}
            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={imageUrl}
              alt={image.original_name}
              className="max-w-full max-h-[75vh] object-contain pointer-events-none"
              style={{
                transform: `scale(${scale}) translate(${position.x / scale}px, ${position.y / scale}px)`,
                transition: isDragging ? 'none' : 'transform 0.1s ease-out',
              }}
              draggable={false}
            />
          </div>

          {/* 底部信息 */}
          <div className="px-4 py-3 border-t border-[var(--color-border)] bg-[var(--color-bg)]">
            <div className="flex items-center flex-wrap gap-3 text-sm text-[var(--color-text-secondary)]">
              {image.width && image.height && (
                <><span>{image.width} × {image.height}</span><span className="text-[var(--color-border)]">·</span></>
              )}
              <span>{formatFileSize(image.file_size)}</span>
              <span className="text-[var(--color-border)]">·</span>
              <span>{formatDate(image.created_at)}</span>
              <span className="text-[var(--color-border)]">·</span>
              <span>👁 {image.view_count}</span>
              <span className="text-[var(--color-border)]">·</span>
              <span title="双击重置缩放" className="cursor-pointer hover:text-primary-500 transition-colors">
                {Math.round(scale * 100)}%
              </span>
              {image.tags?.length > 0 && (
                <div className="flex gap-1">
                  {image.tags.map((tag) => (
                    <span key={tag.id} className="px-2 py-0.5 rounded-full text-xs"
                      style={{ backgroundColor: tag.color + '20', color: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* 链接复制弹窗 */}
        <AnimatePresence>
          {showLinkModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
              onClick={() => setShowLinkModal(false)}
            >
              <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.92, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-[17px] font-semibold mb-5 text-[var(--color-text-primary)]">复制图片链接</h3>

                <div className="flex gap-1.5 p-1 bg-[var(--color-bg-sunken)] rounded-xl mb-5">
                  {([
                    { key: 'markdown', label: 'MARKDOWN' },
                    { key: 'html', label: 'HTML' },
                    { key: 'url', label: 'URL' },
                    { key: 'bbcode', label: 'BBCode' },
                  ] as const).map(({ key, label }) => (
                    <button key={key} onClick={() => setLinkFormat(key)}
                      className={clsx(
                        'flex-1 py-1.5 rounded-lg text-[12px] font-semibold tracking-wide transition-all',
                        linkFormat === key
                          ? 'bg-white text-[var(--color-text-primary)] shadow-sm'
                          : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
                      )}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-[var(--color-bg-sunken)] rounded-xl font-mono text-[13px] text-[var(--color-text-primary)] mb-5 break-all leading-relaxed border border-[var(--color-border)]">
                  {getLinkText()}
                </div>

                <div className="flex gap-3">
                  <button onClick={handleCopy}
                    className={clsx(
                      'flex-1 py-3 rounded-xl font-semibold text-[14px] transition-all shadow-sm',
                      copied ? 'bg-green-500 text-white' : 'bg-primary-500 text-white hover:bg-primary-600'
                    )}>
                    {copied ? '已复制到剪贴板' : '复制链接'}
                  </button>
                  <button onClick={() => setShowLinkModal(false)}
                    className="px-5 py-3 rounded-xl font-semibold text-[14px] bg-[var(--color-bg-sunken)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)] transition-colors">
                    关闭
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
