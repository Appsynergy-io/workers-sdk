import { afterEach, describe, it, vi } from "vitest";

describe("QUICK_TUNNEL_ALLOWED_HOST", () => {
	afterEach(() => {
		vi.unstubAllEnvs();
		vi.resetModules();
	});

	it("is under trycloudflare.com by default", async ({ expect }) => {
		vi.stubEnv("WRANGLER_QUICK_TUNNEL_DOMAIN", undefined);
		vi.resetModules();
		const { QUICK_TUNNEL_ALLOWED_HOST } = await import("../plugins/tunnel");

		expect(QUICK_TUNNEL_ALLOWED_HOST).toBe(".trycloudflare.com");
	});

	it("is under the domain WRANGLER_QUICK_TUNNEL_DOMAIN sets", async ({
		expect,
	}) => {
		vi.stubEnv("WRANGLER_QUICK_TUNNEL_DOMAIN", "quick.example.net");
		vi.resetModules();
		const { QUICK_TUNNEL_ALLOWED_HOST } = await import("../plugins/tunnel");

		expect(QUICK_TUNNEL_ALLOWED_HOST).toBe(".quick.example.net");
	});
});
