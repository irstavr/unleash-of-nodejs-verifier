import { once } from "node:events";
import { InMemStorageProvider, Unleash, UnleashEvents } from "unleash-client";
import features from "../../../fixtures/unleash-features.json";

export async function bootstrapUnleash(): Promise<Unleash> {
  // an Unleash client seeded entirely from the fixtures — no server needed
  const unleash = new Unleash({
    url: "http://unleash-bootstrap.invalid/api", // so the throwaway fetch fails instantly and never hits a real Unleash on :4242
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

  // emits Ready when bootstrap loads (loadBootstrap() -> setReady()).
  await once(unleash, UnleashEvents.Ready);
  return unleash;
}
