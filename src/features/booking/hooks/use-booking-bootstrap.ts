import { useEffect } from 'react'

import {
  useGlobalParamsQuery,
  useServicesQuery,
  useSocialTitlesQuery,
  useVisaFileVariationsQuery,
  useVisaTypesQuery,
} from '@/lib/api/hooks'
import { useBookingStore } from '@/lib/state/store'

export function useBookingBootstrap() {
  const hydrateBootstrap = useBookingStore((state) => state.hydrateBootstrap)
  const setServices = useBookingStore((state) => state.setServices)
  const setVisaTypes = useBookingStore((state) => state.setVisaTypes)
  const setSelectedCenterId = useBookingStore((state) => state.setSelectedCenterId)
  const selectedCenterId = useBookingStore((state) => state.selectedCenterId)
  const globalParamsQuery = useGlobalParamsQuery()
  const socialTitlesQuery = useSocialTitlesQuery(globalParamsQuery.isSuccess)
  const visaFileVariationsQuery = useVisaFileVariationsQuery(
    globalParamsQuery.isSuccess,
  )
  const servicesQuery = useServicesQuery(
    selectedCenterId,
    globalParamsQuery.data?.currencyCode ?? 'EUR',
    globalParamsQuery.isSuccess && Boolean(selectedCenterId),
  )
  const visaTypesQuery = useVisaTypesQuery(
    selectedCenterId,
    globalParamsQuery.isSuccess && Boolean(selectedCenterId),
  )

  useEffect(() => {
    if (
      globalParamsQuery.data &&
      socialTitlesQuery.data &&
      visaFileVariationsQuery.data &&
      servicesQuery.data &&
      visaTypesQuery.data
    ) {
      hydrateBootstrap({
        globalParams: globalParamsQuery.data,
        socialTitles: socialTitlesQuery.data,
        visaFileVariations: visaFileVariationsQuery.data,
        services: servicesQuery.data,
        visaTypes: visaTypesQuery.data,
      })
    }
  }, [
    globalParamsQuery.data,
    hydrateBootstrap,
    servicesQuery.data,
    socialTitlesQuery.data,
    visaFileVariationsQuery.data,
    visaTypesQuery.data,
  ])

  useEffect(() => {
    if (globalParamsQuery.data && !selectedCenterId) {
      const firstCenterId = globalParamsQuery.data.centers[0]?.id ?? ''
      setSelectedCenterId(firstCenterId)
    }
  }, [globalParamsQuery.data, selectedCenterId, setSelectedCenterId])

  useEffect(() => {
    if (servicesQuery.data) {
      setServices(servicesQuery.data)
    }
  }, [servicesQuery.data, setServices])

  useEffect(() => {
    if (visaTypesQuery.data) {
      setVisaTypes(visaTypesQuery.data)
    }
  }, [setVisaTypes, visaTypesQuery.data])

  return {
    globalParamsQuery,
    socialTitlesQuery,
    visaFileVariationsQuery,
    servicesQuery,
    visaTypesQuery,
  }
}
