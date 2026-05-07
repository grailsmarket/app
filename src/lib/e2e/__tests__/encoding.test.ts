import { describe, expect, it } from 'bun:test'
import { bytesToBase64, base64ToBytes, utf8ToBytes, bytesToUtf8 } from '../encoding'

describe('encoding', () => {
  it('round-trips arbitrary bytes through base64', () => {
    const original = new Uint8Array([0, 1, 2, 254, 255, 127, 128])
    expect(base64ToBytes(bytesToBase64(original))).toEqual(original)
  })

  it('round-trips utf-8 strings', () => {
    const samples = ['', 'hello', 'café', '日本語', '🔐 ↔ 💬']
    for (const s of samples) {
      expect(bytesToUtf8(utf8ToBytes(s))).toBe(s)
    }
  })

  it('handles empty input', () => {
    expect(bytesToBase64(new Uint8Array(0))).toBe('')
    expect(base64ToBytes('')).toEqual(new Uint8Array(0))
  })
})
