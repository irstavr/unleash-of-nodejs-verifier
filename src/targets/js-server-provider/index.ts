import { UnleashProvider } from "@unleash/openfeature-node-provider";
import type { ProviderTarget } from "../types.js";
import { startFakeUnleash } from "./fake-server.js";

export const unleashTarget: ProviderTarget = {
  name: "unleash",

  // Server provider: evaluates locally and takes per-call context.
  capabilities: ["localEval", "perCallContext"],

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
    // Diverges from the settled spec: emits FLAG_NOT_FOUND for a missing flag, but Unleash
    // philosophy (and our contract) says absence is not an error — return the plain default.
    "bool-missing-flag":
      "Returns FLAG_NOT_FOUND for a missing flag; spec says missing → default with no error.",
    // Real bug / release blocker: Number("") === 0, so an empty NUMBER payload returns a
    // silent 0 instead of the default + PARSE_ERROR.
    "number-empty-string-guard":
      'Returns 0 for an empty NUMBER payload (Number("") === 0); should be default + PARSE_ERROR.',
  },
};
