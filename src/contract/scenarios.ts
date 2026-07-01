import type { Scenario } from "./types.js";

/**
 * THE CONTRACT — the end-result OpenFeature behaviour a correct Unleash provider must show.
 *
 * Each row references a flag in `fixtures/unleash-features.json` and says, plainly:
 * "given this flag, called this way, the provider MUST return this VALUE (and VARIANT,
 * and — for local evaluators — this ERROR CODE)."
 *
 * Deliberately NOT asserted: the happy-path `reason`. Per the settled spec, providers emit
 * `UNKNOWN` on success, so reason carries no information and testing it only creates
 * provider-specific noise. Errors are asserted via `errorCode` (local evaluators only).
 *
 * Provider-neutral data → the same rows export to a cross-language contract.
 * Where a provider diverges, that's a `knownGap` on the TARGET (src/targets/<name>), not here.
 */
export const scenarios = [
  // Booleans — enabled/disabled state
  {
    id: "bool-enabled",
    description: "Enabled flag with an always-on strategy resolves true",
    tags: ["boolean"],
    flagKey: "demo.checkout-v2",
    type: "boolean",
    default: false,
    context: { targetingKey: "user-42" },
    expect: { value: true },
  },
  {
    id: "bool-disabled",
    description: "Disabled flag resolves false",
    tags: ["boolean", "disabled"],
    flagKey: "demo.legacy-banner",
    type: "boolean",
    default: false,
    expect: { value: false },
  },
  {
    id: "bool-disabled-default-true",
    description:
      "Disabled boolean resolves false (its real state), regardless of the caller default",
    tags: ["boolean", "disabled"],
    flagKey: "demo.legacy-banner",
    type: "boolean",
    default: true,
    expect: { value: false },
  },
  {
    id: "bool-missing-flag",
    description:
      "Missing flag returns the caller default with NO error (Unleash philosophy: absence is not an error)",
    tags: ["boolean", "missing"],
    flagKey: "demo.does-not-exist",
    type: "boolean",
    default: false,
    expect: { value: false },
  },

  // Booleans — dynamic targeting (server paradigm: context per call)
  {
    id: "bool-targeting-match",
    description: "Constraint matches context (region=EU) so the flag is enabled",
    tags: ["boolean", "context", "targeting"],
    flagKey: "demo.eu-only",
    type: "boolean",
    default: false,
    context: { targetingKey: "user-1", region: "EU" },
    requires: ["perCallContext"],
    expect: { value: true },
  },
  {
    id: "bool-targeting-miss",
    description: "Constraint does not match context (region=US) so the flag is off",
    tags: ["boolean", "context", "targeting"],
    flagKey: "demo.eu-only",
    type: "boolean",
    default: false,
    context: { targetingKey: "user-1", region: "US" },
    requires: ["perCallContext"],
    expect: { value: false },
  },

  // Strings / variants
  {
    id: "variant-string",
    description: "String-payload variant resolves to its payload, with the variant name surfaced",
    tags: ["variant", "string"],
    flagKey: "demo.greeting",
    type: "string",
    default: "",
    context: { targetingKey: "user-42" },
    expect: { value: "hello-world", variant: "friendly" },
  },
  {
    id: "variant-string-on-disabled",
    description:
      'String call on a disabled flag returns the caller default, never the literal "disabled" variant',
    tags: ["variant", "string", "disabled"],
    flagKey: "demo.legacy-banner",
    type: "string",
    default: "fallback",
    expect: { value: "fallback" },
  },

  // Numbers
  {
    id: "variant-number",
    description: 'NUMBER-payload variant (stored as "1.25") resolves to the number 1.25',
    tags: ["variant", "number"],
    flagKey: "demo.price-multiplier",
    type: "number",
    default: 1,
    context: { targetingKey: "user-42" },
    expect: { value: 1.25, variant: "surge" },
  },
  {
    id: "number-empty-string-guard",
    description:
      'Empty NUMBER payload must not silently coerce to 0 — returns the default (PARSE_ERROR for local evaluators)',
    tags: ["variant", "number", "parse-error", "edge"],
    flagKey: "demo.empty-number",
    type: "number",
    default: 7,
    context: { targetingKey: "user-42" },
    expect: { value: 7, errorCode: "PARSE_ERROR" },
  },
  {
    id: "number-on-string-payload",
    description: "Number call on a string payload returns the default (TYPE_MISMATCH for local evaluators)",
    tags: ["variant", "number", "type-mismatch"],
    flagKey: "demo.greeting",
    type: "number",
    default: 0,
    context: { targetingKey: "user-42" },
    expect: { value: 0, errorCode: "TYPE_MISMATCH" },
  },

  // Objects
  {
    id: "variant-json-object",
    description: "JSON-payload variant resolves to a parsed object",
    tags: ["variant", "object", "json"],
    flagKey: "demo.checkout-config",
    type: "object",
    default: {},
    context: { targetingKey: "user-42" },
    expect: { value: { maxItems: 50, express: true }, variant: "rollout" },
  },
  {
    id: "variant-json-array",
    description: "JSON payload that is an array resolves as an array",
    tags: ["variant", "object", "json", "edge"],
    flagKey: "demo.array-config",
    type: "object",
    default: [],
    context: { targetingKey: "user-42" },
    expect: { value: [1, 2, 3], variant: "list" },
  },
  {
    id: "object-scalar-json-passthrough",
    description: "JSON payload that parses to a scalar (42) passes through as a valid JsonValue",
    tags: ["variant", "object", "json", "edge"],
    flagKey: "demo.scalar-json",
    type: "object",
    default: {},
    context: { targetingKey: "user-42" },
    expect: { value: 42, variant: "scalar" },
  },
  {
    id: "object-on-broken-json",
    description: "Malformed JSON payload is a PARSE_ERROR (requires local parsing)",
    tags: ["variant", "object", "parse-error"],
    flagKey: "demo.broken-json",
    type: "object",
    default: {},
    context: { targetingKey: "user-42" },
    // Only a local evaluator parses payloads, so only it can detect malformed JSON.
    requires: ["localEval"],
    expect: { value: {}, errorCode: "PARSE_ERROR" },
  },

  // CSV
  {
    id: "variant-csv-as-string",
    description: "CSV payload resolves as a raw string for a getString call",
    tags: ["variant", "string", "csv"],
    flagKey: "demo.csv-export",
    type: "string",
    default: "none",
    context: { targetingKey: "user-42" },
    expect: { value: "a,b,c", variant: "csv" },
  },
] as const satisfies readonly Scenario[];

export type ScenarioId = (typeof scenarios)[number]["id"];
