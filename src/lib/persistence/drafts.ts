import { open, save } from '@tauri-apps/plugin-dialog'
import { readTextFile, writeTextFile } from '@tauri-apps/plugin-fs'

import type { StoredBookingDraft } from '@/lib/api/types'
import { isTauriEnvironment } from '@/lib/utils'

export async function exportDraftJson(draft: StoredBookingDraft) {
  const payload = JSON.stringify(draft, null, 2)

  if (!isTauriEnvironment()) {
    const blob = new Blob([payload], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'provisa-draft.json'
    link.click()
    URL.revokeObjectURL(url)
    return true
  }

  const filePath = await save({
    defaultPath: 'provisa-draft.json',
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (!filePath) {
    return false
  }

  await writeTextFile(filePath, payload)
  return true
}

export async function importDraftJson() {
  if (!isTauriEnvironment()) {
    return new Promise<StoredBookingDraft | null>((resolve, reject) => {
      const input = document.createElement('input')
      input.type = 'file'
      input.accept = 'application/json'
      input.onchange = async () => {
        const file = input.files?.[0]
        if (!file) {
          resolve(null)
          return
        }

        try {
          const contents = await file.text()
          resolve(JSON.parse(contents) as StoredBookingDraft)
        } catch (error) {
          reject(error)
        }
      }

      input.click()
    })
  }

  const filePath = await open({
    multiple: false,
    filters: [{ name: 'JSON', extensions: ['json'] }],
  })

  if (!filePath || Array.isArray(filePath)) {
    return null
  }

  const contents = await readTextFile(filePath)
  return JSON.parse(contents) as StoredBookingDraft
}
