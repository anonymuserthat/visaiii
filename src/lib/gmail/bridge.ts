import { invoke } from '@tauri-apps/api/core'
import { isTauriEnvironment } from '@/lib/utils'

export interface GmailStatus {
  configured: boolean
  connected: boolean
  clientId: string
  email: string | null
}
export interface GmailMessageSummary {
  id: string
  subject: string
  from: string
  to: string
  date: string
  snippet: string
  unread: boolean
}
export interface GmailMessage extends GmailMessageSummary { textBody: string; htmlBody: string }
export interface GmailInbox { messages: GmailMessageSummary[]; nextPageToken: string | null }

function desktopCommand<T>(command: string, args?: Record<string, unknown>) {
  if (!isTauriEnvironment()) return Promise.reject(new Error('Gmail est disponible dans le logiciel Windows.'))
  return invoke<T>(command, args)
}

export const gmail = {
  status: () => desktopCommand<GmailStatus>('get_gmail_status'),
  configure: (payload: { clientId: string; clientSecret?: string }) => desktopCommand<GmailStatus>('configure_gmail_app', { payload }),
  startAuthorization: () => desktopCommand<{ url: string }>('start_gmail_authorization'),
  finishAuthorization: () => desktopCommand<GmailStatus>('finish_gmail_authorization'),
  cancelAuthorization: () => desktopCommand<void>('cancel_gmail_authorization'),
  disconnect: (forgetApp = false) => desktopCommand<GmailStatus>('disconnect_gmail', { forgetApp }),
  list: (query = '', pageToken?: string) => desktopCommand<GmailInbox>('list_gmail_messages', { query, pageToken: pageToken ?? null }),
  message: (id: string) => desktopCommand<GmailMessage>('get_gmail_message', { id }),
}
