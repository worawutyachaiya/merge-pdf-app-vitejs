// utils/errorHelpers.ts
export const isAbortError = (error: unknown): boolean => {
  if (error instanceof Error && (error.name === 'AbortError' || error.name === 'CanceledError')) {
    return true
  }

  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ERR_CANCELED'
  )
}

export const handleApiError = (error: unknown, context: string): string => {
  if (isAbortError(error)) {
    console.log(`${context} request aborted`)
    return 'Request aborted'
  }
  return getErrorMessage(error)
}
