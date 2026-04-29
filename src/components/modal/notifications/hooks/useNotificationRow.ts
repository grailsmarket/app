import { useUserContext } from '@/context/user'

export const useNotificationRow = () => {
  const { userAddress } = useUserContext()

  const supportedValues = {
    USER_ADDRESS: userAddress,
  }

  const processLinkUrl = (linkUrl: string | null) => {
    if (!linkUrl) return linkUrl

    if (linkUrl.includes('[') && linkUrl.includes(']')) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [left, middle] = linkUrl.split('[')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [value, right] = middle.split(']')
      const supportedValue = supportedValues[value as keyof typeof supportedValues]

      if (supportedValue) {
        return linkUrl.replace(`[${value}]`, supportedValue)
      }
    }
    return linkUrl
  }

  return {
    processLinkUrl,
  }
}
