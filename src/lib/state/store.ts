import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { createAppConfigSlice } from '@/lib/state/slices/appConfigSlice'
import { createAppointmentSlice } from '@/lib/state/slices/appointmentSlice'
import { createBookingWizardSlice } from '@/lib/state/slices/bookingWizardSlice'
import { createOptionalServicesSlice } from '@/lib/state/slices/optionalServicesSlice'
import { createSubmissionSlice } from '@/lib/state/slices/submissionSlice'
import { createTravellersSlice } from '@/lib/state/slices/travellersSlice'
import type { BookingStore } from '@/lib/state/types'

export const useBookingStore = create<BookingStore>()(
  persist(
    (...args) => ({
      ...createAppConfigSlice(...args),
      ...createBookingWizardSlice(...args),
      ...createTravellersSlice(...args),
      ...createOptionalServicesSlice(...args),
      ...createAppointmentSlice(...args),
      ...createSubmissionSlice(...args),
    }),
    {
      name: 'damander-visa-desktop-store',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        locale: state.locale,
        draft: state.draft,
        currentStep: state.currentStep,
        completedSteps: state.completedSteps,
      }),
    },
  ),
)
