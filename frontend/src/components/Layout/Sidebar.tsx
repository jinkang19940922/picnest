import { useEffect, useState } from 'react'
import { useFolderStore } from '@/stores/folderStore'
import { useImageStore } from '@/stores/imageStore'
import { useUIStore } from '@/stores/uiStore'
import clsx from 'clsx'
import { motion, AnimatePresence } from 'framer-motion'

export default function Sidebar() {
  const { folders, fetchFolders, selectedFolderId, selectFolder, createFolder } = useFolderStore()
  const { fetchImages } = useImageStore()
  const { sidebarCollapsed, toggleSidebar } = useUIStore()
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  const handleFolderClick = (folderId: string | null) => {
    selectFolder(folderId)
    fetchImages({ folder_id: folderId || undefined })
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    await createFolder(newFolderName.trim())
    setNewFolderName('')
    setIsCreatingFolder(false)
  }

  return (
    <>
      {/* 展开按钮 - 侧边栏收起时显示在左侧 */}
      <AnimatePresence>
        {sidebarCollapsed && (
          <motion.button
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            onClick={toggleSidebar}
            className="fixed left-0 top-[72px] z-30 w-8 h-8 flex items-center justify-center glass-sidebar rounded-r-xl shadow-lg hover:bg-[var(--color-bg-sunken)] transition-colors"
            title="展开侧边栏"
          >
            <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>

      {/* 侧边栏主体 */}
      <AnimatePresence>
        {!sidebarCollapsed && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="glass-sidebar overflow-y-auto flex-shrink-0"
            style={{ width: 220 }}
          >
            <div className="py-4">
              {/* 收起按钮 + 标题 */}
              <div className="flex items-center justify-between px-3 mb-2">
                <span className="text-[11px] font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                  导航
                </span>
                <button
                  onClick={toggleSidebar}
                  className="w-6 h-6 rounded flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)] transition-colors"
                  title="收起侧边栏"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              {/* 全部图片 - 主入口 */}
              <div className="px-3 mb-3">
                <button
                  onClick={() => handleFolderClick(null)}
                  className={clsx(
                    'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-200',
                    selectedFolderId === null
                      ? 'bg-primary-500 text-white shadow-apple-sm'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)]'
                  )}
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  全部图片
                </button>
              </div>

              {/* 分隔线 */}
              <div className="px-5 mb-2">
                <div className="h-px bg-[var(--color-border)]" />
              </div>

              {/* 文件夹区域 */}
              <div className="px-3 mb-3">
                <div className="flex items-center justify-between mb-1.5 px-1">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    文件夹
                  </span>
                  <button
                    onClick={() => setIsCreatingFolder(true)}
                    className="w-5 h-5 rounded flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-sunken)] hover:text-[var(--color-text-primary)] transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>

                {/* 新建文件夹输入 */}
                <AnimatePresence>
                  {isCreatingFolder && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mb-1.5"
                    >
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreateFolder()
                            if (e.key === 'Escape') { setIsCreatingFolder(false); setNewFolderName('') }
                          }}
                          placeholder="文件夹名"
                          autoFocus
                          className="flex-1 px-2.5 py-1.5 text-[12px] bg-[var(--color-bg-sunken)] border border-[var(--color-border)] rounded-lg outline-none focus:border-primary-500 transition-colors"
                        />
                        <button
                          onClick={handleCreateFolder}
                          className="w-6 h-6 rounded-lg bg-primary-500 text-white flex items-center justify-center"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={() => { setIsCreatingFolder(false); setNewFolderName('') }}
                          className="w-6 h-6 rounded-lg flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-sunken)]"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 文件夹列表 */}
                <div className="space-y-0.5">
                  {folders.length === 0 && !isCreatingFolder ? (
                    <p className="text-[11px] text-[var(--color-text-tertiary)] text-center py-4">
                      暂无文件夹
                    </p>
                  ) : (
                    folders.map((folder) => (
                      <FolderItem
                        key={folder.id}
                        folder={folder}
                        isSelected={selectedFolderId === folder.id}
                        onClick={() => handleFolderClick(folder.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* 底部统计 */}
              <div className="px-5 mt-auto pt-4">
                <div className="h-px bg-[var(--color-border)] mb-4" />
                <div className="px-1 text-[11px] text-[var(--color-text-tertiary)]">
                  {folders.length} 个文件夹
                </div>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}

function FolderItem({ folder, isSelected, onClick }: { folder: any; isSelected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[13px] transition-all duration-200',
        isSelected
          ? 'bg-[var(--color-primary-light)] text-primary-500 font-medium'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-sunken)]'
      )}
    >
      <span
        className="w-4 h-4 rounded flex items-center justify-center text-[10px]"
        style={{ backgroundColor: folder.color + '25', color: folder.color }}
      >
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
        </svg>
      </span>
      <span className="flex-1 text-left truncate">{folder.name}</span>
      {folder.image_count > 0 && (
        <span className="text-[10px] opacity-60">{folder.image_count}</span>
      )}
    </button>
  )
}
