import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'

const { recordsQuery } = vi.hoisted(() => ({
  recordsQuery: {
    data: [],
    isLoading: false,
    isError: true,
    isFetching: false,
    refetch: vi.fn(),
  },
}))

vi.mock('@/lib/api/hooks', () => ({
  useRequestRecordsQuery: () => recordsQuery,
}))
vi.mock('@/lib/api/bookingClient', () => ({
  bookingClient: {
    loadCurrentUserProfile: vi
      .fn()
      .mockResolvedValue({ name: 'Amine', email: 'amine@example.test' }),
  },
}))

beforeEach(() => {
  recordsQuery.isLoading = false
  recordsQuery.isError = true
  recordsQuery.refetch.mockReset()
})

describe('Workspace record availability', () => {
  it('reports failed data loading on history, expired and statistics pages and offers retry', async () => {
    const user = userEvent.setup()
    render(<App />)
    for (const page of ['Historique', 'Demandes expirées', 'Statistiques']) {
      await user.click(screen.getByRole('button', { name: page }))
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Vos dossiers ne sont pas disponibles',
      )
      expect(screen.getByText('Dossiers indisponibles')).toBeInTheDocument()
      expect(
        screen.queryByText('Aucune demande enregistrée'),
      ).not.toBeInTheDocument()
      expect(
        screen.queryByText('Aucune demande expirée'),
      ).not.toBeInTheDocument()
    }
    await user.click(screen.getByRole('button', { name: 'Réessayer' }))
    expect(recordsQuery.refetch).toHaveBeenCalledOnce()
  })

  it('shows loading before empty statistics or expired records, then shows the real empty state', async () => {
    const user = userEvent.setup()
    recordsQuery.isLoading = true
    recordsQuery.isError = false
    const view = render(<App />)
    await user.click(screen.getByRole('button', { name: 'Statistiques' }))
    expect(screen.getByRole('status')).toHaveTextContent(
      'Chargement de vos dossiers',
    )
    expect(
      screen.queryByText('Aucune activité pour le moment'),
    ).not.toBeInTheDocument()
    recordsQuery.isLoading = false
    view.rerender(<App />)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(
      screen.getByText('Votre activité commence ici'),
    ).toBeInTheDocument()
  })
})
