export type OFFlagType = 'boolean' | 'string' | 'number' | 'object';

export type OFReason =
  | 'STATIC'
  | 'DEFAULT'
  | 'TARGETING_MATCH'
  | 'SPLIT'
  | 'CACHED'
  | 'DISABLED'
  | 'UNKNOWN'
  | 'ERROR';

export type OFErrorCodeName =
  | 'PROVIDER_NOT_READY'
  | 'FLAG_NOT_FOUND'
  | 'PARSE_ERROR'
  | 'TYPE_MISMATCH'
  | 'TARGETING_KEY_MISSING'
  | 'GENERAL';

export interface Expectation {
  value: unknown;
  reason?: OFReason;
  variant?: string;
  errorCode?: OFErrorCodeName;
}

/**
 * How every correct provider should exhibit.
 * 
 * Anything provider-specific — including which providers don't satisfy it yet — 
 * lives on the ProviderTarget (src/targets/), not here. 
 * To keep this contract reusable across providers.
 */
export interface Scenario {
  id: string;
  description: string;
  /** e.g. ["variant", "object"]. Maps to the future matrix legend. */
  tags: string[];
  /** Flag key to evaluate (must exist in the fixtures unless testing FLAG_NOT_FOUND). */
  flagKey: string;
  /** Which typed OpenFeature call to make. */
  type: OFFlagType;
  /** The default value passed to the OF call */
  default: unknown;
  /** `targetingKey` maps to the provider's user identifier. */
  context?: Record<string, unknown>;
  expect: Expectation;
}
