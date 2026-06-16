# Example app

A small console demo (`index.ts`) that reads one flag of each kind through the
real provider and prints the value, reason, and variant.

## Why it's here

The customer's-eye view: the provider is constructed **once**, at startup;
everything after is the vendor-neutral OpenFeature API. Swap the provider and
the rest of the app is unchanged.

## Run it (no server needed)

```bash
npm run example
```

It starts an in-process fake Unleash Client API (`src/targets/unleash/fake-server.ts`),
serves `fixtures/unleash-features.json`, and evaluates a representative flag of
each type:

```
feature ON    demo.checkout-v2     → true                           (reason=TARGETING_MATCH)
feature OFF   demo.legacy-banner   → false                          (reason=DISABLED)
string var    demo.greeting        → "hello-world"                  (reason=SPLIT, variant=friendly)
json payload  demo.checkout-config → {"maxItems":50,"express":true} (reason=SPLIT, variant=rollout)
number var    demo.price-multiplier → 1.25                          (reason=SPLIT, variant=surge)
unknown flag  demo.missing         → false                          (reason=ERROR, error=FLAG_NOT_FOUND)
```

## Run it against a real Unleash

```bash
export UNLEASH_URL=http://localhost:4242/api
export UNLEASH_API_TOKEN=<client-token>
npm run example
```
