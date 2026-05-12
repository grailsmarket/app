// Bun test bootstrap. Loaded once per test process via bunfig.toml's
// `preload`. Two responsibilities:
//
//  1. Install a Node-compatible IndexedDB so src/lib/e2e/storage.ts's `idb`
//     wrapper works without a browser. `fake-indexeddb/auto` sets the global
//     `indexedDB`, `IDBKeyRange`, etc. — no other code changes needed.
//
//  2. Stand up Olm in Node and expose it via the `window.Olm` shape the prod
//     `ensureOlm()` checks for. The prod path lazy-loads `/olm.js` from a
//     script tag, which doesn't exist in tests; pre-populating `window.Olm`
//     short-circuits the loader. We initialize Olm here once, then replace
//     `Olm.init` with a no-op so the prod path's subsequent call (which
//     passes a browser-shaped `locateFile`) doesn't try to re-init from a
//     non-existent `/olm.wasm`.
import 'fake-indexeddb/auto'
import Olm from '@matrix-org/olm'

await Olm.init()
// Replace init so the prod ensureOlm() call is a no-op. We can't just
// pre-resolve olmReady because the prod module is imported fresh by each
// test and its module-level state is scoped to that import.
;(Olm as unknown as { init: (...args: unknown[]) => Promise<void> }).init = async () => {}

// `window.Olm` is what the prod loader checks for. Setting it satisfies
// `typeof window !== 'undefined'` AND lets ensureOlm() skip the script-tag
// load entirely. This is safe to install globally — no module under test
// branches on `typeof window` for anything other than this lookup.
;(globalThis as unknown as { window: { Olm: typeof Olm } }).window = { Olm }

/**
 * Install a minimal browser-shaped `document` so prod modules whose
 * `typeof document !== 'undefined'` branch we want to exercise can run in
 * Bun. Currently only `src/lib/e2e/olm.ts` consumes it, and the path that
 * touches it (`loadOlmScript`) is short-circuited above by `window.Olm`
 * already being set.
 *
 * Scoped to a function (not installed in the preload) so that future
 * `'use client'` modules with different `typeof document` branches don't
 * silently flip into browser mode when accidentally imported into a Bun
 * test. Tests that need the shim call this explicitly; everything else
 * runs with `document === undefined`, the honest Node default.
 *
 * Returns a cleanup function. Pair with `beforeAll(() => cleanup =
 * installBrowserDocumentShim())` and `afterAll(() => cleanup())` to keep
 * the shim from leaking into adjacent test files.
 */
export function installBrowserDocumentShim(): () => void {
  const target = globalThis as unknown as { document?: unknown }
  const prior = target.document
  target.document = {
    querySelector: () => null,
    head: { appendChild: () => {} },
    createElement: () => ({ addEventListener: () => {} }),
  }
  return () => {
    if (prior === undefined) delete target.document
    else target.document = prior
  }
}
