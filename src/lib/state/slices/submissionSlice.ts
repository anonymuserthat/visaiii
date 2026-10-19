import type { SliceCreator, SubmissionSlice } from '@/lib/state/types'

export const createSubmissionSlice: SliceCreator<SubmissionSlice> = (set) => ({
  submissionStatus: 'idle',
  lastSuccess: null,
  lastFailure: null,
  rawServerErrors: [],
  auditTrail: [],
  setSubmissionStatus: (submissionStatus) => set({ submissionStatus }),
  setSubmissionSuccess: (payload) =>
    set({
      submissionStatus: 'success',
      lastSuccess: payload,
      lastFailure: null,
      rawServerErrors: [],
    }),
  setSubmissionFailure: (payload) =>
    set({
      submissionStatus: 'error',
      lastFailure: payload,
      lastSuccess: null,
      rawServerErrors: payload.rawMessages,
    }),
  clearSubmission: () =>
    set({
      submissionStatus: 'idle',
      lastSuccess: null,
      lastFailure: null,
      rawServerErrors: [],
    }),
  appendAudit: (action, detail) =>
    set((state) => ({
      auditTrail: [
        {
          action,
          detail,
          timestamp: new Date().toISOString(),
        },
        ...state.auditTrail,
      ].slice(0, 100),
    })),
})
