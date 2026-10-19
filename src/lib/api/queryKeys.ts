export const bookingQueryKeys = {
  globalParams: ['booking', 'globalParams'] as const,
  socialTitles: ['booking', 'socialTitles'] as const,
  visaFileVariations: ['booking', 'visaFileVariations'] as const,
  services: (centerId: string) => ['booking', 'services', centerId] as const,
  visaTypes: (centerId: string) => ['booking', 'visaTypes', centerId] as const,
  unavailableDays: (
    centerId: string,
    formula: string,
    visaFileList: string,
  ) =>
    [
      'booking',
      'unavailableDays',
      centerId,
      formula,
      visaFileList,
    ] as const,
  slots: (centerId: string, formula: string, day: string) =>
    ['booking', 'slots', centerId, formula, day] as const,
  requestRecords: ['booking', 'requestRecords'] as const,
}
