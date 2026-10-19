import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GmailPage } from './gmail-page'
import { gmail, type GmailInbox, type GmailStatus } from '@/lib/gmail/bridge'
import { openExternalUrl } from '@/lib/persistence/external'

vi.mock('@/lib/utils', async (importOriginal) => ({
  ...await importOriginal<typeof import('@/lib/utils')>(),
  isTauriEnvironment: () => true,
}))
vi.mock('@/lib/gmail/bridge', () => ({ gmail: {
  status: vi.fn(), configure: vi.fn(), startAuthorization: vi.fn(),
  finishAuthorization: vi.fn(), cancelAuthorization: vi.fn(),
  disconnect: vi.fn(), list: vi.fn(), message: vi.fn(),
} }))
vi.mock('@/lib/persistence/external', () => ({ openExternalUrl: vi.fn().mockResolvedValue(undefined) }))

const connected: GmailStatus = {
  configured: true, connected: true, clientId: 'desktop.apps.googleusercontent.com', email: 'first@example.com',
}
const summary = {
  id: 'abc123', subject: 'Visa confirmation', from: 'office@example.com', to: 'first@example.com',
  date: '18 October 2026', snippet: 'Appointment confirmed', unread: true,
}
const inbox: GmailInbox = { messages: [summary], nextPageToken: 'page-2' }

function deferred<T>() {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((complete) => { resolve = complete })
  return { promise, resolve }
}

describe('Gmail inbox page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.mocked(openExternalUrl).mockResolvedValue(undefined)
    vi.mocked(gmail.status).mockResolvedValue(connected)
    vi.mocked(gmail.list).mockResolvedValue(inbox)
    vi.mocked(gmail.message).mockResolvedValue({
      ...summary, textBody: '', htmlBody: '<p>Votre rendez-vous est confirme.</p><script>unsafe()</script><img src="https://example.test/pixel">',
    })
    vi.mocked(gmail.startAuthorization).mockResolvedValue({ url: 'https://accounts.google.com/example' })
    vi.mocked(gmail.cancelAuthorization).mockResolvedValue(undefined)
  })

  it('loads message content only on selection and supports inbox search', async () => {
    const user = userEvent.setup()
    render(<GmailPage />)
    await user.click(await screen.findByRole('button', { name: /Visa confirmation/i }))
    expect(await screen.findByText('Votre rendez-vous est confirme.')).toBeInTheDocument()
    expect(gmail.message).toHaveBeenCalledWith(summary.id)
    expect(document.querySelector('article img, article script')).toBeNull()
    await user.type(screen.getByRole('textbox', { name: 'Rechercher dans Gmail' }), 'from:office@example.com')
    await user.click(screen.getByRole('button', { name: 'Rechercher' }))
    await waitFor(() => expect(gmail.list).toHaveBeenLastCalledWith('from:office@example.com', undefined))
  })

  it('clears the previous account inbox while loading a newly connected account', async () => {
    const user = userEvent.setup()
    const newPage = deferred<GmailInbox>()
    vi.mocked(gmail.list).mockResolvedValueOnce(inbox).mockReturnValueOnce(newPage.promise)
    vi.mocked(gmail.finishAuthorization).mockResolvedValue({ ...connected, email: 'second@example.com' })
    render(<GmailPage />)
    await screen.findByRole('button', { name: /Visa confirmation/i })
    await user.click(screen.getByRole('button', { name: 'Changer de compte' }))
    await screen.findByText('second@example.com')
    expect(screen.queryByRole('button', { name: /Visa confirmation/i })).toBeNull()
    expect(openExternalUrl).toHaveBeenCalledWith('https://accounts.google.com/example')
    await act(async () => { newPage.resolve({ messages: [], nextPageToken: null }) })
  })

  it('ignores a late OAuth result after cancellation', async () => {
    const user = userEvent.setup()
    const authorization = deferred<GmailStatus>()
    vi.mocked(gmail.status).mockResolvedValue({ ...connected, connected: false, email: null })
    vi.mocked(gmail.finishAuthorization).mockReturnValue(authorization.promise)
    render(<GmailPage />)
    const connect = await screen.findByRole('button', { name: 'Se connecter avec Google' })
    await waitFor(() => expect(connect).toBeEnabled())
    await user.click(connect)
    await waitFor(() => expect(gmail.finishAuthorization).toHaveBeenCalledOnce())
    await user.click(screen.getByRole('button', { name: 'Annuler la connexion' }))
    await act(async () => { authorization.resolve(connected) })
    expect(gmail.cancelAuthorization).toHaveBeenCalledOnce()
    expect(screen.queryByText('first@example.com')).toBeNull()
    expect(gmail.list).not.toHaveBeenCalled()
    expect(within(document.body).getByRole('button', { name: 'Se connecter avec Google' })).toBeEnabled()
  })
})
