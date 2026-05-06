'use client'

class PlaintextCache {
  private map = new Map<string, string>()
  // Inflight decrypt promises keyed by message id. Olm's session.decrypt is
  // stateful and not idempotent — calling it twice on the same ciphertext
  // raises an error and may leave the ratchet in an undefined state. The
  // WS handler and useDecryptedBody both want to decrypt, so we serialize
  // through this map: first caller wins, others await the same Promise.
  private inflight = new Map<string, Promise<string>>()
  // Re-render trigger for `useDecryptedBody`: when mutationFn or rename
  // populates the cache for a row that previously failed to decrypt (e.g.
  // own-send where the ciphertext has no entry for our own device), a
  // tick bump lets the row recover.
  private listeners = new Set<() => void>()

  set(id: string, plaintext: string) {
    this.map.set(id, plaintext)
    if (this.map.size > 500) {
      const firstKey = this.map.keys().next().value
      if (firstKey !== undefined) this.map.delete(firstKey)
    }
    this.notify()
  }
  get(id: string): string | undefined {
    return this.map.get(id)
  }
  has(id: string): boolean {
    return this.map.has(id)
  }
  rename(oldId: string, newId: string) {
    const v = this.map.get(oldId)
    if (v !== undefined) {
      this.map.set(newId, v)
      this.map.delete(oldId)
      this.notify()
    }
  }
  delete(id: string) {
    if (this.map.delete(id)) this.notify()
  }

  subscribe(l: () => void): () => void {
    this.listeners.add(l)
    return () => {
      this.listeners.delete(l)
    }
  }
  private notify() {
    this.listeners.forEach((l) => l())
  }

  // Single-owner decrypt: run `fn` exactly once per message id and share the
  // result with all concurrent callers. The decrypted plaintext is cached so
  // late callers (post-decrypt) get the result synchronously via `get`.
  async decrypt(id: string, fn: () => Promise<string>): Promise<string> {
    const cached = this.map.get(id)
    if (cached !== undefined) return cached
    const inflight = this.inflight.get(id)
    if (inflight) return inflight
    const p = (async () => {
      try {
        const plaintext = await fn()
        this.set(id, plaintext)
        return plaintext
      } finally {
        this.inflight.delete(id)
      }
    })()
    this.inflight.set(id, p)
    return p
  }
}

export const plaintextCache = new PlaintextCache()
