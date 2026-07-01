import type { IToggle } from "unleash-proxy-client";
import features from "../../../fixtures/unleash-features.json";

/**
 * Project our Unleash flag fixtures into the shape a Frontend API / Edge / Proxy
 * would return to a *client* SDK: already-evaluated toggles. This is the web
 * paradigm's input — not the raw Client-API config the server provider consumes.
 *
 * A real Frontend API resolves each flag's single active variant server-side; our
 * fixtures use 100%-weight variants, so that resolution is deterministic and we can
 * derive it here. One fixture, both paradigms.
 */
export function toFrontendToggles(): IToggle[] {
  return features.features.map((f: any) => {
    const v = f.variants?.[0];
    
    return {
      name: f.name,
      enabled: f.enabled,
      variant: v
        ? {
            name: v.name,
            enabled: true,
            feature_enabled: f.enabled,
            payload: v.payload,
          }
        : { name: "disabled", enabled: false, feature_enabled: f.enabled },
      impressionData: false,
    } as IToggle;
  });
}
