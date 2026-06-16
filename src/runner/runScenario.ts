import type {
  Client,
  EvaluationContext,
  EvaluationDetails,
  JsonValue,
} from '@openfeature/server-sdk';
import type { Scenario } from '../contract/types.js';

export async function evaluate(
  client: Client,
  s: Scenario,
): Promise<EvaluationDetails<JsonValue>> {
  const ctx = (s.context ?? {}) as EvaluationContext;

  // calls OF for a scenario
  switch (s.type) {
    case 'boolean':
      return client.getBooleanDetails(s.flagKey, s.default as boolean, ctx) as any;
    case 'string':
      return client.getStringDetails(s.flagKey, s.default as string, ctx) as any;
    case 'number':
      return client.getNumberDetails(s.flagKey, s.default as number, ctx) as any;
    case 'object':
      return client.getObjectDetails(s.flagKey, s.default as JsonValue, ctx) as any;
  }
}
