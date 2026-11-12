import { runInTempDir } from "@cloudflare/workers-utils/test-helpers";
import { http, HttpResponse } from "msw";
import { beforeEach, describe, it, vi } from "vitest";
import { getAccountR2Endpoint } from "../pipelines";
import { mockAccountId, mockApiToken } from "./helpers/mock-account-id";
import { mockConsoleMethods } from "./helpers/mock-console";
import { createFetchResult, msw } from "./helpers/msw";
import { runWrangler } from "./helpers/run-wrangler";

describe("APSY_STORAGE_SUFFIX", () => {
	const std = mockConsoleMethods();
	mockAccountId();
	mockApiToken();
	runInTempDir();

	beforeEach(() => {
		vi.stubEnv("APSY_STORAGE_SUFFIX", "storage.example.net");
	});

	it("sends an R2 SQL query under the storage domain", async ({ expect }) => {
		vi.stubEnv("WRANGLER_BASIN_SQL_AUTH_TOKEN", "test-token-123");
		let requestedUrl: string | undefined;
		msw.use(
			http.post(
				"https://api.sql.storage.example.net/api/v1/accounts/:accountId/basin-sql/query/:bucketName",
				async ({ request }) => {
					requestedUrl = request.url;
					return HttpResponse.json({
						success: true,
						errors: [],
						messages: [],
						result: { schema: [], rows: [] },
					});
				},
				{ once: true }
			)
		);

		await runWrangler(`basin sql query account123_mybucket "SELECT 1"`);
		expect(requestedUrl).toBe(
			"https://api.sql.storage.example.net/api/v1/accounts/account123/basin-sql/query/mybucket"
		);
	});

	it("names the catalog URI under the storage domain", async ({ expect }) => {
		msw.use(
			http.post(
				"*/accounts/some-account-id/r2-catalog/testBucket/enable",
				async () =>
					HttpResponse.json(
						createFetchResult(
							{
								id: "test-warehouse-id",
								name: "test-account-id_test-warehouse-name",
							},
							true
						)
					),
				{ once: true }
			)
		);

		await runWrangler("basin catalog enable testBucket");
		expect(std.out).toContain(
			"Catalog URI: 'https://catalog.storage.example.net/test-account-id/test-warehouse-name'"
		);
	});

	it("names the account's R2 endpoint under the storage domain", ({
		expect,
	}) => {
		expect(getAccountR2Endpoint("some-account-id")).toBe(
			"https://some-account-id.r2.storage.example.net"
		);

		vi.stubEnv("WRANGLER_API_ENVIRONMENT", "staging");
		expect(getAccountR2Endpoint("some-account-id")).toBe(
			"https://some-account-id.r2-staging.storage.example.net"
		);
	});
});
