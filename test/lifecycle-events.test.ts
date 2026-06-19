import { OpenFeature, type Provider, ProviderEvents } from "@openfeature/server-sdk";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { type TargetHandle, targets } from "../src/targets/index.js";

function onceEvent(provider: Provider, event: ProviderEvents, timeoutMs = 9000): Promise<void> {
	const emitter = provider.events;
	if (!emitter) return Promise.reject(new Error("provider exposes no event emitter"));
	const em = emitter; // definite, so nested closures don't lose the narrowing

	return new Promise<void>((resolve, reject) => {
		const handler = () => {
			cleanup();
			resolve();
		};
		const timer = setTimeout(() => {
			cleanup();
			reject(new Error(`timed out waiting for ${event}`));
		}, timeoutMs);
		function cleanup() {
			clearTimeout(timer);
			em.removeHandler(event, handler);
		}
		em.addHandler(event, handler);
	});
}

describe.each(targets)("Provider lifecycle events - $name", (target) => {
	let handle: TargetHandle;

	beforeAll(async () => {
		handle = await target.setUp();
		await OpenFeature.setProviderAndWait(handle.provider);
	});

	afterAll(async () => {
		await OpenFeature.close();
		await handle.teardown();
	});

	it("emits CONFIGURATION_CHANGED when the flag set changes", async () => {
		if (!handle.control) return; // no programmable backend (e.g. reference target)
		
		const changed = onceEvent(handle.provider, ProviderEvents.ConfigurationChanged);
		handle.control.setFeatures({
			version: 2,
			features: [
				{ name: "demo.checkout-v2", enabled: false, strategies: [{ name: "default", parameters: {}, constraints: [] }] },
			],
		});
		
		await expect(changed).resolves.toBeUndefined();
	});

	it.todo("goes STALE on a transient fetch error, then recovers to READY");
});
