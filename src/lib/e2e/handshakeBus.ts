'use client'

export type HandshakeEvent = { chatId: string; bundle: string; senderUserId: number }
type Listener = (e: HandshakeEvent) => void

class HandshakeBus {
  private listeners = new Set<Listener>()
  on(l: Listener): () => void {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }
  emit(e: HandshakeEvent) {
    this.listeners.forEach((l) => l(e))
  }
}

export const handshakeBus = new HandshakeBus()
