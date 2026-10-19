import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CalendarGrid } from '@/features/booking/components/calendar-grid'

describe('CalendarGrid', () => {
  it('keeps only the explicit available days clickable when Capago returns available_day_list', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    render(
      <CalendarGrid
        availableDays={['2026-05-05', '2026-05-12', '2026-05-19']}
        unavailableDays={[]}
        selectedDay=""
        firstAvailableDay="2026-05-05"
        minDay="2026-03-27"
        maxDay="2026-05-31"
        onSelect={onSelect}
      />,
    )

    expect(screen.getByText(/Mai 2026/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '5' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '12' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '19' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '6' })).toBeDisabled()

    await user.click(screen.getByRole('button', { name: '12' }))

    expect(onSelect).toHaveBeenCalledWith('2026-05-12')
  })
})
