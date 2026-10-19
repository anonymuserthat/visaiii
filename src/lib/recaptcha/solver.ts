import { invoke } from '@tauri-apps/api/core'
import { RUNTIME_CONFIG } from '@/lib/config'
import { isTauriEnvironment } from '@/lib/utils'

export interface CaptchaSettings {
  enabled: boolean
  configured: boolean
  websiteUrl: string
  siteKey: string
  invisible: boolean
  enterprise: boolean
}

export type CaptchaSettingsInput = Omit<CaptchaSettings, 'configured'> & { apiKey?: string }

export const canSolveAutomatically = (settings: CaptchaSettings | null) =>
  isTauriEnvironment() && !RUNTIME_CONFIG.mockMode && Boolean(settings?.enabled && settings.configured)

export const getCaptchaSettings = () => invoke<CaptchaSettings>('get_captcha_settings')
export const saveCaptchaSettings = (payload: CaptchaSettingsInput) =>
  invoke<CaptchaSettings>('save_captcha_settings', { payload })
export const clearCaptchaSettings = () => invoke<CaptchaSettings>('clear_captcha_settings')

export async function solveCaptcha() {
  if (!isTauriEnvironment() || RUNTIME_CONFIG.mockMode) {
    throw new Error('2Captcha est disponible uniquement dans le logiciel en mode reel.')
  }
  const token = await invoke<string>('solve_captcha')
  if (!token.trim()) throw new Error('2Captcha a retourne un jeton vide.')
  return token
}
