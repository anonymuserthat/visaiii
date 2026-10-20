import { useCallback, useEffect, useState } from 'react'
import type { AppPage } from '@/components/workspace/workspace-layout'

const routes: readonly AppPage[] = [
  'new-request',
  'history',
  'expired',
  'statistics',
  'gmail',
  'contact',
]
function readPage(): AppPage {
  const page = window.location.hash.replace(/^#\/?/, '')
  return routes.includes(page as AppPage) ? (page as AppPage) : 'new-request'
}

// Hash routes also work with the desktop WebView's local application protocol.
export function useWorkspacePage(): [AppPage, (page: AppPage) => void] {
  const [page, setPage] = useState<AppPage>(readPage)
  useEffect(() => {
    const onHashChange = () => setPage(readPage())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])
  const navigate = useCallback((nextPage: AppPage) => {
    setPage(nextPage)
    if (readPage() !== nextPage || !window.location.hash)
      window.location.hash = `/${nextPage}`
  }, [])
  return [page, navigate]
}
