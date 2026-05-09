import { createContext, useContext, useState } from 'react'

interface PreviewContextValue {
  isPreviewOpen: boolean
  openPreview: () => void
  closePreview: () => void
}

const PreviewContext = createContext<PreviewContextValue>({
  isPreviewOpen: false,
  openPreview: () => {},
  closePreview: () => {},
})

export function PreviewProvider({ children }: { children: React.ReactNode }) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  return (
    <PreviewContext.Provider value={{
      isPreviewOpen,
      openPreview: () => setIsPreviewOpen(true),
      closePreview: () => setIsPreviewOpen(false),
    }}>
      {children}
    </PreviewContext.Provider>
  )
}

export const usePreviewContext = () => useContext(PreviewContext)
