# Verifier architecture

This project verifies that an OpenFeature **provider** behaves correctly, by
driving it through the real OpenFeature SDK and asserting the resolved
`value` / `reason` / `variant` / `errorCode` for a list of scenarios.

It is built so that **adding another provider later is one new file**.

## The layout

```
src/
  contract/   scenarios.ts (universal) · types.ts      ← what every provider must do
  runner/     runScenario.ts                           ← makes the OpenFeature call
  targets/
    types.ts                                           ← the ProviderTarget port
    index.ts                                           ← the registry: [unleash, reference]
    unleash/    index.ts (target + knownGaps) · fake-server.ts
    reference/  index.ts (target) · provider.ts · bootstrap.ts
test/           scenarios · variant-stick · no-crash · provider-ready
```

- **Contract** — `scenarios.ts` is provider-NEUTRAL. Each row states the
  OpenFeature behaviour *every* correct provider should exhibit. No
  provider-specific knowledge lives here.

- **Target** — a `ProviderTarget` (see `src/targets/types.ts`) is everything
  provider-specific, in its own folder:
  - `setUp()` stands up the backend and constructs the provider, returning a
    `{ provider, control?, teardown() }` handle;
  - `knownGaps` lists the scenario ids this provider doesn't satisfy yet.

  Two targets ship today:
  - `targets/unleash/` — the real `@unleash/openfeature-node-provider` pointed
    at a co-located **fake Unleash Client API** (`fake-server.ts`); has known gaps.
  - `targets/reference/` — a correct hand-written provider over a bootstrapped
    (server-less) client; **no gaps** — it proves the contract is satisfiable and
    is a yardstick the real provider can be diffed against.

- **Registry** — `src/targets/index.ts` exports `targets: ProviderTarget[]`.
  The test suites do `describe.each(targets)`, so every registered provider is
  verified against the whole contract, namespaced by target name in the output
  (`Provider conformance · <name>`).

## Known gaps

A scenario the provider gets wrong is declared on the **target** (`knownGaps`),
not the contract — because a gap is provider-specific. Those rows run as
`it.fails` (expected failures): the suite stays green while the gap is tracked,
and turns **red** the moment the provider is fixed, prompting you to delete the
entry. See the deep-analysis doc in the workspace for the current Unleash gaps.

## Run it

```bash
npm test          # conformance + stickiness + robustness + lifecycle, all providers
npm run example   # end-to-end demo against the real provider, no server needed
npm run typecheck # tsc --noEmit
```

The example also accepts `UNLEASH_URL` + `UNLEASH_API_TOKEN` to run against a
real Unleash instead of the fake Client API.

## Adding another provider (future)

1. Create `src/targets/<name>/index.ts` exporting a `ProviderTarget` (keep any
   backend helpers in the same folder, like `unleash/fake-server.ts`):
   - `setUp()` — stand up that provider's backend (a fake server, an in-memory
     adapter, or testcontainers) and construct the provider; return the handle.
   - `knownGaps` — scenario ids it doesn't satisfy yet.
2. Add it to the array in `src/targets/index.ts`.

That's it — the contract, the runner, and the test files don't change. Every
scenario runs against the new provider automatically, namespaced by target name
in the test output (`Provider conformance · <name>`).

## Backend control (for lifecycle tests)

`targets/unleash/fake-server.ts` exposes a small control surface (`setFeatures`,
`failNext`) via the target handle's `control`. That's the hook for driving the
real provider's lifecycle — STALE on a fetch error, recovery, and
`CONFIGURATION_CHANGED` on a flag change — through the seam. (Wiring those
assertions is the recommended next step; the hook is in place.)

## High level, in one breath

A vendor-neutral **contract** of expected OpenFeature behaviours, run by a tiny
**runner** against a **registry of provider targets** — each target knowing how
to stand itself up and which scenarios it doesn't meet yet.

## How it connects to the provider

The provider (`@unleash/openfeature-node-provider`) is an ordinary dependency
(`file:` path or `npm link`). The connection is deliberately thin — just a
**URL**:

