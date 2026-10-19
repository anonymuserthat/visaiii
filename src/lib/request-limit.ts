export const TEST_REQUEST_LIMIT = 10

export function getRemainingRequestSlots(
  currentCount: number,
  requestLimit = TEST_REQUEST_LIMIT,
) {
  return Math.max(requestLimit - currentCount, 0)
}

export function isRequestLimitReached(
  currentCount: number,
  requestLimit = TEST_REQUEST_LIMIT,
) {
  return currentCount >= requestLimit
}
