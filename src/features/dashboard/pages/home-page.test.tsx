import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { HomePage } from './home-page'
import { createEmptyBookingDraft } from '@/lib/state/defaults'
import { buildStoredRequestRecord } from '@/lib/request-records'

function props() {
  return {
    records: [],
    currentUser: null,
    isLoading: false,
    error: false,
    onRetry: vi.fn(),
    onCreate: vi.fn(),
    onHistory: vi.fn(),
    onExpired: vi.fn(),
    onReuse: vi.fn(),
  }
}

describe('ProVisa home workspace', () => {
  it('offers a working first-request action without showing sample dossiers', async () => {
    const actions = props()
    render(<HomePage {...actions} />)
    await userEvent.click(
      screen.getByRole('button', { name: 'Créer ma première demande' }),
    )
    expect(actions.onCreate).toHaveBeenCalledOnce()
    expect(screen.queryByRole('article')).not.toBeInTheDocument()
  })
  it('opens an existing dossier and its expired-list action without mutating it', async () => {
    const actions = props()
    const values = createEmptyBookingDraft()
    values.travellers[0].firstname = 'Amine'
    values.travellers[0].lastname = 'Test'
    const record = buildStoredRequestRecord({
      values,
      payload: { fields: {}, encoded: '' },
      result: { status: 201, location: null },
      centerLabel: 'Annaba',
      submitter: { name: 'Agent', email: 'agent@example.test' },
    })
    record.submittedAt = new Date(Date.now() - 40 * 86400000).toISOString()
    const before = JSON.stringify(record)
    render(<HomePage {...actions} records={[record]} />)
    await userEvent.click(
      screen.getByRole('button', {
        name: 'Reprendre le dossier de Amine Test',
      }),
    )
    expect(actions.onReuse).toHaveBeenCalledWith(record)
    await userEvent.click(
      screen.getByRole('button', { name: /1 dossier à revoir/ }),
    )
    expect(actions.onExpired).toHaveBeenCalledOnce()
    expect(JSON.stringify(record)).toBe(before)
  })
  it('provides retry instead of a misleading empty state when loading fails', async () => {
    const actions = props()
    render(<HomePage {...actions} error />)
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Vos dossiers ne sont pas disponibles',
    )
    expect(
      screen.queryByText('Une place pour chaque dossier'),
    ).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(actions.onRetry).toHaveBeenCalledOnce()
  })
  it('combines real dossier search with the expiration filter and can reset both', async () => {
    const user = userEvent.setup()
    const values = createEmptyBookingDraft()
    const makeRecord = (name: string, old: boolean) => {
      const record = buildStoredRequestRecord({
        values,
        payload: { fields: {}, encoded: '' },
        result: { status: 201, location: null },
        centerLabel: 'Annaba',
        submitter: { name: 'Agent', email: 'agent@example.test' },
      })
      return {
        ...record,
        primaryTravellerName: name,
        submittedAt: new Date(
          Date.now() - (old ? 40 : 0) * 86400000,
        ).toISOString(),
      }
    }
    const records = [makeRecord('Amine', false), makeRecord('Sara', true)]
    const before = JSON.stringify(records)
    render(<HomePage {...props()} records={records} />)
    await user.click(screen.getByRole('button', { name: /À renouveler/ }))
    expect(
      screen.queryByRole('button', { name: 'Consulter le dossier de Amine' }),
    ).not.toBeInTheDocument()
    await user.type(
      screen.getByRole('textbox', { name: 'Rechercher mes demandes' }),
      'inexistant',
    )
    expect(screen.getByRole('status')).toHaveTextContent('Aucun dossier trouvé')
    await user.click(
      screen.getByRole('button', { name: 'Effacer la recherche' }),
    )
    expect(
      screen.getByRole('button', { name: 'Consulter le dossier de Amine' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Consulter le dossier de Sara' }),
    ).toBeInTheDocument()
    expect(JSON.stringify(records)).toBe(before)
  })
  it('opens read-only details without invoking the request reuse action', async () => {
    const user = userEvent.setup()
    const actions = props()
    const record = buildStoredRequestRecord({
      values: createEmptyBookingDraft(),
      payload: { fields: {}, encoded: '' },
      result: { status: 201, location: null },
      centerLabel: 'Annaba',
      submitter: { name: 'Agent', email: 'agent@example.test' },
    })
    render(<HomePage {...actions} records={[record]} />)
    const open = screen.getByRole('button', { name: /Consulter le dossier/ })
    await user.click(open)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(actions.onReuse).not.toHaveBeenCalled()
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(open).toHaveFocus()
  })
})
