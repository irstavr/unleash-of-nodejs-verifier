import type { Provider } from "@openfeature/server-sdk";

/**
 * ProviderTarget: everything the verifier needs to test ONE OpenFeature provider: 
 * how to stand it up, an optional handle to steer its backend, and
 * which scenarios it doesn't satisfy yet.
 */
export interface ProviderTarget {
  name: string;
  /**
   * Stand up the backend and construct the provider.
   * The provider is NOT yet registered with OpenFeature — the test calls setProviderAndWait.
   */
  setUp(): Promise<TargetHandle>;
  /**
   * Scenario ids this provider does not yet satisfy, mapped to a short reason.
   * Those rows run as EXPECTED failures (green while tracked; red once fixed).
   */
  knownGaps?: Record<string, string>;
}

export interface TargetHandle {
  provider: Provider;
  /** backend control (drives STALE / recovery / change) */
  control?: BackendControl;
  teardown(): Promise<void>;
}

export interface BackendControl {
  setFeatures(next: unknown): void;
  failNext(status: number, times?: number): void;
}
