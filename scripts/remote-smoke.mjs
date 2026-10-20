/* global fetch, console */
import assert from 'node:assert/strict';
import { env as processEnv } from 'node:process';

const workerOrigin = processEnv.STUDY_WORKER_ORIGIN ?? 'https://home-study.saneax.workers.dev';
const protectedOrigin = processEnv.STUDY_PROTECTED_ORIGIN ?? 'https://study.saneax.in';

const healthResponse = await fetch(`${workerOrigin}/api/health`, { redirect: 'manual' });
assert.equal(healthResponse.status, 200, `Direct Worker health returned ${healthResponse.status}`);
assert.deepEqual(await healthResponse.json(), {
	service: 'home-study',
	status: 'ok',
	version: '0.1.0',
});

const workerLearningResponse = await fetch(`${workerOrigin}/api/learning/current`, { redirect: 'manual' });
assert.equal(workerLearningResponse.status, 401, `Unauthenticated Worker learning API returned ${workerLearningResponse.status}`);

for (const path of ['/', '/api/health', '/api/learning/current']) {
	const response = await fetch(`${protectedOrigin}${path}`, { redirect: 'manual' });
	assert.equal(response.status, 302, `Protected ${path} returned ${response.status}`);
	const location = response.headers.get('location') ?? '';
	assert.match(location, /^https:\/\/[^/]+\.cloudflareaccess\.com\/cdn-cgi\/access\/login\/study\.saneax\.in/);
}

console.log(
	JSON.stringify({
		status: 'ok',
		health: `${workerOrigin}/api/health`,
		protectedOrigin,
		verified: ['health contract', 'unauthenticated API denial', 'Cloudflare Access redirects'],
	}),
);
