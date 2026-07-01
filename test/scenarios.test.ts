import { type Client, OpenFeature } from "@openfeature/server-sdk";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { scenarios, type ScenarioId } from "../src/contract/scenarios.js";
import { targets, type TargetHandle } from "../src/targets/index.js";
import { appliesTo, type Expectation, type Scenario } from "../src/contract/types.js";
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

	// Only the rows this target's paradigm can support. Reason/error semantics are
	// asserted solely for local evaluators (Tier 2); value/variant are universal (Tier 1).
	const applicable = (scenarios as readonly Scenario[]).filter((s) =>
		appliesTo(s, target.capabilities),
	);
	const evaluatesLocally = target.capabilities.includes("localEval");

	for (const s of applicable) {
		// A gap is declared by the TARGET (provider-specific), not the contract.
		// Gap rows run as EXPECTED failures: green while tracked, red once fixed.
		const gap = target.knownGaps?.[s.id as ScenarioId];
		const runner = gap ? it.fails : it;

		runner(`${s.id} — ${s.description}${gap ? " [KNOWN GAP]" : ""}`, async () => {
			const ex: Expectation = s.expect;

			const d = await evaluate(client, s);

			// Tier 1 — every provider: the end result the app acts on.
			expect(d.value).toEqual(ex.value);
			if (ex.variant) expect(d.variant).toBe(ex.variant);

			// Tier 2 — local evaluators only: error semantics. (Happy-path `reason` is
			// intentionally not asserted — the spec has providers emit UNKNOWN there.)
			if (evaluatesLocally) {
				if (ex.errorCode) expect(d.errorCode).toBe(ex.errorCode);
				else expect(d.errorCode).toBeUndefined();
			}
		});
	}
});
