import { useQueries } from '@tanstack/react-query'
import { bookingClient } from '@/lib/api/bookingClient'
import {
  useSocialTitlesQuery,
  useVisaFileVariationsQuery,
} from '@/lib/api/hooks'
import { bookingQueryKeys } from '@/lib/api/queryKeys'
import type { StoredRequestRecord, VisaTypeItem } from '@/lib/api/types'

// Record screens can be opened directly, before the booking form has bootstrapped.
// Load each record centre's labels rather than relying on the form's current centre.
export function useRecordReferenceData(
  records: StoredRequestRecord[],
  enabled: boolean,
) {
  const socialTitles = useSocialTitlesQuery(enabled)
  const variations = useVisaFileVariationsQuery(enabled)
  const centerIds = [
    ...new Set(records.map((record) => record.centerId).filter(Boolean)),
  ].sort()
  const visaQueries = useQueries({
    queries: centerIds.map((centerId) => ({
      queryKey: bookingQueryKeys.visaTypes(centerId),
      queryFn: () => bookingClient.getApplicableVisaTypeList(centerId),
      enabled,
    })),
  })
  return {
    socialTitles: socialTitles.data,
    visaFileVariations: variations.data,
    visaTypesByCenter: Object.fromEntries(
      centerIds.map((centerId, index) => [
        centerId,
        visaQueries[index]?.data ?? [],
      ]),
    ) as Record<string, VisaTypeItem[]>,
  }
}
