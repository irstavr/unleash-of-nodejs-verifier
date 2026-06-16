/** The four OpenFeature evaluation types a provider must support. */
export type FlagType = 'boolean' | 'string' | 'number' | 'object';

/** OpenFeature standard resolution reasons */
export type Reason =
  | 'STATIC'
  | 'DEFAULT'
  | 'TARGETING_MATCH'
  | 'SPLIT'
  | 'CACHED'
  | 'DISABLED'
  | 'UNKNOWN'
  | 'ERROR';

/** OpenFeature standard error codes */
export type ErrorCodeName =
  | 'PROVIDER_NOT_READY'
  | 'FLAG_NOT_FOUND'
  | 'PARSE_ERROR'
  | 'TYPE_MISMATCH'
  | 'TARGETING_KEY_MISSING'
  | 'GENERAL';

export interface Expectation {
  /** Expected resolved value. For objects, compared deeply. */
  value: unknown;
  /** Expected reason. Omit if you don't care to pin it. */
  reason?: Reason;
  /** Expected variant name surfaced on ResolutionDetails. */
  variant?: string;
  /** Expected error code. Omit means "this must be a clean success (no error code)". */
  errorCode?: ErrorCodeName;
}

/**
 * A Scenario states the OpenFeature behaviour every correct provider should exhibit. 
 * Anything provider-specific — including which providers don't satisfy it yet — 
 * lives on the ProviderTarget (src/targets/), not here. To keep this contract reusable across providers.
 */
export interface Scenario {
  id: string;
  description: string;
  /** e.g. ["variant", "object"]. Maps to the future matrix legend. */
  tags: string[];
  /** Flag key to evaluate (must exist in the fixtures unless testing FLAG_NOT_FOUND). */
  flagKey: string;
  /** Which typed OpenFeature call to make. */
  type: FlagType;
  /** The default value passed to the OpenFeature call. */
  default: unknown;
  /** Evaluation context. `targetingKey` maps to the provider's user identifier. */
  context?: Record<string, unknown>;
  /** What the provider must return. */
  expect: Expectation;
}
