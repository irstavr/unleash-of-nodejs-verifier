import type { EvaluationContext } from "@openfeature/server-sdk";

export type OFFlagType = "boolean" | "string" | "number" | "object";

/**
 * Error codes we assert. Per the settled provider spec, the HAPPY PATH carries no
 * meaningful `reason` (providers emit UNKNOWN), so the contract does not assert `reason`
 * at all — only end-result value/variant, plus these error codes where a local evaluator
 * owns error semantics.
 */
export type OFErrorCodeName =
  | "PARSE_ERROR"
  | "TYPE_MISMATCH"
  | "PROVIDER_NOT_READY"
  | "GENERAL";

export interface Expectation {
  /** The end-result value the app receives. Asserted for every provider (Tier 1). */
  value: unknown;
  /** The variant name, when the flag resolves via a variant. Asserted when present (Tier 1). */
  variant?: string;
  /**
   * Expected error code. Asserted only for `localEval` targets (Tier 2) — a frontend
   * provider reads an already-evaluated cache and doesn't own error semantics.
   */
  errorCode?: OFErrorCodeName;
}

/**
 * A provider capability — this is what lets ONE contract serve every paradigm.
 *
 *  - "localEval"      the provider evaluates flags itself, so it OWNS error semantics
 *                     (TYPE_MISMATCH, PARSE_ERROR). Server providers have it; frontend/web
 *                     providers (which read an already-evaluated cache) do not.
 *  - "perCallContext" the provider takes dynamic context on every evaluation. Server
 *                     providers have it; web providers use STATIC context (set once).
 *
 * A scenario lists the capabilities it `requires`; a target lists the ones it has. The
 * runner skips a scenario a target can't support, and asserts `errorCode` only for
 * targets that evaluate locally. End-result assertions (value, variant) are universal.
 */
export type Capability = "localEval" | "perCallContext";

/**
 * The end-result OpenFeature behaviour every correct Unleash provider must show.
 * Provider-neutral data, so the same rows export to a cross-language contract later.
 */
export interface Scenario {
  id: string;
  description: string;
  /** e.g. ["variant", "object"]. */
  tags: readonly string[];
  /** Flag key to evaluate (must exist in the fixtures unless testing a missing flag). */
  flagKey: string;
  /** Which typed OpenFeature call to make. */
  type: OFFlagType;
  /** The default value passed to the OpenFeature call. */
  default: unknown;
  /** `targetingKey` maps to the provider's user identifier. */
  context?: EvaluationContext;
  /**
   * Capabilities a target MUST have for this scenario to apply. Omitted = universal.
   * Rows that probe dynamic context or local parse-detection declare what they need,
   * so static-context / non-evaluating providers skip them cleanly.
   */
  requires?: readonly Capability[];
  expect: Expectation;
}

/** True if a target with these capabilities can run the scenario. */
export function appliesTo(
  scenario: Pick<Scenario, "requires">,
  capabilities: readonly Capability[],
): boolean {
  return (scenario.requires ?? []).every((c) => capabilities.includes(c));
}
