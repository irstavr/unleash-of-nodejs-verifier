import {
  type Client,
  type EvaluationDetails,
  type JsonValue,
  OpenFeature,
} from "@openfeature/web-sdk";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { scenarios, type ScenarioId } from "../src/contract/scenarios.js";
import { appliesTo, type Expectation, type Scenario } from "../src/contract/types.js";
import {
  setUpUnleashWeb,
  unleashWebCapabilities,
  webKnownGaps,
  type WebTargetHandle,
} from "../src/targets/js-web-provider/index.js";

/**
 * The SAME contract (src/contract/scenarios) run against the web provider — proving
 * "one contract, every paradigm". The web paradigm is synchronous and uses static
 * context, so this is a separate runner from the server suite, but it consumes the
 * identical scenario catalogue, filtered to the rows the web paradigm supports
 * (no localEval, no perCallContext). Only end-result (value/variant) is asserted —
 * Tier 1 — because a frontend provider doesn't own resolution semantics.
 */

// web-sdk evaluates synchronously and takes NO per-call context (it's static).
function evaluateWeb(client: Client, s: Scenario): EvaluationDetails<JsonValue> {
  switch (s.type) {
    case "boolean":
      return client.getBooleanDetails(s.flagKey, s.default as boolean) as EvaluationDetails<JsonValue>;
    case "string":
      return client.getStringDetails(s.flagKey, s.default as string) as EvaluationDetails<JsonValue>;
    case "number":
      return client.getNumberDetails(s.flagKey, s.default as number) as EvaluationDetails<JsonValue>;
    case "object":
      return client.getObjectDetails(s.flagKey, s.default as JsonValue);
  }
}

describe("Provider conformance · 'unleash-web' (client paradigm)", () => {
  let client: Client;
  let handle: WebTargetHandle;

  beforeAll(async () => {
    handle = await setUpUnleashWeb();
    await OpenFeature.setProviderAndWait(handle.provider);
    client = OpenFeature.getClient();
  });

  afterAll(async () => {
    await OpenFeature.close();
    await handle.teardown();
  });

  const applicable = (scenarios as readonly Scenario[]).filter((s) =>
    appliesTo(s, unleashWebCapabilities),
  );

  for (const s of applicable) {
    const gap = webKnownGaps[s.id as ScenarioId];
    const runner = gap ? it.fails : it;

    runner(`${s.id} — ${s.description}${gap ? " [KNOWN GAP]" : ""}`, () => {
      const ex: Expectation = s.expect;
      const d = evaluateWeb(client, s);

      // Tier 1 only — the end result the app acts on. Reason/errorCode are NOT
      // asserted: a frontend provider reads an already-evaluated cache and doesn't
      // own resolution semantics (it has no `localEval` capability).
      expect(d.value).toEqual(ex.value);
      if (ex.variant) expect(d.variant).toBe(ex.variant);
    });
  }
});
