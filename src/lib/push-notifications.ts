import type { PushSubscriptionPayload } from '@/api/push'

export type BrowserPushSupport = {
  supported: boolean
  reason?: 'server' | 'service-worker' | 'push-manager' | 'notification' | 'secure-context'
}

export type BrowserPushSubscription = {
  payload: PushSubscriptionPayload
  isExisting: boolean
}

export const getBrowserPushSupport = (): BrowserPushSupport => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return { supported: false, reason: 'server' }
  }

  if (!window.isSecureContext) {
    return { supported: false, reason: 'secure-context' }
  }

  if (!('serviceWorker' in navigator)) {
    return { supported: false, reason: 'service-worker' }
  }

  if (!('PushManager' in window)) {
    return { supported: false, reason: 'push-manager' }
  }

  if (!('Notification' in window)) {
    return { supported: false, reason: 'notification' }
  }

  return { supported: true }
}

export const getNotificationPermission = (): NotificationPermission | 'unsupported' => {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  return Notification.permission
}

export const getExistingPushSubscription = async () => {
  const registration = await getReadyServiceWorkerRegistration()
  return registration.pushManager.getSubscription()
}

export const subscribeToBrowserPush = async (vapidPublicKey: string): Promise<BrowserPushSubscription> => {
  const support = getBrowserPushSupport()
  if (!support.supported) {
    throw new Error('Push notifications are not supported in this browser.')
  }

  const permission = await requestPushPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const registration = await getReadyServiceWorkerRegistration()
  const existingSubscription = await registration.pushManager.getSubscription()
  if (existingSubscription) {
    return {
      payload: serializePushSubscription(existingSubscription),
      isExisting: true,
    }
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
  })

  return {
    payload: serializePushSubscription(subscription),
    isExisting: false,
  }
}

export const unsubscribeFromBrowserPush = async () => {
  const support = getBrowserPushSupport()
  if (!support.supported) return false

  const subscription = await getExistingPushSubscription()
  if (!subscription) return false

  return subscription.unsubscribe()
}

export const serializePushSubscription = (subscription: PushSubscription): PushSubscriptionPayload => {
  const json = subscription.toJSON()
  const p256dh = json.keys?.p256dh
  const auth = json.keys?.auth

  if (!json.endpoint || !p256dh || !auth) {
    throw new Error('Browser returned an incomplete push subscription.')
  }

  return {
    endpoint: json.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh,
      auth,
    },
    deviceName: getDefaultPushDeviceName(),
  }
}

export const getDefaultPushDeviceName = () => {
  if (typeof navigator === 'undefined') return 'Browser'

  const nav = navigator as Navigator & { userAgentData?: { brands?: Array<{ brand: string }> } }
  const brands = nav.userAgentData?.brands?.map((brand) => brand.brand).filter(Boolean)
  if (brands?.length) return brands.join(', ')

  return navigator.userAgent || 'Browser'
}

const getReadyServiceWorkerRegistration = async () => {
  if (!('serviceWorker' in navigator)) {
    throw new Error('Service workers are not supported in this browser.')
  }

  return navigator.serviceWorker.ready
}

const requestPushPermission = async () => {
  if (!('Notification' in window)) return 'denied'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') return Notification.permission

  return Notification.requestPermission()
}

export const urlBase64ToUint8Array = (base64Url: string) => {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)

  return Uint8Array.from(raw, (char) => char.charCodeAt(0))
}
