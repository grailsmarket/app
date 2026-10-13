import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { zeroAddress, type Hex } from 'viem'
import { commitmentArguments, assertRegistrationSnapshot } from '../../src/utils/web3/registration-snapshot'
import reducer, {
  openBulkRegistrationModal,
  initializeBatches,
  setV2Snapshot,
  setBatchCommitted,
  setRegistrationError,
  openRegistrationModal,
} from '../../src/state/reducers/registration'
import type { V2RegistrationSnapshot } from '../../src/types/registration'
import type { MarketplaceDomainType } from '../../src/types/domains'

const snapshot: V2RegistrationSnapshot = {
  version: 1,
  chainId: 1,
  registrar: '0x1111111111111111111111111111111111111111',
  sender: '0x2222222222222222222222222222222222222222',
  owner: '0x3333333333333333333333333333333333333333',
  resolver: '0x4444444444444444444444444444444444444444',
  subregistry: zeroAddress,
  referrer: `0x${'11'.repeat(32)}`,
  names: [
    { label: 'one', duration: '31536000', entryIndex: 0 },
    { label: 'two', duration: '63072000', entryIndex: 1 },
  ],
}
const secret = `0x${'22'.repeat(32)}` as Hex
const domain = {} as MarketplaceDomainType

describe('persisted V2 registration', () => {
  it('uses one chosen resolver and original recipient/durations for every reveal after JSON reload', () => {
    const restored = JSON.parse(JSON.stringify(snapshot)) as V2RegistrationSnapshot
    const first = commitmentArguments(restored, 0, secret)
    const second = commitmentArguments(restored, 1, secret)
    assert.equal(first[4], snapshot.resolver)
    assert.equal(second[4], snapshot.resolver)
    assert.equal(first[1], snapshot.owner)
    assert.equal(second[5], BigInt(63072000))
    assert.equal(second[6], snapshot.referrer)
    assert.throws(() => commitmentArguments(restored, 2, secret))
  })
  it('blocks reveal from another wallet, chain or registrar', () => {
    assert.doesNotThrow(() => assertRegistrationSnapshot(snapshot, 1, snapshot.sender, snapshot.registrar))
    assert.throws(() => assertRegistrationSnapshot(snapshot, 11155111, snapshot.sender, snapshot.registrar))
    assert.throws(() => assertRegistrationSnapshot(snapshot, 1, snapshot.owner, snapshot.registrar))
    assert.throws(() => assertRegistrationSnapshot(snapshot, 1, snapshot.sender, snapshot.resolver))
  })
  it('creates individual V2 batches and preserves partially committed work on errors and reopen', () => {
    let state = reducer(
      undefined,
      openBulkRegistrationModal({
        entries: [
          { name: 'one.eth', domain },
          { name: 'two.eth', domain },
        ],
      })
    )
    state = reducer(state, initializeBatches(1))
    state = reducer(state, setV2Snapshot(snapshot))
    state = reducer(state, setBatchCommitted(0))
    state = reducer(state, setRegistrationError('Wallet declined the second commitment'))
    state = reducer(state, openRegistrationModal({ name: 'different.eth', domain }))
    assert.equal(state.batches.length, 2)
    assert.equal(state.batches[0].committed, true)
    assert.equal(state.batches[1].committed, false)
    assert.equal(state.entries[0].name, 'one.eth')
    state = reducer(state, setV2Snapshot({ ...snapshot, resolver: zeroAddress }))
    assert.equal(state.v2Snapshot?.resolver, snapshot.resolver)
  })
  it('keeps the existing V1 batching size', () => {
    const entries = Array.from({ length: 102 }, (_, index) => ({ name: `name${index}.eth`, domain }))
    const state = reducer(reducer(undefined, openBulkRegistrationModal({ entries })), initializeBatches(undefined))
    assert.equal(state.batches.length, 2)
    assert.equal(state.batches[0].nameIndices.length, 100)
  })
})
