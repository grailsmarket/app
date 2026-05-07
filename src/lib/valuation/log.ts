import 'server-only'

type LogMetadata = Record<string, unknown>

function formatValuationLog(logPrefix: string, message: string) {
  return `${new Date().toISOString()} ${logPrefix} ${message}`
}

export function valuationLogInfo(logPrefix: string, message: string, metadata?: LogMetadata) {
  if (metadata === undefined) {
    console.info(formatValuationLog(logPrefix, message))
    return
  }

  console.info(formatValuationLog(logPrefix, message), metadata)
}

export function valuationLogWarn(logPrefix: string, message: string, metadata?: LogMetadata) {
  if (metadata === undefined) {
    console.warn(formatValuationLog(logPrefix, message))
    return
  }

  console.warn(formatValuationLog(logPrefix, message), metadata)
}

export function valuationLogError(logPrefix: string, message: string, metadata?: LogMetadata) {
  if (metadata === undefined) {
    console.error(formatValuationLog(logPrefix, message))
    return
  }

  console.error(formatValuationLog(logPrefix, message), metadata)
}
