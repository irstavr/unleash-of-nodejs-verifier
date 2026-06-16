import {
	ErrorCode,
	type EvaluationContext,
	type JsonValue,
	OpenFeatureEventEmitter,
	type Provider,
	ProviderEvents,
	type ResolutionDetails,
	StandardResolutionReasons,
} from "@openfeature/server-sdk";
import type { Context, Variant } from "unleash-client";

export interface UnleashLike {
	isEnabled(name: string, context?: Context): boolean;
	getVariant(name: string, context?: Context): Variant;
	getFeatureToggleDefinition(name: string): { enabled: boolean } | undefined;
	on(event: string, cb: (...args: any[]) => void): unknown;
	destroy?(): void;
}

/**
 * REFERENCE PROVIDER — a LLM-written, conforms contract with no 'known gaps'.
 *
 * provider NEVER throws and NEVER returns a bare value
 * it returns ResolutionDetails with the right reason/errorCode.
 */
export class ReferenceUnleashProvider implements Provider {
	readonly metadata = { name: "reference-unleash-provider" } as const;
	readonly runsOn = "server" as const;
	readonly events = new OpenFeatureEventEmitter();

	private ready = false;

	constructor(private readonly unleash: UnleashLike) {
		this.unleash.on("ready", () => this.markReady());
		this.unleash.on("synchronized", () => this.markReady());
		this.unleash.on("changed", () =>
			this.events.emit(ProviderEvents.ConfigurationChanged),
		);
		this.unleash.on("error", (e: unknown) =>
			// A bg refresh error must NOT knock a ready provider back to not-ready;
			// surface it as a non-fatal event only.
			this.events.emit(ProviderEvents.Error, { message: String(e) }),
		);
	}

	async initialize(): Promise<void> {
		this.markReady();
	}

	async onClose(): Promise<void> {
		this.unleash.destroy?.();
	}

	private markReady() {
		if (!this.ready) {
			this.ready = true;
			this.events.emit(ProviderEvents.Ready);
		}
	}

	async resolveBooleanEvaluation(
		flagKey: string,
		defaultValue: boolean,
		context: EvaluationContext,
	): Promise<ResolutionDetails<boolean>> {
		return this.guard(defaultValue, () => {
			if (!this.ready) return this.notReady(defaultValue);
			const def = this.unleash.getFeatureToggleDefinition(flagKey);
			if (!def) return this.errored(defaultValue, ErrorCode.FLAG_NOT_FOUND);
			if (!def.enabled)
				return { value: defaultValue, reason: StandardResolutionReasons.DISABLED };

			const enabled = this.unleash.isEnabled(flagKey, toUnleashContext(context));
			return {
				value: enabled,
				reason: enabled
					? StandardResolutionReasons.TARGETING_MATCH
					: StandardResolutionReasons.DEFAULT,
			};
		});
	}

	async resolveStringEvaluation(
		flagKey: string,
		defaultValue: string,
		context: EvaluationContext,
	): Promise<ResolutionDetails<string>> {
		return this.resolveVariant(flagKey, defaultValue, context, "string") as Promise<
			ResolutionDetails<string>
		>;
	}

	async resolveNumberEvaluation(
		flagKey: string,
		defaultValue: number,
		context: EvaluationContext,
	): Promise<ResolutionDetails<number>> {
		return this.resolveVariant(flagKey, defaultValue, context, "number") as Promise<
			ResolutionDetails<number>
		>;
	}

	async resolveObjectEvaluation<T extends JsonValue>(
		flagKey: string,
		defaultValue: T,
		context: EvaluationContext,
	): Promise<ResolutionDetails<T>> {
		return this.resolveVariant(flagKey, defaultValue, context, "object") as Promise<
			ResolutionDetails<T>
		>;
	}

