import type { Client, EvaluationDetails, JsonValue } from "@openfeature/server-sdk";
import type { Scenario } from "../contract/types.js";

/** 
 * Make the OpenFeature call a scenario passed and return its EvaluationDetails. 
 */
export async function evaluate(
  client: Client, 
  scenario: Scenario
): Promise<EvaluationDetails<JsonValue>> {
  const ctx = scenario.context ?? {};

  switch (scenario.type) {
    case "boolean":
      return client.getBooleanDetails(
          scenario.flagKey, 
          scenario.default as boolean, 
          ctx
      ) as Promise<EvaluationDetails<JsonValue>>;
    case "string":
      return client.getStringDetails(
          scenario.flagKey, 
          scenario.default as string, 
          ctx
      ) as Promise<EvaluationDetails<JsonValue>>;
    case "number":
      return client.getNumberDetails(
          scenario.flagKey, 
          scenario.default as number, 
          ctx
      ) as Promise<EvaluationDetails<JsonValue>>;
    case "object":
      return client.getObjectDetails(
          scenario.flagKey, 
          scenario.default as JsonValue, 
          ctx
      );
    default: {
      // any unhandled flag type -> a compile error
      const _exhaustive: never = scenario.type;
      
      throw new Error(`unsupported flag type: ${String(_exhaustive)}`);
    }
  }
}
