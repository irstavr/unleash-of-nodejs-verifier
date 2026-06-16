import { type Client, OpenFeature } from "@openfeature/server-sdk";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { targets, type TargetHandle } from "../src/targets/index.js";

// Stickiness is provider-agnostic, so it runs against every target too.
describe.each(targets)("Variant stickiness · $name", (target) => {
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

	it("the same targetingKey ALWAYS gets the same variant", async () => {
		for (const id of ["alice", "bob", "carol", "user-123", "user-999"]) {
			const first = (await client.getStringDetails("demo.ab-test", "?", { targetingKey: id })).value;
			for (let i = 0; i < 25; i++) {
				const again = (await client.getStringDetails("demo.ab-test", "?", { targetingKey: id })).value;
				expect(again).toBe(first);
			}
		}
	});

	it("distributes ~50/50 across many keys", async () => {
		const counts: Record<string, number> = { A: 0, B: 0 };
		const N = 2000;
		for (let i = 0; i < N; i++) {
			const v = (await client.getStringDetails("demo.ab-test", "?", { targetingKey: `user-${i}` })).value;
			counts[v] = (counts[v] ?? 0) + 1;
		}
		// Every evaluation landed on a real variant (no leakage / errors).
		expect(counts.A + counts.B).toBe(N);
		// Loose bounds — "not wildly skewed", not exact balance.
		expect(counts.A).toBeGreaterThan(N * 0.35);
		expect(counts.B).toBeGreaterThan(N * 0.35);
	});
});
