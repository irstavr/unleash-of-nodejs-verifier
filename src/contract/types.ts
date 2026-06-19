import type { EvaluationContext } from "@openfeature/server-sdk";

export type OFFlagType = "boolean" | "string" | "number" | "object";

export type OFReason =
  | "STATIC"
  | "DEFAULT"
  | "TARGETING_MATCH"
  | "SPLIT"
  | "CACHED"
  | "DISABLED"
  | "UNKNOWN"
  | "ERROR";

export type OFErrorCodeName =
  | "PROVIDER_NOT_READY"
  | "FLAG_NOT_FOUND"
  | "PARSE_ERROR"
  | "TYPE_MISMATCH"
  | "TARGETING_KEY_MISSING"
  | "GENERAL";

export interface Expectation {
  value: unknown;
  reason?: OFReason;
  variant?: string;
  errorCode?: OFErrorCodeName;
}

/**
 * The OpenFeature behavior every correct provider should have.
 *
 * no provider-specific. That keeps this contract reusable across providers 
 * (and exportable to a cross-language Gherkin contract later).
 */
export interface Scenario {
  id: string;
  description: string;
  /** e.g. ["variant", "object"]. */
  tags: readonly string[];
  /** Flag key to evaluate (must exist in the fixtures unless testing FLAG_NOT_FOUND). */
  flagKey: string;
  /** Which typed OpenFeature call to make. */
  type: OFFlagType;
  /** The default value passed to the OpenFeature call. */
  default: unknown;
  /** `targetingKey` maps to the provider's user identifier. */
  context?: EvaluationContext;
  expect: Expectation;
}
