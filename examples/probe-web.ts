import { OpenFeature } from "@openfeature/web-sdk";
import { scenarios } from "../src/contract/scenarios.js";
import { appliesTo, type Expectation, type Scenario } from "../src/contract/types.js";
import { setUpUnleashWeb, unleashWebCapabilities } from "../src/targets/js-web-provider/index.js";

// Ground truth for the WEB provider: real value/variant for every web-applicable row.
const handle = await setUpUnleashWeb();
await OpenFeature.setProviderAndWait(handle.provider);
const client = OpenFeature.getClient();

const pad = (s: string, n: number) => (s + " ".repeat(n)).slice(0, n);
const applicable = (scenarios as readonly Scenario[]).filter((s) =>
  appliesTo(s, unleashWebCapabilities),
);

for (const s of applicable) {
  const ex = s.expect as Expectation;
  const d =
    s.type === "boolean" ? client.getBooleanDetails(s.flagKey, s.default as boolean)
    : s.type === "string" ? client.getStringDetails(s.flagKey, s.default as string)
    : s.type === "number" ? client.getNumberDetails(s.flagKey, s.default as number)
    : client.getObjectDetails(s.flagKey, s.default as any);
  const tier1 =
    JSON.stringify(d.value) === JSON.stringify(ex.value) &&
    (!ex.variant || d.variant === ex.variant);
  console.log(`${tier1 ? "PASS" : "FAIL"}  ${pad(s.id, 28)} got=${JSON.stringify({ value: d.value, variant: d.variant })}`);
}

await OpenFeature.close();
await handle.teardown();
