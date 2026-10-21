import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => ({
	test: {
		// Test files share one D1 instance; running them in parallel lets concurrent
		// writes interfere and produces flaky failures, so they run in sequence.
		fileParallelism: false,
		// The integration tests make many sequential HTTP calls through workerd; the
		// default 5s budget is tight when the machine is busy running lint or build.
		testTimeout: 30000,
		hookTimeout: 30000,
		env: {
			REMOTE_SMOKE: process.env.REMOTE_SMOKE ?? '',
			STUDY_BASE_URL: process.env.STUDY_BASE_URL ?? '',
		},
	},
	plugins: [
		cloudflareTest({
			wrangler: { configPath: './wrangler.jsonc' },
			miniflare: {
				bindings: {
					ACCESS_AUD: 'test-audience',
					ACCESS_TEAM_DOMAIN: 'family.cloudflareaccess.com',
					ACCESS_TEST_MODE: 'true',
					TEST_MIGRATIONS: await readD1Migrations('./migrations'),
				},
			},
		}),
	],
}));