	// one Unleash Variant -> one typed OpenFeature result
	private async resolveVariant(
		flagKey: string,
		defaultValue: unknown,
		context: EvaluationContext,
		want: "string" | "number" | "object",
	): Promise<ResolutionDetails<any>> {
		return this.guard(defaultValue, () => {
			if (!this.ready) return this.notReady(defaultValue);
			if (!this.unleash.getFeatureToggleDefinition(flagKey))
				return this.errored(defaultValue, ErrorCode.FLAG_NOT_FOUND);

			const v = this.unleash.getVariant(flagKey, toUnleashContext(context));

			// Flag is off -> hand back the caller's default, never the "disabled" sentinel.
			if (!v.feature_enabled)
				return {
					value: defaultValue,
					reason: StandardResolutionReasons.DISABLED,
					variant: v.name,
				};

			// Active variant but no payload to coerce into the requested type.
			if (!v.payload) return this.errored(defaultValue, ErrorCode.TYPE_MISMATCH, v.name);

			const { type, value } = v.payload; // value is ALWAYS a string in Unleash

			if (want === "string") {
				// string and csv payloads both resolve as raw strings.
				if (type !== "string" && type !== "csv")
					return this.errored(defaultValue, ErrorCode.TYPE_MISMATCH, v.name);
				return this.ok(value, v.name);
			}

			if (want === "number") {
				if (type !== "number")
					return this.errored(defaultValue, ErrorCode.TYPE_MISMATCH, v.name);
				// Guard the JS footgun: Number("") === 0 and Number("  ") === 0.
				if (value.trim() === "")
					return this.errored(defaultValue, ErrorCode.PARSE_ERROR, v.name);
				const n = Number(value);
				if (!Number.isFinite(n))
					return this.errored(defaultValue, ErrorCode.PARSE_ERROR, v.name);
				return this.ok(n, v.name);
			}

			// want === 'object'
			if (type !== "json")
				return this.errored(defaultValue, ErrorCode.TYPE_MISMATCH, v.name);
			let parsed: unknown;
			try {
				parsed = JSON.parse(value);
			} catch {
				return this.errored(defaultValue, ErrorCode.PARSE_ERROR, v.name);
			}
			// A scalar (42, "x", true, null) is a valid OpenFeature JsonValue, so it
			// passes through; only malformed JSON is an error.
			return this.ok(parsed, v.name);
		});
	}

	private ok(value: unknown, variant: string): ResolutionDetails<any> {
		// Variant assignment is a weighted/sticky split, so SPLIT is the right reason.
		return { value, variant, reason: StandardResolutionReasons.SPLIT };
	}

	private errored(
		value: unknown,
		errorCode: ErrorCode,
		variant?: string,
	): ResolutionDetails<any> {
		return { value, reason: StandardResolutionReasons.ERROR, errorCode, variant };
	}

	private notReady(value: unknown): ResolutionDetails<any> {
		return {
			value,
			reason: StandardResolutionReasons.ERROR,
			errorCode: ErrorCode.PROVIDER_NOT_READY,
		};
	}

	/** Last line of defence: a provider must never throw into the host app. */
	private async guard(
		defaultValue: unknown,
		fn: () => ResolutionDetails<any>,
	): Promise<ResolutionDetails<any>> {
		try {
			return fn();
		} catch {
			return this.errored(defaultValue, ErrorCode.GENERAL);
		}
	}
}

/**
 * OpenFeature EvaluationContext -> Unleash Context.
 *  - targetingKey becomes userId (the stickiness anchor).
 *  - typed Unleash fields pass through; everything else lands in `properties`.
 */
export function toUnleashContext(ctx: EvaluationContext = {}): Context {
	const { targetingKey, userId, sessionId, remoteAddress, ...rest } = ctx as Record<
		string,
		unknown
	>;
	const properties: Record<string, string> = {};
	for (const [k, val] of Object.entries(rest)) {
		if (val === undefined || val === null) continue;
		properties[k] = typeof val === "object" ? JSON.stringify(val) : String(val);
	}
	return {
		userId: (targetingKey ?? userId) as string | undefined,
		sessionId: sessionId as string | undefined,
		remoteAddress: remoteAddress as string | undefined,
		properties,
	};
}
