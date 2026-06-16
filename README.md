# Unleash OpenFeature Provider — Verifier (Node.js)

A small, runnable test suite that proves an OpenFeature **provider** behaves
correctly — driven through the real OpenFeature JS SDK, with **no Unleash server
required**.

---

## Why?

OpenFeature lets an app read feature flags through a vendor-neutral API and
"plug in" Unleash underneath via a **provider**. The provider's job is to
translate Unleash's world (enabled/disabled flags, variants with typed
payloads, targeting context) into OpenFeature's world (typed values plus a
`reason`, a `variant`, and an `errorCode`).

Getting a value back is easy. Getting the **reason and error semantics** right —
`DISABLED` vs `FLAG_NOT_FOUND` vs `TYPE_MISMATCH` vs `PARSE_ERROR` vs
`PROVIDER_NOT_READY` — is the hard part, and it's exactly what this verifier intends to support.

---

## Quick start

```bash
npm install
npm test          # run the contract against every registered provider target
npm run example   # end-to-end demo through the real provider, no server
npm run typecheck # tsc --noEmit
```

---

## How it's wired

Theres is a **ProviderTarget registry** (`src/targets/`): the universal contract lives in `src/contract/`, each provider is one self-contained target,
and the tests iterate the registry. Adding a provider is one new folder under
`src/targets/` plus one line in `src/targets/index.ts` — the contract, runner, and tests don't change.
