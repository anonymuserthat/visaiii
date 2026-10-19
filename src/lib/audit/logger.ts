import { bookingClient } from '@/lib/api/bookingClient'
import { useBookingStore } from '@/lib/state/store'

export async function recordAudit(action: string, detail: string) {
  useBookingStore.getState().appendAudit(action, detail)
  await bookingClient.appendAuditEntry(action, detail)
}
