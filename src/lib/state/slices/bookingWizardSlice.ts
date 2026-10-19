import {
  createEmptyBookingDraft,
  createEmptyTraveller,
} from '@/lib/state/defaults'
import type { BookingWizardSlice, SliceCreator } from '@/lib/state/types'

export const createBookingWizardSlice: SliceCreator<BookingWizardSlice> = (
  set,
) => ({
  currentStep: 1,
  completedSteps: [],
  draft: createEmptyBookingDraft(),
  setCurrentStep: (currentStep) => set({ currentStep }),
  markStepCompleted: (step) =>
    set((state) => ({
      completedSteps: state.completedSteps.includes(step)
        ? state.completedSteps
        : [...state.completedSteps, step],
    })),
  updateSetup: (setup) =>
    set((state) => {
      const nextTravellerCount = setup.nbTravellers ?? state.draft.nbTravellers
      const nextTravellers =
        nextTravellerCount === state.draft.travellers.length
          ? state.draft.travellers
          : [
              ...state.draft.travellers.slice(0, nextTravellerCount),
              ...Array.from(
                {
                  length: Math.max(
                    0,
                    nextTravellerCount - state.draft.travellers.length,
                  ),
                },
                (_, index) =>
                  createEmptyTraveller(
                    state.draft.travellers.length + index,
                  ),
              ),
            ].slice(0, nextTravellerCount)

      return {
        draft: {
          ...state.draft,
          ...setup,
          travellers: nextTravellers.map((traveller, index) => ({
            ...traveller,
            id: traveller.id || `traveller_${index + 1}`,
          })),
        },
      }
    }),
  hydrateDraft: (draft) => set({ draft }),
  resetDraft: () =>
    set({
      draft: createEmptyBookingDraft(),
      currentStep: 1,
      completedSteps: [],
    }),
})
