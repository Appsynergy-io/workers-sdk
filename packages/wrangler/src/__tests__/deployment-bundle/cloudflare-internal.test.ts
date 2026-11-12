import * as esbuild from "esbuild";
import { describe, it } from "vitest";
import { cloudflareInternalPlugin } from "../../deployment-bundle/esbuild-plugins/cloudflare-internal";

async function bundle(contents: string, format: esbuild.Format) {
	return esbuild.build({
		stdin: { contents, loader: "js", sourcefile: "index.js" },
		bundle: true,
		format,
		write: false,
		logLevel: "silent",
		plugins: [cloudflareInternalPlugin],
	});
}

describe("cloudflareInternalPlugin", () => {
	it("resolves an apsy: specifier to its cloudflare: module as an external", async ({
		expect,
	}) => {
		const result = await bundle(
			`import { connect } from "apsy:sockets";
			import { WorkerEntrypoint } from "cloudflare:workers";
			export default { connect, WorkerEntrypoint };`,
			"esm"
		);
		const output = result.outputFiles[0].text;

		expect(output).toContain(`from "cloudflare:sockets"`);
		expect(output).toContain(`from "cloudflare:workers"`);
		expect(output).not.toContain("apsy:");
	});

	it("leaves an apsy: specifier it does not know to esbuild", async ({
		expect,
	}) => {
		await expect(
			bundle(`import x from "apsy:unknown"; export default x;`, "esm")
		).rejects.toThrow(/apsy:unknown/);
	});

	it("names the cloudflare: module of an apsy: import in a Service Worker", async ({
		expect,
	}) => {
		await expect(
			bundle(`import sockets from "apsy:sockets"; sockets;`, "iife")
		).rejects.toThrow(/Unexpected external import of "cloudflare:sockets"/);
	});
});
