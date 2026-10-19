import { z } from 'zod'

const rawRecordSchema = z.record(z.string(), z.unknown())
const rawRecordArraySchema = z.array(rawRecordSchema)

export const globalParamsResponseSchema = rawRecordSchema
export const serviceListResponseSchema = z.union([
  rawRecordSchema,
  rawRecordArraySchema,
])
export const socialTitlesResponseSchema = z.union([
  rawRecordArraySchema,
  rawRecordSchema,
])
export const visaFileVariationsResponseSchema = z.union([
  rawRecordArraySchema,
  rawRecordSchema,
])
export const visaTypesResponseSchema = z.union([
  rawRecordSchema,
  rawRecordArraySchema,
])
export const unavailableDaysResponseSchema = rawRecordSchema
export const availableSlotsResponseSchema = z.union([
  rawRecordSchema,
  rawRecordArraySchema,
])
export const submissionFailureSchema = rawRecordSchema

export function parseGlobalParamsResponse(payload: unknown) {
  return globalParamsResponseSchema.parse(payload)
}

export function parseSocialTitlesResponse(payload: unknown) {
  return socialTitlesResponseSchema.parse(payload)
}

export function parseVisaFileVariationsResponse(payload: unknown) {
  return visaFileVariationsResponseSchema.parse(payload)
}

export function parseServiceListResponse(payload: unknown) {
  return serviceListResponseSchema.parse(payload)
}

export function parseVisaTypesResponse(payload: unknown) {
  return visaTypesResponseSchema.parse(payload)
}

export function parseUnavailableDaysResponse(payload: unknown) {
  return unavailableDaysResponseSchema.parse(payload)
}

export function parseAvailableSlotsResponse(payload: unknown) {
  return availableSlotsResponseSchema.parse(payload)
}

export function parseSubmissionFailure(payload: unknown) {
  return submissionFailureSchema.parse(payload)
}
