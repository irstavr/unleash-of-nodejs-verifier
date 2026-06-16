import { unleashJsOFtarget } from "./nodejsOFUnleashProvider/index.js";
import { referenceTarget } from "./reference/index.js";
import type { ProviderTarget } from "./types.js";

/**
 * The list of providers the verifier checks. The test scenarios iterate this list.
 * To add a new provider: create a new target folder and add it here.
 *
 * - unleash:   the real @unleash/openfeature-node-provider (has known gaps).
 * - reference: a correct hand-written provider (no gaps) — proves the contract
 *   is satisfiable and acts as a yardstick.
 */
export const targets: ProviderTarget[] = [unleashJsOFtarget, referenceTarget];

export type { BackendControl, ProviderTarget, TargetHandle } from "./types.js";
