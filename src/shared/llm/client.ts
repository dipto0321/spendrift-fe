// Browser-direct LLM client.
//
// The user's API key never touches the Spendrift backend — we POST
// straight from the browser to whichever provider the user configured
// (Anthropic or any OpenAI-compatible endpoint). Network, CORS, and auth
// errors are mapped to local error types so callers can show meaningful
// messages without leaking transport details.

import type { AiSettings } from "../ai/types";

/**
 * Thrown for transient failures (timeouts, DNS issues, server 5xx). The
 * caller can choose to retry; `message` is the raw error text.
 */
export class LlmError extends Error {
	readonly status?: number;
	constructor(message: string, status?: number) {
		super(message);
		this.name = "LlmError";
		this.status = status;
	}
}

/** 401/403 — the user's key is missing, expired, or wrong. */
export class LlmAuthError extends LlmError {
	constructor(message = "Authentication failed. Check your API key.") {
		super(message, 401);
		this.name = "LlmAuthError";
	}
}

/** Provider accepted the request but the response wasn't the expected JSON. */
export class LlmSchemaError extends LlmError {
	constructor(message = "The model returned a response we couldn't parse.") {
		super(message);
		this.name = "LlmSchemaError";
	}
}

const ANTHROPIC_PATTERN = /^https?:\/\/([^/]*\.)?anthropic\.com\/?$/i;

/** Strip a trailing slash so we can concatenate `/v1/...` safely. */
function normalizeBaseUrl(url: string): string {
	return url.replace(/\/+$/, "");
}

function isAnthropic(baseUrl: string): boolean {
	try {
		return ANTHROPIC_PATTERN.test(normalizeBaseUrl(baseUrl));
	} catch {
		return false;
	}
}

/**
 * Call the user's configured LLM with a text prompt and ask for a JSON
 * object matching the provided schema. Branches on `baseUrl` between
 * Anthropic's `/v1/messages` and OpenAI-compatible `/v1/chat/completions`.
 */
export async function callLlmStructured(
	settings: AiSettings,
	prompt: string,
	schemaName: string,
): Promise<unknown> {
	if (!settings.apiKey) {
		throw new LlmAuthError(
			"Add an API key in AI Settings to use this feature.",
		);
	}

	const trimmed = settings.apiKey.trim();
	const base = normalizeBaseUrl(settings.baseUrl);

	if (isAnthropic(base)) {
		return callAnthropic(base, trimmed, settings.model, prompt, schemaName);
	}
	return callOpenAiCompatible(
		base,
		trimmed,
		settings.model,
		prompt,
		schemaName,
	);
}

// ----- Anthropic -----------------------------------------------------------

async function callAnthropic(
	base: string,
	apiKey: string,
	model: string,
	prompt: string,
	schemaName: string,
): Promise<unknown> {
	const body = {
		model,
		max_tokens: 2048,
		messages: [{ role: "user", content: prompt }],
		// Anthropic's structured-output path uses a tool with input_schema.
		// We force the model to call it so the response is guaranteed JSON.
		tools: [
			{
				name: schemaName,
				description: `Emit a JSON object matching the ${schemaName} schema.`,
				input_schema: {
					type: "object",
					properties: {},
					additionalProperties: true,
				},
			},
		],
		tool_choice: { type: "tool", name: schemaName },
	};

	let res: Response;
	try {
		res = await fetch(`${base}/v1/messages`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"x-api-key": apiKey,
				"anthropic-version": "2023-06-01",
				"anthropic-dangerous-direct-browser-access": "true",
			},
			body: JSON.stringify(body),
		});
	} catch (e) {
		throw new LlmError(`Network error: ${(e as Error).message}`);
	}

	const raw = await res.text();
	if (!res.ok) {
		throw mapHttpError(res.status, raw);
	}

	let payload: {
		content?: Array<{
			type?: string;
			input?: unknown;
			text?: string;
		}>;
	};
	try {
		payload = JSON.parse(raw) as typeof payload;
	} catch {
		throw new LlmSchemaError("Provider returned non-JSON.");
	}

	const toolBlock = payload.content?.find((b) => b.type === "tool_use");
	if (toolBlock?.input !== undefined) {
		return toolBlock.input;
	}

	// Fallback: extract the first JSON-looking substring from any text block.
	const text = payload.content?.find((b) => b.type === "text")?.text ?? "";
	return parseJsonOrThrow(text);
}

// ----- OpenAI-compatible ---------------------------------------------------

async function callOpenAiCompatible(
	base: string,
	apiKey: string,
	model: string,
	prompt: string,
	schemaName: string,
): Promise<unknown> {
	const body = {
		model,
		messages: [
			{ role: "system", content: "Reply with strict JSON only. No prose." },
			{ role: "user", content: prompt },
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				name: schemaName,
				// A permissive schema — the structured-output guarantee comes
				// from the prompt in practice. Real providers (OpenAI, Groq,
				// Together, etc.) accept additionalProperties:true at the root.
				schema: {
					type: "object",
					additionalProperties: true,
				},
				strict: false,
			},
		},
	};

	let res: Response;
	try {
		res = await fetch(`${base}/v1/chat/completions`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify(body),
		});
	} catch (e) {
		throw new LlmError(`Network error: ${(e as Error).message}`);
	}

	const raw = await res.text();
	if (!res.ok) {
		throw mapHttpError(res.status, raw);
	}

	let payload: {
		choices?: Array<{ message?: { content?: string } }>;
	};
	try {
		payload = JSON.parse(raw) as typeof payload;
	} catch {
		throw new LlmSchemaError("Provider returned non-JSON.");
	}

	const content = payload.choices?.[0]?.message?.content ?? "";
	return parseJsonOrThrow(content);
}

// ----- helpers -------------------------------------------------------------

function mapHttpError(status: number, body: string): LlmError {
	if (status === 401 || status === 403) {
		// Try to surface a provider-specific message.
		let detail = "Authentication failed.";
		try {
			const parsed = JSON.parse(body) as { error?: { message?: string } };
			if (parsed.error?.message) detail = parsed.error.message;
		} catch {
			/* keep detail as the default */
		}
		return new LlmAuthError(detail);
	}
	return new LlmError(
		`Provider error (${status}): ${body.slice(0, 200)}`,
		status,
	);
}

function parseJsonOrThrow(text: string): unknown {
	const trimmed = text.trim();
	if (!trimmed) {
		throw new LlmSchemaError("Model returned an empty response.");
	}
	// Direct parse first.
	try {
		return JSON.parse(trimmed);
	} catch {
		/* fall through to extraction */
	}
	// Find the first {...} or [...] block. Covers cases where models wrap JSON
	// in prose like "Here is the answer: {...}".
	const start = trimmed.search(/[[{]/);
	const end = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
	if (start === -1 || end <= start) {
		throw new LlmSchemaError("Model did not return JSON.");
	}
	try {
		return JSON.parse(trimmed.slice(start, end + 1));
	} catch {
		throw new LlmSchemaError("Model did not return valid JSON.");
	}
}
