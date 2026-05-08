import { useEffect } from 'react'
import { useFolderStore } from '@/stores/folderStore'
import DropZone from '@/components/Upload/DropZone'
import { useNavigate } from 'react-router-dom'

export default function UploadPage() {
  const { folders, fetchFolders, selectedFolderId } = useFolderStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchFolders()
  }, [])

  const handleUploadComplete = () => {
    // 上传完成后可选择跳转
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">📤 上传图片</h1>
        <p className="text-[var(--color-text-secondary)]">
          支持拖拽、粘贴、点击上传多种方式
        </p>
      </div>

      {/* 上传区域 */}
      <DropZone
        folderId={selectedFolderId || undefined}
        onUploadComplete={handleUploadComplete}
      />

      {/* 使用提示 */}
      <div className="mt-8 p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--color-border)]">
        <h3 className="font-medium mb-3">💡 使用提示</h3>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-2">
          <li>• 拖拽图片到上传区域即可快速上传</li>
          <li>• 支持 <kbd className="px-1.5 py-0.5 rounded bg-[var(--color-border)] text-xs">Ctrl+V</kbd> 粘贴截图</li>
          <li>• 最多支持同时上传 500 个文件</li>
          <li>• 支持格式：JPG, PNG, GIF, WebP, AVIF, SVG</li>
          <li>• 单个文件大小限制：100MB</li>
        </ul>
      </div>

      {/* 最近上传预览（如果需要可扩展） */}
    </div>
  )
}