import { afterEach, describe, expect, it, vi } from "vitest";
import type { AiSettings } from "../ai/types";
import {
	callLlmStructured,
	LlmAuthError,
	LlmError,
	LlmSchemaError,
} from "./client";

const SETTINGS: AiSettings = {
	apiKey: "sk-test-abc",
	baseUrl: "https://api.anthropic.com",
	model: "claude-sonnet-4-6",
	features: { smartReport: true, receiptOcr: false },
};

afterEach(() => {
	vi.restoreAllMocks();
});

describe("llm/client", () => {
	it("rejects early when no API key is configured", async () => {
		await expect(
			callLlmStructured({ ...SETTINGS, apiKey: "" }, "prompt", "schema"),
		).rejects.toBeInstanceOf(LlmAuthError);
	});

	it("posts to /v1/messages with the Anthropic request shape", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					content: [{ type: "tool_use", input: { ok: true } }],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await callLlmStructured(SETTINGS, "hello", "my_schema");

		expect(result).toEqual({ ok: true });
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("https://api.anthropic.com/v1/messages");
		const headers = (init as RequestInit).headers as Record<string, string>;
		expect(headers["x-api-key"]).toBe("sk-test-abc");
		expect(headers["anthropic-version"]).toBe("2023-06-01");
		expect(headers["anthropic-dangerous-direct-browser-access"]).toBe("true");
		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.model).toBe("claude-sonnet-4-6");
		expect(body.messages[0].content).toBe("hello");
		expect(body.tools[0].name).toBe("my_schema");
		expect(body.tool_choice).toEqual({ type: "tool", name: "my_schema" });
	});

	it("posts to /v1/chat/completions for OpenAI-compatible providers", async () => {
		const fetchMock = vi.fn().mockResolvedValue(
			new Response(
				JSON.stringify({
					choices: [{ message: { content: '{"a":1}' } }],
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } },
			),
		);
		vi.stubGlobal("fetch", fetchMock);

		const result = await callLlmStructured(
			{
				...SETTINGS,
				baseUrl: "https://api.openai.com",
			},
			"hello",
			"my_schema",
		);

		expect(result).toEqual({ a: 1 });
		const [url, init] = fetchMock.mock.calls[0];
		expect(url).toBe("https://api.openai.com/v1/chat/completions");
		const headers = (init as RequestInit).headers as Record<string, string>;
		expect(headers.Authorization).toBe("Bearer sk-test-abc");
		const body = JSON.parse((init as RequestInit).body as string);
		expect(body.response_format.type).toBe("json_schema");
		expect(body.response_format.json_schema.name).toBe("my_schema");
	});

	it("strips trailing slashes from the base URL before appending paths", async () => {
		const fetchMock = vi
			.fn()
			.mockResolvedValue(
				new Response(
					JSON.stringify({ choices: [{ message: { content: "{}" } }] }),
				),
			);
		vi.stubGlobal("fetch", fetchMock);

		await callLlmStructured(
			{ ...SETTINGS, baseUrl: "https://api.openai.com/" },
			"hello",
			"x",
		);
		expect(fetchMock.mock.calls[0][0]).toBe(
			"https://api.openai.com/v1/chat/completions",
		);
	});

	it("maps 401 responses to LlmAuthError", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(JSON.stringify({ error: { message: "bad key" } }), {
					status: 401,
				}),
			),
		);
		await expect(callLlmStructured(SETTINGS, "p", "s")).rejects.toBeInstanceOf(
			LlmAuthError,
		);
	});

	it("maps 500 responses to a generic LlmError with the status", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(new Response("boom", { status: 500 })),
		);
		try {
			await callLlmStructured(SETTINGS, "p", "s");
			throw new Error("should have thrown");
		} catch (e) {
			expect(e).toBeInstanceOf(LlmError);
			expect((e as LlmError).status).toBe(500);
		}
	});

	it("maps network failures to LlmError", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockRejectedValue(new Error("DNS lookup failed")),
		);
		await expect(callLlmStructured(SETTINGS, "p", "s")).rejects.toThrow(
			/DNS lookup failed/,
		);
	});

	it("extracts JSON embedded in prose when the provider returns text", async () => {
		vi.stubGlobal(
			"fetch",
			vi.fn().mockResolvedValue(
				new Response(
					JSON.stringify({
						choices: [
							{
								message: {
									content: 'Here is the JSON: {"hello":"world"} – done!',
								},
							},
						],
					}),
				),
			),
		);
		const result = await callLlmStructured(
			{ ...SETTINGS, baseUrl: "https://api.openai.com" },
			"p",
			"s",
		);
		expect(result).toEqual({ hello: "world" });
	});

	it("throws LlmSchemaError when the response is empty", async () => {
		vi.stubGlobal(
			"fetch",
			vi
				.fn()
				.mockResolvedValue(
					new Response(
						JSON.stringify({ choices: [{ message: { content: "" } }] }),
					),
				),
		);
		await expect(
			callLlmStructured(
				{ ...SETTINGS, baseUrl: "https://api.openai.com" },
				"p",
				"s",
			),
		).rejects.toBeInstanceOf(LlmSchemaError);
	});
});
