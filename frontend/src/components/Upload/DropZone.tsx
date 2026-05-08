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

        const res = await uploadApi.uploadImage(file, folderId)
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
    accept: {
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.avif', '.svg'],
    },
    disabled: uploading,
  })

  return (
    <div className="space-y-4">
      {/* 拖拽区域 */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer',
          isDragActive && !isDragReject && 'border-primary-500 bg-primary-50 dark:bg-primary-900/20',
          isDragReject && 'border-red-500 bg-red-50 dark:bg-red-900/20',
          !isDragActive && 'border-[var(--color-border)] hover:border-primary-300 hover:bg-[var(--color-surface)]',
          uploading && 'cursor-wait opacity-70'
        )}
      >
        <input {...getInputProps()} />

        <motion.div
          animate={{ y: isDragActive ? -8 : 0 }}
          className="text-6xl mb-4"
        >
          {isDragActive ? (isDragReject ? '❌' : '📥') : '📤'}
        </motion.div>

        <h3 className="text-lg font-medium mb-2">
          {isDragActive
            ? isDragReject
              ? '不支持的文件类型'
              : '释放以上传'
            : '拖拽图片到此处'
          }
        </h3>

        <p className="text-sm text-[var(--color-text-secondary)] mb-4">
          支持 JPG, PNG, GIF, WebP, AVIF, SVG
        </p>

        <p className="text-xs text-[var(--color-text-secondary)]">
          或点击选择文件（最多 {maxFiles} 个）
        </p>
      </div>

      {/* 上传进度 */}
      {uploading && Object.keys(progress).length > 0 && (
        <div className="space-y-2">
          {Object.entries(progress).map(([name, percent]) => (
            <div key={name} className="flex items-center gap-3">
              <span className="text-sm truncate flex-1">{name}</span>
              <div className="w-32 h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-[var(--color-text-secondary)] w-12 text-right">
                {percent}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 上传结果 */}
      {!uploading && results.success.length > 0 && (
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <p className="text-sm text-green-700 dark:text-green-300">
            ✅ 成功上传 {results.success.length} 个文件
          </p>
          {results.errors.length > 0 && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              ❌ {results.errors.length} 个文件上传失败
            </p>
          )}
        </div>
      )}
    </div>
  )
}