import { listen, type Event } from '@tauri-apps/api/event'
import { invoke } from '@tauri-apps/api/core'

import { isTauriEnvironment } from '@/lib/utils'

export const RECAPTCHA_TOKEN_EVENT = 'recaptcha:token'

export interface RecaptchaTokenPayload {
  token: string
}

interface OpenRecaptchaWindowPayload {
  baseUrl: string
  locale: 'fr' | 'en'
}

export async function openEmbeddedRecaptchaWindow(
  payload: OpenRecaptchaWindowPayload,
) {
  if (!isTauriEnvironment()) {
    return false
  }

  await invoke('open_recaptcha_window', { payload })
  return true
}

export async function listenForRecaptchaToken(
  handler: (payload: RecaptchaTokenPayload, event: Event<RecaptchaTokenPayload>) => void,
) {
  if (!isTauriEnvironment()) {
    return null
  }

  return listen<RecaptchaTokenPayload>(RECAPTCHA_TOKEN_EVENT, (event) => {
    handler(event.payload, event)
  })
}
