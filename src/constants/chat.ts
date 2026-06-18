/** Fixed UUID of the global "Grails Chat" room. */
export const GLOBAL_CHAT_ID = '00000000-0000-0000-0000-000000000001'

/** Max message length (server-enforced); mirrored by the composer and inline editor. */
export const MESSAGE_MAX_LEN = 4000

/** Autosize cap (px) for the composer/editor textareas; mirrors the `max-h-40` class. */
export const MESSAGE_INPUT_MAX_HEIGHT = 160

/** Image MIME types the backend accepts; mirrored client-side for instant validation. */
export const CHAT_IMAGE_ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

/** Fallback upload cap (10 MB) used until GET /chats/global reports the live max_image_bytes. */
export const CHAT_IMAGE_MAX_BYTES = 10 * 1024 * 1024

export const CHAT_IMAGE_MAX_COUNT = 5
