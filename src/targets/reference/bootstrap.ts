import { once } from "node:events";
import { InMemStorageProvider, Unleash, UnleashEvents } from "unleash-client";
import features from "../../../fixtures/unleash-features.json";

/**
 * Build an Unleash client seeded entirely from the fixtures — no server needed.
 * The URL uses the `.invalid` TLD (RFC 2606, never resolves) so the throwaway
 * fetch fails instantly via DNS and can never hit a real Unleash on :4242.
 */
export async function bootstrapUnleash(): Promise<Unleash> {
  const unleash = new Unleash({
    url: "http://unleash-bootstrap.invalid/api",
    appName: "openfeature-nodejs-verifier",
    instanceId: "verifier",
    refreshInterval: 0,
    disableMetrics: true,
    storageProvider: new InMemStorageProvider(),
    bootstrap: { data: features.features as any },
    bootstrapOverride: true,
  });

  unleash.on(UnleashEvents.Error, () => {
    /* bootstrap data already serves evaluations */
  });

  // Repository emits Ready when bootstrap loads (loadBootstrap() -> setReady()).
  await once(unleash, UnleashEvents.Ready);
  return unleash;
}
