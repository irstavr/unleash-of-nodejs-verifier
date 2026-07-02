
// The contract (the single source of truth).
export { scenarios, type ScenarioId } from "./contract/scenarios.js";
export {
  appliesTo,
  type Capability,
  type Scenario,
  type Expectation,
  type OFFlagType,
  type OFErrorCodeName,
} from "./contract/types.js";

// The runner: turn one scenario into one OpenFeature call on a caller-supplied client.
export { evaluate } from "./runner/runScenario.js";

// The server harness: a fake Unleash Client API (no server, no token, loopback only).
export {
  startFakeUnleash,
  type FakeUnleash,
  type FakeUnleashControl,
} from "./targets/js-server-provider/fake-server.js";
