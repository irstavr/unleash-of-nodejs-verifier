/**
 * Example app — the REAL Unleash OpenFeature provider, through the OpenFeature API.
 *
 * Runs with NO Unleash server by default: an in-process fake Unleash Client API
 * serves the repo fixtures. Point it at a real Unleash by setting UNLEASH_URL.
 *
 *   npm run example
 *   UNLEASH_URL=http://localhost:4242/api UNLEASH_API_TOKEN=<token> npm run example
 *
 * The only Unleash-specific line is constructing the provider; everything after
 * is vendor-neutral OpenFeature.
 */
import {
	type EvaluationDetails,
	type FlagValue,
	OpenFeature,
} from "@openfeature/server-sdk";
import { UnleashProvider } from "@unleash/openfeature-node-provider";
import { startFakeUnleash } from "../../src/targets/unleashNodejsOFProvider/fake-server.js";

async function main() {
	const useRealServer = Boolean(process.env.UNLEASH_URL);
	const fake = useRealServer ? undefined : await startFakeUnleash();
	const url = process.env.UNLEASH_URL ?? fake!.url;
	const token = process.env.UNLEASH_API_TOKEN ?? fake!.token;

	console.log(
		useRealServer
			? `→ using real Unleash at ${url}\n`
			: "→ using an in-process fake Unleash Client API (no server needed)\n",
	);

	const provider = new UnleashProvider({
		url,
		appName: "openfeature-sample",
		customHeaders: { Authorization: token },
		refreshInterval: 1000,
	});
	await OpenFeature.setProviderAndWait(provider);

	const flags = OpenFeature.getClient();
	const ctx = { targetingKey: "user-42" };

	const show = (label: string, d: EvaluationDetails<FlagValue>) =>
		console.log(
			`  ${label.padEnd(34)} → ${JSON.stringify(d.value)}`.padEnd(70) +
				`(reason=${d.reason}` +
				(d.variant ? `, variant=${d.variant}` : "") +
				(d.errorCode ? `, error=${d.errorCode}` : "") +
				")",
		);

	console.log("Scenarios this provider supports:\n");
	show(
		"feature ON    demo.checkout-v2",
		await flags.getBooleanDetails("demo.checkout-v2", false, ctx),
	);
	show(
		"feature OFF   demo.legacy-banner",
		await flags.getBooleanDetails("demo.legacy-banner", false, ctx),
	);
	show(
		"string var    demo.greeting",
		await flags.getStringDetails("demo.greeting", "hi", ctx),
	);
	show(
		"json payload  demo.checkout-config",
		await flags.getObjectDetails("demo.checkout-config", {}, ctx),
	);
	show(
		"number var    demo.price-multiplier",
		await flags.getNumberDetails("demo.price-multiplier", 1, ctx),
	);
	show(
		"unknown flag  demo.missing",
		await flags.getBooleanDetails("demo.missing", false, ctx),
	);

	await OpenFeature.close();
	if (fake) await fake.close();
	console.log("\n[done]");
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
