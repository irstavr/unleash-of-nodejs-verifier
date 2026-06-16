# Adding a new guarantee

You almost never edit a test file. To add a verified behaviour:

## 1. (If needed) add a flag to the fixtures

Open `fixtures/unleash-features.json` and add a feature using the real Unleash
shape. Example — a flag with an integer NUMBER variant:

```json
{
  "name": "demo.max-retries",
  "enabled": true,
  "strategies": [{ "name": "default", "parameters": {}, "constraints": [] }],
  "variants": [
    {
      "name": "high",
      "weight": 1000,
      "stickiness": "userId",
      "payload": { "type": "number", "value": "5" }
    }
  ]
}
```

Reminder: a variant `payload.value` is **always a string** in Unleash, even for
numbers and JSON. That's the point — the provider has to coerce it.

## 2. Add a scenario row

Open `src/contract/scenarios.ts` and add one object:

```ts
{
  id: 'number-integer',
  description: 'Integer NUMBER payload resolves to 5',
  tags: ['variant', 'number'],
  flagKey: 'demo.max-retries',
  type: 'number',
  default: 3,
  context: { targetingKey: 'user-42' },
  expect: { value: 5, variant: 'high', reason: 'SPLIT' },
},
```

Note: variant resolution reports reason `SPLIT` (variant assignment is a
weighted split). Use `TARGETING_MATCH` only for boolean enable.

A scenario row is **provider-neutral** — it never names a provider. If a
particular provider doesn't satisfy a row yet, that's recorded as a `knownGap`
on the **target** (`src/targets/<name>/index.ts`), not here.

## 3. Run

```bash
npm test
```

That's it. `scenarios.test.ts` picks up the new row automatically and runs it
against every registered target, reporting by `id`. No test code to write.

## Field cheat-sheet

| Field             | Meaning |
|-------------------|---------|
| `type`            | which OpenFeature call: `boolean` / `string` / `number` / `object` |
| `default`         | the default value passed to that call |
| `context`         | evaluation context; `targetingKey` → Unleash userId |
| `expect.value`    | required; deep-compared (objects/arrays OK) |
| `expect.reason`   | optional; pin it when it matters |
| `expect.variant`  | optional; the Unleash variant name |
| `expect.errorCode`| optional; **omit means "must be a clean success"** |

## Tips

- Omitting `expect.errorCode` is an assertion in itself: the test will fail if
  *any* error code comes back. Use that to lock down happy paths.
- Use `tags` to group capabilities; they become the columns of the published
  compatibility matrix later.
- Keep one behaviour per row. Small, named scenarios make failures obvious.
