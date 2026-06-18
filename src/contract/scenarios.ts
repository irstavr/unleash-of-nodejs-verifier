import type { Scenario } from "./types.js";

/**
 * THE CONTRACT
 *
 * Guarantees "what a correct Unleash OpenFeature provider does."  *
 * Each Scenario says:
 *   "Given the flags in fixtures/unleash-features.json,
 *    when an app evaluates THIS flag THIS way,
 *    the provider MUST return THIS value / reason / variant / error."
 *
 * Later we can export these same rows to the cross-language
 * Gherkin contract without rewriting the meaning.
 */
export const scenarios: Scenario[] = [
  // Booleans
  {
    id: "bool-enabled",
    description: "Enabled flag with an always-on strategy resolves true (TARGETING_MATCH)",
    tags: ["boolean"],
    flagKey: "demo.checkout-v2",
    type: "boolean",
    default: false,
    context: { targetingKey: "user-42" },
    expect: { value: true, reason: "TARGETING_MATCH" },
  },
  {
    id: "bool-disabled",
    description: "Disabled flag returns the default with reason DISABLED",
    tags: ["boolean", "disabled"],
    flagKey: "demo.legacy-banner",
    type: "boolean",
    default: false,
    expect: { value: false, reason: "DISABLED" },
  },
  {
    id: "bool-disabled-default-true",
    description: "Disabled flag returns the caller-supplied default even when that default is true",
    tags: ["boolean", "disabled", "default-respected"],
    flagKey: "demo.legacy-banner",
    type: "boolean",
    default: true,
    expect: { value: true, reason: "DISABLED" },
  },
  {
    id: "bool-unknown-flag",
    description: "Unknown flag returns the default with error code FLAG_NOT_FOUND",
    tags: ["boolean", "flag-not-found"],
    flagKey: "demo.does-not-exist",
    type: "boolean",
    default: false,
    expect: { value: false, reason: "ERROR", errorCode: "FLAG_NOT_FOUND" },
  },
  {
    id: "bool-targeting-match",
    description: "Constraint matches context (region=EU) so the flag is enabled (TARGETING_MATCH)",
    tags: ["boolean", "context", "targeting"],
    flagKey: "demo.eu-only",
    type: "boolean",
    default: false,
    context: { targetingKey: "user-1", region: "EU" },
    expect: { value: true, reason: "TARGETING_MATCH" },
  },
  {
    id: "bool-targeting-miss",
    description: "Constraint does not match context (region=US) so the flag is off (DEFAULT)",
    tags: ["boolean", "context", "targeting"],
    flagKey: "demo.eu-only",
    type: "boolean",
    default: false,
    context: { targetingKey: "user-1", region: "US" },
    expect: { value: false, reason: "DEFAULT" },
  },

  // strings / variants
  {
    id: "variant-string",
    description: "String-payload variant resolves to its payload, with the variant name surfaced",
    tags: ["variant", "string"],
    flagKey: "demo.greeting",
    type: "string",
    default: "",
    context: { targetingKey: "user-42" },
    expect: { value: "hello-world", variant: "friendly", reason: "SPLIT" },
  },
  {
    id: "variant-string-on-disabled",
    description:
      'String call on a disabled flag returns the default (DISABLED), never the literal "disabled" variant',
    tags: ["variant", "string", "disabled"],
    flagKey: "demo.legacy-banner",
    type: "string",
    default: "fallback",
    expect: { value: "fallback", reason: "DISABLED" },
  },

  // numbers
  {
    id: "variant-number",
    description: 'NUMBER-payload variant (stored as "1.25") resolves to the number 1.25',
    tags: ["variant", "number"],
    flagKey: "demo.price-multiplier",
    type: "number",
    default: 1,
    context: { targetingKey: "user-42" },
    expect: { value: 1.25, variant: "surge", reason: "SPLIT" },
  },
  {
    id: "number-empty-string-guard",
    description: 'Empty NUMBER payload must be PARSE_ERROR — guarding the JS footgun Number("") === 0',
    tags: ["variant", "number", "parse-error", "edge"],
    flagKey: "demo.empty-number",
    type: "number",
    default: 7,
    context: { targetingKey: "user-42" },
    expect: { value: 7, reason: "ERROR", errorCode: "PARSE_ERROR" },
  },
  {
    id: "number-on-string-payload",
    description: "Number call on a string payload is a TYPE_MISMATCH, not a coercion",
    tags: ["variant", "number", "type-mismatch"],
    flagKey: "demo.greeting",
    type: "number",
    default: 0,
    context: { targetingKey: "user-42" },
    expect: { value: 0, reason: "ERROR", errorCode: "TYPE_MISMATCH" },
  },

  // objects
  {
    id: "variant-json-object",
    description: "JSON-payload variant resolves to a parsed object",
    tags: ["variant", "object", "json"],
    flagKey: "demo.checkout-config",
    type: "object",
    default: {},
    context: { targetingKey: "user-42" },
    expect: { value: { maxItems: 50, express: true }, variant: "rollout", reason: "SPLIT" },
  },
  {
    id: "variant-json-array",
    description: "JSON payload that is an array resolves as an array (arrays are valid objects)",
    tags: ["variant", "object", "json", "edge"],
    flagKey: "demo.array-config",
    type: "object",
    default: [],
    context: { targetingKey: "user-42" },
    expect: { value: [1, 2, 3], variant: "list", reason: "SPLIT" },
  },
  {
    id: "object-scalar-json-passthrough",
    description:
      "JSON payload that parses to a scalar (42) passes through (a scalar is a valid OpenFeature JsonValue)",
    tags: ["variant", "object", "json", "edge"],
    flagKey: "demo.scalar-json",
    type: "object",
    default: {},
    context: { targetingKey: "user-42" },
    expect: { value: 42, variant: "scalar", reason: "SPLIT" },
  },
  {
    id: "object-on-broken-json",
    description: "Malformed JSON payload is a PARSE_ERROR",
    tags: ["variant", "object", "parse-error"],
    flagKey: "demo.broken-json",
    type: "object",
    default: {},
    context: { targetingKey: "user-42" },
    expect: { value: {}, reason: "ERROR", errorCode: "PARSE_ERROR" },
  },

  // csv
  {
    id: "variant-csv-as-string",
    description: "CSV payload resolves as a raw string for getStringValue (by provider design)",
    tags: ["variant", "string", "csv"],
    flagKey: "demo.csv-export",
    type: "string",
    default: "none",
    context: { targetingKey: "user-42" },
    expect: { value: "a,b,c", variant: "csv", reason: "SPLIT" },
  },
];

export type ScenarioId = (typeof scenarios)[number]["id"];