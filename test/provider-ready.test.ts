import type { Unleash } from "unleash-client";
import { afterEach, describe, expect, it } from "vitest";
import { bootstrapUnleash } from "../src/targets/reference/bootstrap.js";
import { ReferenceUnleashProvider } from "../src/targets/reference/provider.js";

let toCleanup: Unleash | undefined;

afterEach(() => {
	toCleanup?.destroy();
	toCleanup = undefined;
});

describe("Provider lifecycle", () => {
	it("returns PROVIDER_NOT_READY before init", async () => {
		const neverReady = {
			isEnabled: () => true,
			getVariant: () => ({
				name: "disabled",
				enabled: false,
				feature_enabled: false,
			}),
			getFeatureToggleDefinition: () => ({ enabled: true }),
			on: () => {},
		};
		const provider = new ReferenceUnleashProvider(neverReady as any);

		// evaluating before the client has data
		const d = await provider.resolveBooleanEvaluation(
			"demo.checkout-v2",
			false,
			{},
		);

		// sends NOT READY, so the OpenFeature SDK and the app can react
		expect(d.errorCode).toBe("PROVIDER_NOT_READY"); 
		expect(d.value).toBe(false); // default is respected even when not ready
	});

	it("evaluates correctly after initialize() resolves", async () => {
		const unleash = await bootstrapUnleash();
		toCleanup = unleash;
		const provider = new ReferenceUnleashProvider(unleash);

		const before = await provider.resolveBooleanEvaluation(
			"demo.checkout-v2",
			false,
			{},
		);

		// so it starts NOT_READY until initialize() is called
		expect(before.errorCode).toBe("PROVIDER_NOT_READY");

		await provider.initialize();

		const after = await provider.resolveBooleanEvaluation(
			"demo.checkout-v2",
			false,
			{},
		);

		expect(after.value).toBe(true);
		expect(after.errorCode).toBeUndefined();
	});

	// TODO: with a real-server suite
	it.todo(
		"emits X when the flag set changes at runtime",
	);
});
