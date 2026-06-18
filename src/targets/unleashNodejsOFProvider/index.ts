import { UnleashProvider as UnleashJsOFProvider } from "@unleash/openfeature-node-provider";
import type { ProviderTarget } from "../types.js";
import { startFakeUnleash } from "./fake-server.js";

export const unleashTarget: ProviderTarget = {
  name: "unleash",

  async setUp() {
    const fake = await startFakeUnleash();

    const provider = new UnleashJsOFProvider({
      url: fake.url,
      appName: "openfeature-nodejs-verifier",
      customHeaders: { Authorization: fake.token },
      refreshInterval: 1000,
    });

    return { provider, control: fake.control, teardown: () => fake.close() };
  },

  // Scenarios the real provider does not satisfy yet (green while tracked; red once fixed). 
  knownGaps: {
    "bool-disabled-default-true":
      "Returns false for a disabled boolean (ignores caller default); inconsistent with the variant path which returns the default on DISABLED.",
    "bool-targeting-miss":
      "Reports DISABLED for an enabled-but-unmatched flag; should be DEFAULT.",
    "number-empty-string-guard":
      'Returns 0 for an empty NUMBER payload (Number("") === 0); should be PARSE_ERROR.',
  },
};
