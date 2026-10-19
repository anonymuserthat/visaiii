import type { TravellersSlice, SliceCreator } from '@/lib/state/types'

export const createTravellersSlice: SliceCreator<TravellersSlice> = (set) => ({
  setTravellers: (travellers) =>
    set((state) => ({
      draft: {
        ...state.draft,
        travellers,
      },
    })),
  updateTraveller: (index, traveller) =>
    set((state) => ({
      draft: {
        ...state.draft,
        travellers: state.draft.travellers.map((current, currentIndex) =>
          currentIndex === index ? { ...current, ...traveller } : current,
        ),
      },
    })),
})
