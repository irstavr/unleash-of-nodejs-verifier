import type { Unleash } from "unleash-client";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapUnleash } from "../src/targets/reference/bootstrap.js";
import { ReferenceUnleashProvider } from "../src/targets/reference/provider.js";

let toCleanup: Unleash | undefined;

afterEach(() => {
	toCleanup?.destroy();
	toCleanup = undefined;
});

describe("Provider robustness", () => {
	it("returns GENERAL (not throw) when the underlying client throws", async () => {
		const faulty = {
			isEnabled: () => {
				throw new Error("boom");
			},
			getVariant: () => {
				throw new Error("boom");
			},
			getFeatureToggleDefinition: () => ({ enabled: true }),
			on: () => {},
		};
		const provider = new ReferenceUnleashProvider(faulty as any);
		await provider.initialize();

		const d = await provider.resolveBooleanEvaluation("anything", false, {});
		
		expect(d.errorCode).toBe("GENERAL");
		expect(d.value).toBe(false);
	});

	it("handles a missing/undefined context - not throw", async () => {
		const unleash = await bootstrapUnleash();
		toCleanup = unleash;
		const provider = new ReferenceUnleashProvider(unleash);
		await provider.initialize();

		const d = await provider.resolveBooleanEvaluation(
			"demo.checkout-v2",
			false,
			undefined as any,
		);
		
		expect(d.value).toBe(true);
		expect(d.errorCode).toBeUndefined();
	});

	it("treats an empty flag key as FLAG_NOT_FOUND - not throw", async () => {
		const unleash = await bootstrapUnleash();
		toCleanup = unleash;
		const provider = new ReferenceUnleashProvider(unleash);
		await provider.initialize();

		const d = await provider.resolveBooleanEvaluation("", false, {});
		
		expect(d.errorCode).toBe("FLAG_NOT_FOUND");
		expect(d.value).toBe(false);
	});
});
