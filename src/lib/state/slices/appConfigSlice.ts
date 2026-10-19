import { RUNTIME_CONFIG } from '@/lib/config'
import type { SliceCreator } from '@/lib/state/types'

export const createAppConfigSlice: SliceCreator<
  Pick<
    import('@/lib/state/types').AppConfigSlice,
    | 'locale'
    | 'runtimeConfig'
    | 'globalParams'
    | 'socialTitles'
    | 'visaFileVariations'
    | 'services'
    | 'visaTypes'
    | 'selectedCenterId'
    | 'centers'
    | 'isBootstrapped'
    | 'setLocale'
    | 'setRuntimeConfig'
    | 'hydrateBootstrap'
    | 'setSelectedCenterId'
    | 'setServices'
    | 'setVisaTypes'
  >
> = (set) => ({
  locale: RUNTIME_CONFIG.defaultLocale,
  runtimeConfig: RUNTIME_CONFIG,
  globalParams: null,
  socialTitles: [],
  visaFileVariations: [],
  services: [],
  visaTypes: [],
  selectedCenterId: '',
  centers: [],
  isBootstrapped: false,
  setLocale: (locale) => set({ locale }),
  setRuntimeConfig: (runtimeConfig) => set({ runtimeConfig }),
  hydrateBootstrap: ({
    globalParams,
    socialTitles,
    visaFileVariations,
    services,
    visaTypes,
  }) =>
    set((state) => ({
      globalParams,
      socialTitles,
      visaFileVariations,
      services,
      visaTypes,
      selectedCenterId:
        state.selectedCenterId ||
        globalParams.centers[0]?.id ||
        globalParams.centers[0]?.code ||
        '',
      centers: globalParams.centers,
      isBootstrapped: true,
    })),
  setSelectedCenterId: (selectedCenterId) => set({ selectedCenterId }),
  setServices: (services) => set({ services }),
  setVisaTypes: (visaTypes) => set({ visaTypes }),
})
