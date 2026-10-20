import { useState } from 'react'
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { CurrentUserDialog } from './current-user-dialog'
import type { CurrentUserProfile } from '@/lib/api/types'

const originalShowModal = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
)
beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value: function (this: HTMLDialogElement) {
      this.open = true
    },
  })
})
afterAll(() => {
  if (originalShowModal)
    Object.defineProperty(
      HTMLDialogElement.prototype,
      'showModal',
      originalShowModal,
    )
  else Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal')
})

function Editor({
  onSave,
}: {
  onSave: (profile: CurrentUserProfile) => Promise<void>
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '' })
  return (
    <>
      <button onClick={() => setOpen(true)}>Mon profil</button>
      {open ? (
        <CurrentUserDialog
          draft={draft}
          onDraftChange={setDraft}
          onClose={() => setOpen(false)}
          onSave={async (profile) => {
            await onSave(profile)
            setOpen(false)
          }}
        />
      ) : null}
    </>
  )
}

describe('Current user profile editor', () => {
  it('validates fields inline, focuses the first error and saves normalized data', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn().mockResolvedValue(undefined)
    render(<Editor onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: 'Mon profil' }))
    const name = screen.getByRole('textbox', { name: 'Nom complet' })
    const email = screen.getByRole('textbox', { name: 'Adresse e-mail' })
    expect(name).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(onSave).not.toHaveBeenCalled()
    expect(name).toHaveAttribute('aria-invalid', 'true')
    expect(name).toHaveAccessibleDescription('Saisissez votre nom complet.')
    expect(name).toHaveFocus()
    await user.type(name, '  Amine   Test  ')
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(email).toHaveFocus()
    await user.type(email, 'Amine@EXAMPLE.TEST')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledExactlyOnceWith({
        name: 'Amine Test',
        email: 'amine@example.test',
      }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mon profil' })).toHaveFocus()
  })

  it('prevents duplicate submission and keeps edits available after a failed save', async () => {
    const user = userEvent.setup()
    let rejectSave!: (error: Error) => void
    const onSave = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((_, reject) => {
            rejectSave = reject
          }),
      )
      .mockResolvedValue(undefined)
    render(<Editor onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: 'Mon profil' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Nom complet' }),
      'Amine Test',
    )
    await user.type(
      screen.getByRole('textbox', { name: 'Adresse e-mail' }),
      'amine@example.test',
    )
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(
      screen.getByRole('button', { name: 'Enregistrement…' }),
    ).toBeDisabled()
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    )
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    await act(async () => {
      rejectSave(new Error('Storage unavailable'))
    })
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Vos modifications sont conservées',
    )
    expect(screen.getByRole('textbox', { name: 'Nom complet' })).toHaveValue(
      'Amine Test',
    )
    expect(onSave).toHaveBeenCalledOnce()
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    )
    expect(onSave).toHaveBeenCalledTimes(2)
  })

  it('closes without saving and retains the unsaved draft when reopened', async () => {
    const user = userEvent.setup()
    const onSave = vi.fn()
    render(<Editor onSave={onSave} />)
    await user.click(screen.getByRole('button', { name: 'Mon profil' }))
    await user.type(
      screen.getByRole('textbox', { name: 'Nom complet' }),
      'Modification en cours',
    )
    fireEvent(
      screen.getByRole('dialog'),
      new Event('cancel', { cancelable: true }),
    )
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Mon profil' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Mon profil' }))
    expect(screen.getByRole('textbox', { name: 'Nom complet' })).toHaveValue(
      'Modification en cours',
    )
    expect(onSave).not.toHaveBeenCalled()
  })
})
