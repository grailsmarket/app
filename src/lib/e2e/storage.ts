'use client'
import { openDB, type IDBPDatabase } from 'idb'
import nacl from 'tweetnacl'
import { deriveSubkey } from './identity'

const DB_NAME = 'grails-e2e'
const STORE = 'kv'

let dbPromise: Promise<IDBPDatabase> | null = null
function db() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade: (d) => {
        d.createObjectStore(STORE)
      },
    })
  }
  return dbPromise
}

const secretboxKey = (storageKey: Uint8Array) => deriveSubkey(storageKey, 'secretbox')

export async function putEncrypted(key: string, plaintext: Uint8Array, storageKey: Uint8Array) {
  const sk = secretboxKey(storageKey)
  const nonce = nacl.randomBytes(24)
  const box = nacl.secretbox(plaintext, nonce, sk)
  const blob = new Uint8Array(nonce.length + box.length)
  blob.set(nonce, 0)
  blob.set(box, nonce.length)
  const d = await db()
  await d.put(STORE, blob, key)
}

export async function getEncrypted(key: string, storageKey: Uint8Array): Promise<Uint8Array | null> {
  const d = await db()
  const blob = (await d.get(STORE, key)) as Uint8Array | undefined
  if (!blob) return null
  const nonce = blob.slice(0, 24)
  const box = blob.slice(24)
  const out = nacl.secretbox.open(box, nonce, secretboxKey(storageKey))
  if (!out) throw new Error('E2E storage decrypt failed (wrong wallet?)')
  return out
}

export async function deleteEntry(key: string) {
  const d = await db()
  await d.delete(STORE, key)
}
