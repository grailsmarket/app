import { MappedSendError, SendMessageError } from '@/types/chat'
import { formatResetTime } from './formatters'

export const mapSendError = (e: SendMessageError): MappedSendError => {
  switch (e.code) {
    case 'QUOTA_EXCEEDED': {
      const limit = e.quota?.limit
      const resets = formatResetTime(e.quota?.resets_at)
      return {
        message: `Daily limit reached${limit ? ` (${limit}/day)` : ''}${resets ? ` — resets ${resets}` : ''}`,
        restoreText: true,
      }
    }
    case 'CHAT_BANNED':
      return { message: 'You have been banned from global chat', permanent: true }
    case 'GLOBAL_CHAT_DISABLED':
      return { message: 'Global chat is temporarily disabled', permanent: true }
    case 'MESSAGE_TOO_LONG':
      return { message: e.message ?? 'Message too long', restoreText: true }
    case 'IMAGES_DISABLED':
      return { message: 'Image sending is currently disabled' }
    case 'STORAGE_UNAVAILABLE':
      return { message: 'Image uploads are temporarily unavailable' }
    case 'FILE_TOO_LARGE':
      return { message: 'Image is too large' }
    case 'UNSUPPORTED_TYPE':
      return { message: 'Unsupported image type' }
    case 'BLOCKED':
      return { message: "Couldn't deliver, you have been blocked", permanent: true }
    default:
      return { message: e.message ?? 'Failed to send' }
  }
}
