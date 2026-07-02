import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { scenarios } from "../src/contract/scenarios.js";
import { toFrontendToggles } from "../src/targets/js-web-provider/toggles.js";
import clientFeatures from "../fixtures/unleash-features.json" with { type: "json" };

/**
 * Emit the contract as language-neutral data so any provider (Rust, Go, Java, …)
 * can consume the exact same rules without re-reading the TypeScript.
 *
 *   contract.json                 → the scenario catalogue + capability legend + fixtures
 *   fixtures/frontend-toggles.json → the Frontend-API shape a web runner must serve
 *
 * `npm run contract:export`
 */
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");

const contract = {
  contractVersion: "1.0.0",
  description:
    "End-result OpenFeature behaviour a correct Unleash provider must show.",
  capabilities: {
    localEval:
      "Provider evaluates flags itself and OWNS error semantics (TYPE_MISMATCH, PARSE_ERROR). Server providers.",
    perCallContext:
      "Provider takes dynamic evaluation context on every call. Server providers. (Web providers use static context.)",
  },
  assertions: {
    tier1: "value, variant — asserted for EVERY provider",
    tier2: "errorCode — asserted ONLY for targets with the `localEval` capability",
    notAsserted:
      "happy-path reason (providers emit UNKNOWN); init; events; IO/retry/backup (SDK concerns)",
  },
  fixtures: {
    clientApi: "fixtures/unleash-features.json (raw config; server providers via /api/client/features)",
    frontendApi: "fixtures/frontend-toggles.json (pre-evaluated toggles; web providers via /api/frontend)",
  },
  scenarios,
};

const contractJson = JSON.stringify(contract, null, 2);
writeFileSync(resolve(root, "contract.json"), contractJson + "\n");

// The Frontend-API projection of the same flags, so web runners in any language serve
// identical pre-evaluated toggles instead of re-deriving them.
const frontend = { toggles: toFrontendToggles() };
writeFileSync(
  resolve(root, "fixtures/frontend-toggles.json"),
  JSON.stringify(frontend, null, 2) + "\n",
);

const digest = createHash("sha256").update(contractJson).digest("hex").slice(0, 12);
console.log(`contract.json         ${scenarios.length} scenarios  sha256:${digest}`);
console.log(`fixtures/frontend-toggles.json  ${frontend.toggles.length} toggles`);
console.log(`fixtures/unleash-features.json  ${clientFeatures.features.length} client features`);
