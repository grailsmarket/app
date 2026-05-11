import { describe, expect, it } from 'bun:test'
import {
  encodeFanout,
  encodeHandshake,
  tryDecode,
  isFanoutEnvelope,
  isHandshakeEnvelope,
  isCiphertextEnvelope,
  findOwnCiphertext,
  type E2EFanoutEnvelope,
} from '../wire'

const fanout: E2EFanoutEnvelope = {
  v: 1,
  kind: 'fanout',
  sender_did: 'sender-did',
  mid: 'optimistic-1',
  cts: [
    { did: 'peer-1', type: 0, ct: 'ct-a' },
    { did: 'peer-2', type: 1, ct: 'ct-b' },
  ],
}

describe('wire encode/decode', () => {
  it('round-trips a fanout envelope', () => {
    const decoded = tryDecode(encodeFanout(fanout))
    expect(decoded).toEqual(fanout)
    expect(decoded && isFanoutEnvelope(decoded)).toBe(true)
    expect(decoded && isCiphertextEnvelope(decoded)).toBe(true)
  })

  it('round-trips a handshake envelope', () => {
    const hs = encodeHandshake({ v: 1, kind: 'hs', bundle: 'b64-bundle' })
    const decoded = tryDecode(hs)
    expect(decoded).toEqual({ v: 1, kind: 'hs', bundle: 'b64-bundle' })
    expect(decoded && isHandshakeEnvelope(decoded)).toBe(true)
    expect(decoded && isCiphertextEnvelope(decoded)).toBe(false)
  })
})

describe('tryDecode rejects malformed input', () => {
  const cases: Array<{ label: string; body: string | null | undefined }> = [
    { label: 'plain text', body: 'hello world' },
    { label: 'empty', body: '' },
    { label: 'null body', body: null },
    { label: 'undefined body', body: undefined },
    { label: 'bare json that is not our envelope', body: '{"foo":"bar"}' },
    { label: 'wrong v', body: JSON.stringify({ __e2e: { v: 2, kind: 'fanout', sender_did: 'x', cts: [] } }) },
    { label: 'unknown kind', body: JSON.stringify({ __e2e: { v: 1, kind: 'unknown' } }) },
    { label: 'fanout missing sender_did', body: JSON.stringify({ __e2e: { v: 1, kind: 'fanout', cts: [] } }) },
    {
      label: 'fanout cts not an array',
      body: JSON.stringify({ __e2e: { v: 1, kind: 'fanout', sender_did: 'x', cts: 'nope' } }),
    },
    {
      label: 'fanout ct entry mistyped',
      body: JSON.stringify({
        __e2e: {
          v: 1,
          kind: 'fanout',
          sender_did: 'x',
          cts: [{ did: 'p', type: 2, ct: 'c' }],
        },
      }),
    },
    { label: 'handshake missing bundle', body: JSON.stringify({ __e2e: { v: 1, kind: 'hs' } }) },
    { label: 'handshake bundle non-string', body: JSON.stringify({ __e2e: { v: 1, kind: 'hs', bundle: 42 } }) },
  ]

  for (const { label, body } of cases) {
    it(`rejects: ${label}`, () => {
      expect(tryDecode(body)).toBeNull()
    })
  }
})

describe('findOwnCiphertext', () => {
  it('returns the matching cts entry', () => {
    expect(findOwnCiphertext(fanout, 'peer-1')).toEqual({ did: 'peer-1', type: 0, ct: 'ct-a' })
    expect(findOwnCiphertext(fanout, 'peer-2')).toEqual({ did: 'peer-2', type: 1, ct: 'ct-b' })
  })

  it('returns null when our did is not a target', () => {
    expect(findOwnCiphertext(fanout, 'sender-did')).toBeNull()
    expect(findOwnCiphertext(fanout, 'absent-did')).toBeNull()
  })
})
