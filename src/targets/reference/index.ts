import type { ProviderTarget } from "../types.js";
import { bootstrapUnleash } from "./bootstrap.js";
import { ReferenceUnleashProvider } from "./provider.js";

/**
 * The reference target: a correct, hand-written provider over a bootstrapped
 * (server-less) Unleash client. It has no known gaps — it implements the agreed
 * behaviour exactly — so running the contract against it proves the contract is
 * satisfiable and the harness works. (The provider's own client is destroyed in
 * onClose, which OpenFeature.close() triggers, so teardown is a no-op.)
 */
export const referenceTarget: ProviderTarget = {
  name: "reference",
  async setUp() {
    const unleash = await bootstrapUnleash();
    const provider = new ReferenceUnleashProvider(unleash);
    return { provider, teardown: async () => {} };
  },
};
