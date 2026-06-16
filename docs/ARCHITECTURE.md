# Verifier architecture

This project verifies that an OpenFeature **provider** behaves correctly, by driving it through the real OF SDK and asserting the resolved
`value` / `reason` / `variant` / `errorCode` for a list of scenarios.

## High level

A vendor-neutral **contract** of expected OpenFeature behaviours, run by a tiny **runner** against a **registry of provider targets** — each target knowing how
to stand itself up and which scenarios it doesn't meet yet.

## The layout

- **Contract** — `scenarios.ts` is provider-NEUTRAL. Each row states the OF behaviour *every* correct provider should exhibit. Nothing provider-specific here.

- **Target** — a `ProviderTarget` (see `src/targets/types.ts`) is everything
  provider-specific, in its own folder:
  - `setUp()` stands up the backend and constructs the provider, returning a
    `{ provider, control?, teardown() }` handle;
  - `knownGaps` lists the scenario ids this provider doesn't satisfy yet.

  Two targets ship today:
  - `targets/unleashNodejsOFProvider/` — the real `@unleash/openfeature-node-provider` pointed
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
entry. See Linear tickets for more info.

## Run it

```bash
npm test          # conformance + stickiness + robustness + lifecycle, all providers
npm run example   # end-to-end demo against the real provider, no server needed
npm run typecheck # tsc --noEmit
```

The example also accepts `UNLEASH_URL` + `UNLEASH_API_TOKEN` to run against a
real Unleash instead of the fake Client API.

## How it connects to the provider

The provider (`@unleash/openfeature-node-provider`) is an ordinary dependency
(`file:` path or `npm link`). The connection is deliberately thin — just a
**URL**:

```
test ─▶ OpenFeature JS SDK ─▶ UnleashProvider ─▶ unleash-client ─▶ fake Client API (loopback)
        getXDetails()          (under test)        (its own copy)     (serves fixtures)
```

## Pros

- contract has zero provider knowledge
  - scenarios are plain data, exportable to JSON/Gherkin.
- adding a Node provider is one folder + one registry line; the
  contract, runner, and tests are untouched.
- tests through the real OF SDK + real provider + real fetch path, not internal mocks.
- fake Client API + bootstrap mean no server, Docker, or token;
  fast, can run in CI.

## Cons

- the runner loads providers in-process via the OF **JS** SDK;
  it cannot load a Java/Python/Go provider.
- the contract assumes a flag set in
  Unleash's `/api/client/features` format. A non-Unleash target must reproduce an
  equivalent flag set in its own backend; the contract is "universal *given* the
  fixtures," not built on abstract logical flags.
- `knownGaps` keyed by scenario id; a typo silently
  no-ops.

## Can the same project verify other providers (LaunchDarkly, flagd, …) of same language?

 **YES.**

Simply add a target folder, it runs against the same contract immediately.
Caveat: that target must seed an *equivalent* flag set in its own backend, since the fixtures are Unleash-shaped.

## Can the same project verify other providers of different languages?

**Should add a new runner.**

A Java provider implements the **Java** OF `Provider` interface consumed by the **Java** OF SDK; a Node process can't load it in-process. What ports across languages is **the contract, not the runner**:

- Export `scenarios` + `fixtures` to a language-neutral format (JSON, or
    **Gherkin**).
- Write a language runner binding those shared scenarios to that
  language's OF SDK + provider — ("one contract, many runners"). Each language keeps its own `knownGaps`. So the **source of truth is reusable across languages**
