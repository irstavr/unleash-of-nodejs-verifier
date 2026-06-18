import type { Provider } from "@openfeature/server-sdk";
import type { ScenarioId } from "../contract/scenarios";

export interface ProviderTarget {
	name: string;
	setUp(): Promise<TargetHandle>;
	/**
	 * Scenarios the provider does not satisfy.
	 * EXPECTED failures (green while tracked; red once fixed) <scenarioId, expected>
	 */
	knownGaps?: Partial<Record<ScenarioId, string>>;
}

export interface TargetHandle {
	provider: Provider;
	control?: BackendControl; // drives STALE / recovery / change) */
	teardown(): Promise<void>;
}

export interface BackendControl {
	setFeatures(next: unknown): void;
	failNext(status: number, times?: number): void;
}
