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

// Minimal browser shape: src/lib/e2e/olm.ts gates on `typeof window === 'undefined'`
// and `typeof document === 'undefined'`. We don't need a real DOM — only the
// presence checks matter, plus `window.Olm` and a document with a no-op
// querySelector / createElement for the loader's early-return path.
;(globalThis as unknown as { window: { Olm: typeof Olm } }).window = { Olm }
;(globalThis as unknown as { document: { querySelector: () => null; head: { appendChild: () => void }; createElement: () => Record<string, unknown> } }).document = {
  querySelector: () => null,
  head: { appendChild: () => {} },
  createElement: () => ({ addEventListener: () => {} }),
}
