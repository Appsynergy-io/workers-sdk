import { existsSync } from "node:fs";
import { cp, mkdtemp } from "node:fs/promises";
import { runCommand } from "@cloudflare/cli-shared-helpers/command";
import { afterEach, beforeEach, describe, it, vi } from "vitest";
import { copyExistingWorkerFiles } from "../../templates/pre-existing/c3";
import type { C3Context } from "types";

vi.mock("node:fs");
vi.mock("node:fs/promises");
vi.mock("@cloudflare/cli-shared-helpers/command");
vi.mock("helpers/packageManagers", async (importOriginal) => ({
	...(await importOriginal<typeof import("helpers/packageManagers")>()),
	detectPackageManager: vi.fn(() => ({ npm: "npm", npx: "npx", dlx: ["npx"] })),
}));

describe("copyExistingWorkerFiles", () => {
	const ctx = {
		args: { existingScript: "my-worker" },
		project: { path: "/project", name: "my-worker" },
		account: { id: "account-id", name: "Account" },
	} as C3Context;

	beforeEach(() => {
		vi.mocked(mkdtemp).mockResolvedValue("/tmp/c3-from-dash");
		vi.mocked(cp).mockResolvedValue(undefined);
		vi.mocked(existsSync).mockReturnValue(true);
	});

	afterEach(() => {
		vi.unstubAllEnvs();
		vi.clearAllMocks();
	});

	it("downloads the Worker with wrangler@latest by default", async ({
		expect,
	}) => {
		vi.stubEnv("WRANGLER_EXEC_SPEC", undefined);
		await copyExistingWorkerFiles(ctx);

		expect(vi.mocked(runCommand)).toHaveBeenCalledWith(
			[
				"npx",
				"wrangler@latest",
				"init",
				"--from-dash",
				"my-worker",
				"-y",
				"--no-delegate-c3",
			],
			expect.objectContaining({ cwd: "/tmp/c3-from-dash" })
		);
	});

	it("downloads the Worker with the spec WRANGLER_EXEC_SPEC sets", async ({
		expect,
	}) => {
		vi.stubEnv("WRANGLER_EXEC_SPEC", "example-cli@1.2.3");
		await copyExistingWorkerFiles(ctx);

		expect(vi.mocked(runCommand)).toHaveBeenCalledWith(
			expect.arrayContaining(["npx", "example-cli@1.2.3", "init"]),
			expect.anything()
		);
	});
});
