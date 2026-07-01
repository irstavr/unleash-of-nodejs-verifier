import type { ProviderTarget } from "../types.js";
import { bootstrapUnleash } from "./bootstrap.js";
import { ReferenceUnleashProvider } from "./provider.js";

/**
 * A provider over a server-less Unleash client - Used for testing.
 * 
 * It has no known gaps — implements the agreed behavior exactly — so running the 
 * contract against it proves the contract is satisfiable and the harness works. 
 */
export const referenceTarget: ProviderTarget = {
  name: "reference",
  // Server paradigm: evaluates locally, takes per-call context.
  capabilities: ["localEval", "perCallContext"],
  async setUp() {
    const unleash = await bootstrapUnleash();
    const provider = new ReferenceUnleashProvider(unleash);

    return { provider, teardown: async () => {} };
  },
};
