# Edge cases — the full list, and why each matters

A provider is judged on how it behaves at the edges, not on the happy path.
This is the catalogue we verify. Items marked ✅ are covered by a scenario or
test today; ⏳ are documented and slated for the real-server (Tier B) suite.

## Booleans

- ✅ Enabled flag, strategy matches → `true`, reason `TARGETING_MATCH`.
- ✅ Enabled flag, strategy/constraint does **not** match → `false`, reason `DEFAULT`.
- ✅ Disabled flag → caller default, reason `DISABLED` (test with default `true`
  too, to prove the default is respected and not hard-coded to `false`).
- ✅ Unknown flag → caller default, error `FLAG_NOT_FOUND`.

## Variants → typed values

- ✅ String payload → the payload string, with the variant **name** surfaced on
  `variant`.
- ✅ JSON payload → parsed object.
- ✅ JSON payload that is an **array** → returned as an array (arrays are valid
  objects in OpenFeature).
- ✅ JSON payload that parses to a **scalar** (e.g. `42`) → **passes through**: a
  scalar is a valid OpenFeature `JsonValue`.
- ✅ NUMBER payload → parsed number.
- ✅ Typed call that disagrees with the payload type (number call on a string
  payload, etc.) → `TYPE_MISMATCH`. We do **not** silently coerce.
- ✅ String/typed call on a **disabled** flag → caller default + `DISABLED`,
  never the literal `"disabled"` sentinel variant value.
- ✅ Active variant with **no payload** → `TYPE_MISMATCH` (nothing to coerce).

## JavaScript coercion footguns (the sneaky ones)

- ✅ **`Number("") === 0`** — an empty NUMBER payload must be `PARSE_ERROR`, not
  `0`. This is the classic JS trap and the reason we guard `value.trim() === ''`
  before `Number(...)`.
- ✅ **Malformed JSON** → `PARSE_ERROR` (and the provider must catch `JSON.parse`,
  not let it throw).
- ✅ **`JSON.parse("null") === null`** / scalars → pass through as valid
  `JsonValue` (only malformed JSON is a `PARSE_ERROR`).
- 🔎 Worth adding as the spec firms up: hex/`"0x10"` strings, whitespace-only,
  very large numbers / precision, `NaN`/`Infinity` literals.

- ✅ **CSV payload** via `getStringValue` → resolves as the **raw string**
  (`string` and `csv` payloads both map to a string), reason `SPLIT`.

## Explicit non-support (honesty as a feature)

- ⏳ **Multi-context** (`{ kind: "multi", ... }`, à la LaunchDarkly) — Unleash
  models a single flat context, so this is out of scope; document it loudly.

## Targeting / context mapping

- ✅ `targetingKey` → Unleash `userId` (drives targeting + stickiness).
- ✅ Custom attribute (e.g. `region`) reaches Unleash constraints (lands in
  `properties`).
- ✅ Missing / `undefined` context → no throw; evaluates with what it has.
- 🔎 To extend: non-string attribute coercion (numbers, booleans), nested
  objects (we stringify), `targetingKey` of the wrong type, and
  `TARGETING_KEY_MISSING` if a flag's stickiness truly requires one.

## Lifecycle / events

- ✅ Evaluate **before ready** → `PROVIDER_NOT_READY` (not a fake default).
- ✅ Evaluate **after `initialize()`** → correct value.
- ⏳ Runtime flag change → emits `PROVIDER_CONFIGURATION_CHANGED` (needs a live
  server to mutate flags; Tier B).
- 🔎 A background refresh error must **not** knock a ready provider back to
  not-ready (the reference provider treats refresh errors as non-fatal).

## Robustness (never break the host app)

- ✅ Underlying client **throws** → provider returns `GENERAL`, does not throw.
- ✅ **Empty flag key** → `FLAG_NOT_FOUND`.
- 🔎 To extend: concurrent evaluations don't bleed context across calls; very
  long / special-character flag keys; evaluation during shutdown.

---

### How to read the symbols

✅ verified now · ⏳ deferred to a real-server suite · 🔎 candidate to add as the
semantic contract is finalised with the provider team.

### Intended behaviour vs the real provider's known gaps

Every ✅ above is the **agreed-correct** behaviour — the `reference` target meets
all of them. The **real** `unleash` provider currently misses three, tracked as
expected failures (`knownGaps` in `src/targets/unleash/index.ts`):
disabled-boolean ignores the caller default; an enabled-but-unmatched flag
reports `DISABLED` instead of `DEFAULT`; an empty NUMBER payload returns `0`
instead of `PARSE_ERROR`.
