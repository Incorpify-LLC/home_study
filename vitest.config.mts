import { cloudflareTest, readD1Migrations } from '@cloudflare/vitest-plugin';
import { defineConfig } from 'vitest/config';

export default defineConfig(async () => ({
	test: {
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
