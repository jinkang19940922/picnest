import { useEffect, useRef, useCallback } from 'react'

export function useInfiniteScroll(
  containerRef: React.RefObject<HTMLElement>,
  onLoadMore: () => void,
  enabled: boolean = true
) {
  const isLoadingRef = useRef(false)

  const handleScroll = useCallback(() => {
    if (!enabled || isLoadingRef.current) return

    const container = containerRef.current
    if (!container) return

    const { scrollTop, scrollHeight, clientHeight } = container
    const threshold = 500 // 距离底部 500px 时触发

    if (scrollHeight - scrollTop - clientHeight < threshold) {
      isLoadingRef.current = true
      onLoadMore()
      // 重置（实际加载状态由父组件控制）
      setTimeout(() => {
        isLoadingRef.current = false
      }, 1000)
    }
  }, [containerRef, onLoadMore, enabled])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [containerRef, handleScroll])
}