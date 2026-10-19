import { openUrl } from '@tauri-apps/plugin-opener'

import { isTauriEnvironment } from '@/lib/utils'

export async function openExternalUrl(url: string) {
  if (!isTauriEnvironment()) {
    window.open(url, '_blank', 'noopener,noreferrer')
    return
  }

  await openUrl(url)
}
