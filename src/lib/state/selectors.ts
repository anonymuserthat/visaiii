import type {
  Formula,
  ServiceItem,
  TravellerForm,
  VisaTypeItem,
} from '@/lib/api/types'
import type { BookingStore } from '@/lib/state/types'

export function selectDraft(state: BookingStore) {
  return state.draft
}

export function selectCurrentCenter(state: BookingStore) {
  return (
    state.centers.find((center) => center.id === state.selectedCenterId) ?? null
  )
}

export function selectVisibleServices(state: BookingStore) {
  return state.services.filter((service) =>
    service.formulas.includes((state.draft.formula || 'standard') as Formula),
  )
}

export function selectTravellerByIndex(index: number) {
  return (state: BookingStore) => state.draft.travellers[index] ?? null
}

export function selectStayDurations(visaTypes: VisaTypeItem[]) {
  return Array.from(
    new Map(
      visaTypes.map((item) => [
        item.visaStayDurationId,
        {
          id: item.visaStayDurationId,
          label: item.visaStayDurationLabel,
          order: item.visaStayDurationOrder ?? Number.MAX_SAFE_INTEGER,
        },
      ]),
    ).values(),
  ).sort(
    (left, right) =>
      left.order - right.order || left.label.localeCompare(right.label, 'fr'),
  )
}

export function selectProductLines(
  visaTypes: VisaTypeItem[],
  visaStayDurationId: string,
) {
  return Array.from(
    new Map(
      visaTypes
        .filter((item) => item.visaStayDurationId === visaStayDurationId)
        .map((item) => [
          item.productLineId,
          {
            id: item.productLineId,
            label: item.productLineLabel,
            travelProjectRelativeUrl: item.travelProjectRelativeUrl,
            order: item.productLineOrder ?? Number.MAX_SAFE_INTEGER,
          },
        ]),
    ).values(),
  ).sort(
    (left, right) =>
      left.order - right.order || left.label.localeCompare(right.label, 'fr'),
  )
}

export function selectVisaTypes(
  visaTypes: VisaTypeItem[],
  visaStayDurationId: string,
  productLineId: string,
) {
  return visaTypes.filter(
    (item) =>
      item.visaStayDurationId === visaStayDurationId &&
      item.productLineId === productLineId,
  )
}

export function selectTotalPrice(
  services: ServiceItem[],
  formula: Formula | '',
  travellers: TravellerForm[],
) {
  return services.reduce((total, service) => {
    if (formula === 'premium' && service.isIncludedInPremium) {
      return total
    }

    const multiplier = service.travellerScoped
      ? Math.max(travellers.length, 1)
      : 1

    return total + service.price * multiplier
  }, 0)
}