```
test ─▶ OpenFeature JS SDK ─▶ UnleashProvider ─▶ unleash-client ─▶ fake Client API (loopback)
        getXDetails()          (under test)        (its own copy)     (serves fixtures)
```

1. The `unleash` target starts the in-process fake Unleash Client API and calls
   `new UnleashProvider({ url: fake.url, appName, customHeaders })`.
2. `OpenFeature.setProviderAndWait(...)` triggers the provider to build its
   **own** `unleash-client`, fetch `/api/client/features` from the fake server
   over loopback HTTP, and evaluate locally.
3. Tests call `getXDetails(...)`; the SDK routes to the provider; the provider
   returns `ResolutionDetails`, which the runner asserts.

The verifier never reaches into the provider's internals — it exercises the real
construction → fetch → parse → evaluate path a customer gets. A single copy of
`unleash-client` and `@openfeature/server-sdk` is enforced by package.json
`overrides` (the dual-package hazard).

## Pros

- **Locality** — everything provider-specific (wiring, backend, gaps) sits in one
  target folder; the contract has zero provider knowledge.
- **Leverage** — adding a Node provider is one folder + one registry line; the
  contract, runner, and tests are untouched.
- **Black-box fidelity** — tests through the real OF SDK + real provider + real
  fetch path, not internal mocks.
- **No infra** — fake Client API + bootstrap mean no server, Docker, or token;
  fast, runs on any laptop and in CI.
- **Honest tracking** — known-gaps run as expected failures: green while tracked,
  red the instant the provider is fixed.
- **Self-checking** — the `reference` target proves the contract is satisfiable
  and is a yardstick to diff the real provider against.
- **Portable contract** — scenarios are plain data, exportable to JSON/Gherkin.

## Cons / limits

- **Node/JS only** — the runner loads providers in-process via the OF **JS** SDK;
  it cannot load a Java/Python/Go provider (see below).
- **Fixtures are Unleash-shaped** — the contract assumes a canonical flag set in
  Unleash's `/api/client/features` format. A non-Unleash target must reproduce an
  equivalent flag set in its own backend; the contract is "universal *given* the
  fixtures," not built on abstract logical flags.
- **Lifecycle/robustness test the reference only** — the real provider's
  STALE/recovery/CONFIGURATION_CHANGED aren't driven yet (the `control` hook is
  ready; wiring is the next step).
- **Stringly-typed gaps** — `knownGaps` keyed by scenario id; a typo silently
  no-ops.
- **Loose stickiness tolerance** (35–65%); an oracle against unleash-client's own
  normalisation would be tighter.

## Verdict

For its actual job — verifying **Node** OpenFeature providers against one shared
contract — this is a strong shape: deep modules, a real seam justified by two
adapters (`unleash` + `reference`), and black-box fidelity. The honest caveat is
that "multi-provider" today means **multi-Node-provider**, and the fixtures carry
an Unleash bias. Neither is a flaw for the current goal; both are exactly what to
address if scope grows.

## Can the same project verify other providers / languages?

Two different questions:

- **Other Node OpenFeature providers (LaunchDarkly, flagd, …) — yes, directly.**
  Add a target folder with its `setUp()` and `knownGaps`; it runs against the
  same contract immediately. Caveat: that target must seed an *equivalent* flag
  set in its own backend, since the fixtures are Unleash-shaped.

- **Other-language providers / Unleash SDKs (Python, Java, Go, Ruby) — not with
  this runner.** A Java provider implements the **Java** OF `Provider` interface
  consumed by the **Java** OF SDK; a Node process can't load it in-process. What
  ports across languages is **the contract, not the runner**:
  - Export `scenarios` + `fixtures` to a language-neutral format (JSON, or
    **Gherkin**).
  - Write a thin per-language runner binding those shared scenarios to that
    language's OF SDK + provider — the OpenFeature `flagd-testbed` pattern
    ("one contract, many runners"). Each language keeps its own `knownGaps`.

  So the **source of truth is reusable across languages; the executing harness is
  necessarily per-language.** (Heavier alternative: run each provider behind a
  process boundary and drive it over HTTP — closer to "one runner," many more
  moving parts.)
