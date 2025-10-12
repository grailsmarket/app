export const PREMIUM = 'Premium'
export const REGISTERED = 'Registered'
export const UNREGISTERED = 'Unregistered'
export const GRACE_PERIOD = 'Grace period'

export const REGISTERABLE_STATUSES = [PREMIUM, UNREGISTERED]
export const REGISTERED_STATUSES = [REGISTERED, GRACE_PERIOD]
export const ALL_REGISTRATION_STATUSES = [PREMIUM, REGISTERED, UNREGISTERED, GRACE_PERIOD] as const
