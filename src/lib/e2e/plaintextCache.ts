'use client'

class PlaintextCache {
  private map = new Map<string, string>()
  set(id: string, plaintext: string) {
    this.map.set(id, plaintext)
    if (this.map.size > 500) {
      const firstKey = this.map.keys().next().value
      if (firstKey !== undefined) this.map.delete(firstKey)
    }
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
    }
  }
  delete(id: string) {
    this.map.delete(id)
  }
}

export const plaintextCache = new PlaintextCache()
