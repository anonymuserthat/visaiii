import type {
  OptionalServicesSlice,
  SliceCreator,
} from '@/lib/state/types'

export const createOptionalServicesSlice: SliceCreator<
  OptionalServicesSlice
> = (set) => ({
  setOptionalServices: (optionalServices) =>
    set((state) => ({
      draft: {
        ...state.draft,
        optionalServices,
      },
    })),
  updateOptionalServices: (optionalServices) =>
    set((state) => ({
      draft: {
        ...state.draft,
        optionalServices: {
          ...state.draft.optionalServices,
          ...optionalServices,
        },
      },
    })),
})
