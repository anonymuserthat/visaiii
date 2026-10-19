import { useQuery } from '@tanstack/react-query'

import { bookingClient } from '@/lib/api/bookingClient'
import { bookingQueryKeys } from '@/lib/api/queryKeys'
import type { Formula } from '@/lib/api/types'
import { isTauriEnvironment } from '@/lib/utils'

export function useGlobalParamsQuery() {
  return useQuery({
    queryKey: bookingQueryKeys.globalParams,
    queryFn: () => bookingClient.getGlobalParams(),
  })
}

export function useSocialTitlesQuery(enabled = true) {
  return useQuery({
    queryKey: bookingQueryKeys.socialTitles,
    queryFn: () => bookingClient.getSocialTitles(),
    enabled,
  })
}

export function useVisaFileVariationsQuery(enabled = true) {
  return useQuery({
    queryKey: bookingQueryKeys.visaFileVariations,
    queryFn: () => bookingClient.getVisaFileVariations(),
    enabled,
  })
}

export function useServicesQuery(
  centerId: string,
  currencyCode: string,
  enabled = true,
) {
  return useQuery({
    queryKey: bookingQueryKeys.services(centerId),
    queryFn: () => bookingClient.getApplicableServiceList(centerId, currencyCode),
    enabled: enabled && Boolean(centerId),
  })
}

export function useVisaTypesQuery(centerId: string, enabled = true) {
  return useQuery({
    queryKey: bookingQueryKeys.visaTypes(centerId),
    queryFn: () => bookingClient.getApplicableVisaTypeList(centerId),
    enabled: enabled && Boolean(centerId),
  })
}

export function useUnavailableDaysQuery(
  centerId: string,
  formula: Formula | '',
  visaFileList: string,
  enabled = true,
) {
  return useQuery({
    queryKey: bookingQueryKeys.unavailableDays(centerId, formula, visaFileList),
    queryFn: () =>
      bookingClient.getUnavailableDayList({
        capagoCenterId: centerId,
        formula: formula as Formula,
        visaFileList,
      }),
    enabled:
      enabled &&
      Boolean(centerId) &&
      Boolean(formula) &&
      Boolean(visaFileList),
  })
}

export function useAvailableSlotsQuery(
  centerId: string,
  formula: Formula | '',
  day: string,
  enabled = true,
) {
  return useQuery({
    queryKey: bookingQueryKeys.slots(centerId, formula, day),
    queryFn: () =>
      bookingClient.getAvailableAppointmentSlotList({
        capagoCenterId: centerId,
        formula: formula as Formula,
        day,
      }),
    enabled: enabled && Boolean(centerId) && Boolean(formula) && Boolean(day),
  })
}

export function useRequestRecordsQuery() {
  const shouldAutoSync = isTauriEnvironment()

  return useQuery({
    queryKey: bookingQueryKeys.requestRecords,
    queryFn: () => bookingClient.listRequestRecords(),
    refetchInterval: shouldAutoSync ? 30_000 : false,
    refetchIntervalInBackground: shouldAutoSync,
    refetchOnWindowFocus: shouldAutoSync,
  })
}
