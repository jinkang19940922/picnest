import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion } from 'framer-motion'
import { uploadApi } from '@/api/upload'
import clsx from 'clsx'

interface DropZoneProps {
  folderId?: string
  onUploadComplete?: () => void
  maxFiles?: number
}

export default function DropZone({ folderId, onUploadComplete, maxFiles = 500 }: DropZoneProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [results, setResults] = useState<{ success: string[]; errors: string[] }>({
    success: [],
    errors: [],
  })

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return

    setUploading(true)
    setProgress({})
    setResults({ success: [], errors: [] })

    const files = acceptedFiles.slice(0, maxFiles)
    const success: string[] = []
    const errors: string[] = []

    for (const file of files) {
      try {
        setProgress((p) => ({ ...p, [file.name]: 0 }))
        await uploadApi.uploadImage(file, folderId)
        success.push(file.name)
        setProgress((p) => ({ ...p, [file.name]: 100 }))
      } catch (err: any) {
        errors.push(`${file.name}: ${err.response?.data?.detail || '上传失败'}`)
      }
    }

    setResults({ success, errors })
    setUploading(false)
    onUploadComplete?.()
  }, [folderId, maxFiles, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'] },
    disabled: uploading,
  })

  return (
    <div className="space-y-5">
      {/* 拖拽区域 */}
      <div
        {...getRootProps()}
        className={clsx(
          'upload-zone group',
          isDragActive && !isDragReject && 'drag-active',
          isDragReject && 'border-apple-red bg-red-50 dark:bg-red-900/10',
          uploading && 'opacity-60 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={{ y: isDragActive ? -6 : 0, scale: isDragActive ? 1.05 : 1 }}
          className="text-5xl mb-4"
        >
          {isDragActive ? (isDragReject ? '🚫' : '📥') : '☁️'}
        </motion.div>

        <h3 className="text-[17px] font-semibold mb-1.5 text-[var(--color-text-primary)]">
          {isDragActive
            ? isDragReject
              ? '不支持的文件类型'
              : '释放以上传'
            : '拖拽图片到这里'}
        </h3>

        <p className="text-[13px] text-[var(--color-text-secondary)] mb-3">
          支持 JPG、PNG、GIF、WebP、AVIF、SVG
        </p>

        <p className="text-[12px] text-[var(--color-text-tertiary)]">
          或点击选择 · 最多 {maxFiles} 个文件
        </p>
      </div>

      {/* 上传进度 */}
      {uploading && Object.keys(progress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(progress).map(([name, percent]) => (
            <div key={name} className="flex items-center gap-3 px-1">
              <span className="text-[12px] truncate flex-1 text-[var(--color-text-secondary)]">{name}</span>
              <div className="w-32">
                <div className="progress-apple">
                  <div className="progress-apple-fill" style={{ width: `${percent}%` }} />
                </div>
              </div>
              <span className="text-[11px] text-[var(--color-text-tertiary)] w-10 text-right">
                {percent}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 上传结果 */}
      {!uploading && results.success.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
        >
          <p className="text-[14px] text-green-700 dark:text-green-300 font-medium">
            ✓ 成功上传 {results.success.length} 个文件
          </p>
          {results.errors.length > 0 && (
            <p className="text-[13px] text-apple-red mt-2">
              ✗ {results.errors.length} 个文件上传失败
            </p>
          )}
        </motion.div>
      )}
    </div>
  )
}