import { useEffect, useRef, useCallback } from 'react'
import { useImageStore } from '@/stores/imageStore'
import { useFolderStore } from '@/stores/folderStore'
import MasonryGrid from '@/components/Gallery/MasonryGrid'
import ImagePreview from '@/components/Preview/ImagePreview'
import { imagesApi } from '@/api/images'
import clsx from 'clsx'

export default function Gallery() {
  const {
    images,
    meta,
    isLoading,
    isLoadingMore,
    selectedIds,
    previewImage,
    fetchImages,
    loadMore,
    toggleSelect,
    selectAll,
    deselectAll,
    setPreview,
    deleteImage,
  } = useImageStore()

  const { selectedFolderId } = useFolderStore()
  const containerRef = useRef<HTMLDivElement>(null)

  // 初始加载
  useEffect(() => {
    fetchImages({ folder_id: selectedFolderId || undefined })
  }, [])

  // 监听文件夹变化
  useEffect(() => {
    fetchImages({ folder_id: selectedFolderId || undefined })
  }, [selectedFolderId])

  // 无限滚动
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore && meta.page < meta.total_pages) {
      loadMore()
    }
  }, [isLoadingMore, meta.page, meta.total_pages, loadMore])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container
      if (scrollHeight - scrollTop - clientHeight < 500) {
        handleLoadMore()
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleLoadMore])

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return
    if (!confirm(`确定删除选中的 ${selectedIds.size} 张图片吗？`)) return

    try {
      await imagesApi.batchDelete(Array.from(selectedIds))
      deselectAll()
      fetchImages({ folder_id: selectedFolderId || undefined })
    } catch (err) {
      console.error('批量删除失败', err)
    }
  }

  // 搜索处理
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const search = formData.get('search') as string
    fetchImages({ search: search || undefined, folder_id: selectedFolderId || undefined })
  }

  return (
    <div ref={containerRef} className="h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        {/* 搜索 */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md">
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]">
              🔍
            </span>
            <input
              type="text"
              name="search"
              placeholder="搜索图片..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all"
            />
          </div>
        </form>

        {/* 操作按钮 */}
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 ? (
            <>
              <span className="text-sm text-[var(--color-text-secondary)]">
                已选 {selectedIds.size} 张
              </span>
              <button
                onClick={deselectAll}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface)] hover:bg-[var(--color-border)] transition-colors"
              >
                取消选择
              </button>
              <button
                onClick={handleBatchDelete}
                className="px-3 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition-colors"
              >
                🗑️ 删除
              </button>
            </>
          ) : (
            <button
              onClick={selectAll}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-[var(--color-surface)] hover:bg-[var(--color-border)] transition-colors"
            >
              全选
            </button>
          )}
        </div>
      </div>

      {/* 图片数量统计 */}
      <p className="text-sm text-[var(--color-text-secondary)] mb-4">
        共 {meta.total} 张图片
      </p>

      {/* 瀑布流画廊 */}
      <div className="flex-1 overflow-y-auto">
        <MasonryGrid
          images={images}
          isLoading={isLoading}
          selectedIds={selectedIds}
          onSelect={toggleSelect}
          onPreview={setPreview}
          onLoadMore={handleLoadMore}
          isLoadingMore={isLoadingMore}
          hasMore={meta.page < meta.total_pages}
        />
      </div>

      {/* 预览弹窗 */}
      <ImagePreview
        image={previewImage}
        onClose={() => setPreview(null)}
      />
    </div>
  )
}