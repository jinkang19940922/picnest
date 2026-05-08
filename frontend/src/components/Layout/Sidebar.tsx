import { useEffect } from 'react'
import { useFolderStore } from '@/stores/folderStore'
import { useImageStore } from '@/stores/imageStore'
import clsx from 'clsx'

export default function Sidebar() {
  const { folders, fetchFolders, selectedFolderId, selectFolder } = useFolderStore()
  const { fetchImages } = useImageStore()

  useEffect(() => {
    fetchFolders()
  }, [])

  const handleFolderClick = (folderId: string | null) => {
    selectFolder(folderId)
    fetchImages({ folder_id: folderId || undefined })
  }

  const renderFolder = (folder: any, level = 0) => {
    const isSelected = selectedFolderId === folder.id
    const hasChildren = folder.children?.length > 0

    return (
      <div key={folder.id}>
        <button
          onClick={() => handleFolderClick(folder.id)}
          className={clsx(
            'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all',
            isSelected
              ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
          )}
          style={{ paddingLeft: `${12 + level * 16}px` }}
        >
          <span style={{ color: folder.color }}>📁</span>
          <span className="flex-1 text-left truncate">{folder.name}</span>
          <span className="text-xs opacity-60">{folder.image_count}</span>
        </button>
        {hasChildren && (
          <div className="ml-2">
            {folder.children.map((child: any) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <aside className="w-56 flex-shrink-0 border-r border-[var(--color-border)] p-4 overflow-y-auto">
      {/* 全部图片 */}
      <button
        onClick={() => handleFolderClick(null)}
        className={clsx(
          'w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm mb-4 transition-all',
          selectedFolderId === null
            ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]'
        )}
      >
        <span>📷</span>
        <span>全部图片</span>
      </button>

      {/* 文件夹列表 */}
      <div className="space-y-1">
        <p className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          文件夹
        </p>
        {folders.length === 0 ? (
          <p className="px-3 py-4 text-center text-sm text-[var(--color-text-secondary)]">
            暂无文件夹
          </p>
        ) : (
          folders.map((folder) => renderFolder(folder))
        )}
      </div>

      {/* 快捷操作 */}
      <div className="mt-6 pt-4 border-t border-[var(--color-border)]">
        <p className="px-3 py-2 text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
          快捷操作
        </p>
        <button className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] transition-all">
          <span>➕</span>
          <span>新建文件夹</span>
        </button>
      </div>
    </aside>
  )
}