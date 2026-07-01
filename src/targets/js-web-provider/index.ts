import type { Provider } from "@openfeature/web-sdk";
import { UnleashWebProvider } from "@openfeature/unleash-web-provider";
import { InMemoryStorageProvider } from "unleash-proxy-client";
import type { Capability, Scenario } from "../../contract/types.js";
import type { ScenarioId } from "../../contract/scenarios.js";
import { toFrontendToggles } from "./toggles.js";

/**
 * THE WEB (CLIENT) TARGET — the real `@openfeature/unleash-web-provider`.
 *
 * It's a different OpenFeature paradigm from the server target: web-sdk, synchronous,
 * static context, reads an already-evaluated toggle cache (Frontend API / Edge / Proxy).
 * It does NOT evaluate locally and does NOT take per-call context — so it declares
 * neither capability, and the shared contract automatically runs only the Tier-1
 * (end-result) rows against it.
 *
 * We seed the underlying proxy-client via `bootstrap` (offline, no network), which is
 * exactly the data a Frontend API would push to a browser.
 */
export const unleashWebCapabilities: readonly Capability[] = [];

export interface WebTargetHandle {
  provider: Provider;
  teardown(): Promise<void>;
}

export async function setUpUnleashWeb(): Promise<WebTargetHandle> {
  const toggles = toFrontendToggles();

  // A fake Frontend API: respond to the proxy-client's fetch with already-evaluated
  // toggles. This keeps everything offline AND exercises the provider's real
  // fetch/parse path (rather than relying on bootstrap alone).
  const fakeFrontend: typeof fetch = async () =>
    new Response(JSON.stringify({ toggles }), {
      status: 200,
      headers: { "content-type": "application/json", ETag: '"verifier"' },
    });

  const provider = new UnleashWebProvider({
    url: "http://localhost/api/frontend/never-contacted-fetch-is-stubbed",  
    clientKey: "verifier",
    appName: "openfeature-web-verifier",
    disableRefresh: true,
    disableMetrics: true,
    storageProvider: new InMemoryStorageProvider(),
    bootstrap: toggles,
    bootstrapOverride: true,
    fetch: fakeFrontend,
  });
  return { provider, teardown: async () => provider.onClose?.() };
}

/**
 * Where the web provider diverges from the Tier-1 contract. Two are real upstream
 * bugs (object payloads not parsed); one is a paradigm choice (csv is read via
 * getObject, so a getString call on csv is a type mismatch by design).
 */
export const webKnownGaps: Partial<Record<ScenarioId, string>> = {
  "variant-json-object":
    "BUG: returns the raw JSON payload string, not a parsed object (no JSON.parse).",
  "variant-json-array":
    "BUG: returns the raw JSON payload string, not a parsed array.",
  "object-scalar-json-passthrough":
    "BUG: returns the raw JSON payload string '42', not the parsed scalar 42.",
  "variant-csv-as-string":
    "By design: csv is read via getObjectValue (raw csv string); a getStringValue call on csv is TYPE_MISMATCH.",
};

export type { Scenario };
