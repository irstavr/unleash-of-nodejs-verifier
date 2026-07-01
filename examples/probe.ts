import { OpenFeature } from "@openfeature/server-sdk";
import { scenarios } from "../src/contract/scenarios.js";
import type { Expectation } from "../src/contract/types.js";
import { unleashTarget } from "../src/targets/js-server-provider/index.js";
import { evaluate } from "../src/runner/runScenario.js";

// print the REAL ResolutionDetails the Node provider returns for every
// scenario, next to what the contract expects. Ground truth, not inference.
const handle = await unleashTarget.setUp();

await OpenFeature.setProviderAndWait(handle.provider);

const client = OpenFeature.getClient();

const pad = (s: string, n: number) => (s + " ".repeat(n)).slice(0, n);

for (const s of scenarios) {
  const d = await evaluate(client, s);

  const got = { value: d.value, reason: d.reason, variant: d.variant, errorCode: d.errorCode };
  const exp = s.expect as Expectation;

  const match =
    JSON.stringify(got.value) === JSON.stringify(exp.value) &&
    (!exp.variant || got.variant === exp.variant) &&
    (exp.errorCode ? got.errorCode === exp.errorCode : got.errorCode === undefined);
  
  console.log(`${match ? "PASS" : "FAIL"}  ${pad(s.id, 28)}`);
  console.log(`        expect: ${JSON.stringify(exp)}`);
  console.log(`        got   : ${JSON.stringify(got)}`);
}

await OpenFeature.close();
await handle.teardown();
