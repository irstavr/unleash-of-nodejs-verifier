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
`PROVIDER_NOT_READY` — is the hard part, and it's exactly what this suite pins.

---

## Quick start

```bash
npm install
npm test          # run the contract against every registered provider target
npm run example   # end-to-end demo through the real provider, no server
npm run typecheck # tsc --noEmit
```

Two targets are verified out of the box:

- **`unleash`** — the real `@unleash/openfeature-node-provider`, pointed at an
  in-process fake Unleash Client API (no server, no token). It carries a few
  tracked **known gaps** (run as expected failures).
- **`reference`** — a correct, hand-written provider with **no gaps**. It proves
  the contract is satisfiable and is a yardstick the real provider is diffed
  against.

The real provider is consumed as a `file:` dependency (or `npm link`
`@unleash/openfeature-node-provider`). No code edits are needed to test it — the
`unleash` target already points at it.

---

## How it's wired

The seam is a **ProviderTarget registry** (`src/targets/`): the universal
contract lives in `src/contract/`, each provider is one self-contained target,
and the tests iterate the registry. Adding a provider is one new folder under
`src/targets/` plus one line in `src/targets/index.ts` — the contract, runner,
and tests don't change.

See **[ARCHITECTURE.md](ARCHITECTURE.md)** for the full picture, pros/cons, and
how it connects to the provider. Other docs: [docs/EDGE-CASES.md](docs/EDGE-CASES.md),
[docs/ADDING-SCENARIOS.md](docs/ADDING-SCENARIOS.md).
