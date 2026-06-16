import { type Client, OpenFeature } from "@openfeature/server-sdk";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { scenarios } from "../src/contract/scenarios.js";
import { targets, type TargetHandle } from "../src/targets/index.js";
import { evaluate } from "../src/runner/runScenario.js";

// Run the universal contract against EVERY registered provider target.
// Adding a provider (a new target) makes it appear here automatically.
describe.each(targets)("Provider conformance · $name", (target) => {
	let client: Client;
	let handle: TargetHandle;

	beforeAll(async () => {
		handle = await target.setUp();
		await OpenFeature.setProviderAndWait(handle.provider);
		client = OpenFeature.getClient();
	});

	afterAll(async () => {
		await OpenFeature.close();
		await handle.teardown();
	});

	for (const s of scenarios) {
		// A gap is declared by the TARGET (provider-specific), not the contract.
		// Gap rows run as EXPECTED failures: green while tracked, red once fixed.
		const gap = target.knownGaps?.[s.id];
		const runner = gap ? it.fails : it;

		runner(`${s.id} — ${s.description}${gap ? " [KNOWN GAP]" : ""}`, async () => {
			const d = await evaluate(client, s);

			expect(d.value).toEqual(s.expect.value);
			if (s.expect.reason) expect(d.reason).toBe(s.expect.reason);
			if (s.expect.variant) expect(d.variant).toBe(s.expect.variant);
			if (s.expect.errorCode) expect(d.errorCode).toBe(s.expect.errorCode);
			else expect(d.errorCode).toBeUndefined();
		});
	}
});
