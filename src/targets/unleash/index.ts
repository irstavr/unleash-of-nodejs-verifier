import { UnleashProvider } from "@unleash/openfeature-node-provider";
import type { ProviderTarget } from "../types.js";
import { startFakeUnleash } from "./fake-server.js";

export const unleashTarget: ProviderTarget = {
  name: "unleash",

  async setUp() {
    // The Unleash target: the real `@unleash/openfeature-node-provider`, pointed at a
    // local fake Unleash Client API (no server, no token, loopback only). 

    const fake = await startFakeUnleash();

    // UnleashProvider builds its own client and only needs a URL, so this exercises its real
    // fetch/parse/evaluate path.
    const provider = new UnleashProvider({
      url: fake.url,
      appName: "openfeature-nodejs-verifier",
      customHeaders: { Authorization: fake.token },
      refreshInterval: 1000,
    });
    return { provider, control: fake.control, teardown: () => fake.close() };
  },

  // Scenarios the real provider doesn't satisfy yet (green while tracked; red once fixed).
  knownGaps: {
    "bool-disabled-default-true":
      "Returns false for a disabled boolean (ignores caller default); inconsistent with the variant path which returns the default on DISABLED.",
    "bool-targeting-miss":
      "Reports DISABLED for an enabled-but-unmatched flag; should be DEFAULT.",
    "number-empty-string-guard":
      'Returns 0 for an empty NUMBER payload (Number("") === 0); should be PARSE_ERROR.',
  },
};
