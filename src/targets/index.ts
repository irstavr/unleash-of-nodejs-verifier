import { referenceTarget } from "./reference/index.js";
import type { ProviderTarget } from "./types.js";
import { unleashTarget } from "./unleashNodejsOFProvider/index.js";

/**
 * The list of providers the verifier checks.
 * 
 * To add a new provider: create a new target folder and add it here.
 * This is the list the test scenarios iterates.
 */
export const targets: ProviderTarget[] = [unleashTarget, referenceTarget];

export type { BackendControl, ProviderTarget, TargetHandle } from "./types.js";
