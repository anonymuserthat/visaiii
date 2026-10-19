import { createEmptyAppointment } from '@/lib/state/defaults'
import type { AppointmentSlice, SliceCreator } from '@/lib/state/types'
import { createConditionKey } from '@/lib/utils'

export const createAppointmentSlice: SliceCreator<AppointmentSlice> = (set) => ({
  availability: null,
  setAvailability: (availability) =>
    set((state) => ({
      availability,
      draft: {
        ...state.draft,
        appointment: {
          ...state.draft.appointment,
          chooseAppointmentDate: availability.chooseAppointmentDate,
          unavailableDayList: availability.unavailableDayList,
          queueConditions: Object.fromEntries(
            availability.queueConditionList.map((condition) => [
              createConditionKey(condition),
              state.draft.appointment.queueConditions[
                createConditionKey(condition)
              ] ?? false,
            ]),
          ),
        },
      },
    })),
  setAppointment: (appointment) =>
    set((state) => ({
      draft: {
        ...state.draft,
        appointment,
      },
    })),
  updateAppointment: (appointment) =>
    set((state) => ({
      draft: {
        ...state.draft,
        appointment: {
          ...createEmptyAppointment(),
          ...state.draft.appointment,
          ...appointment,
        },
      },
    })),
})
