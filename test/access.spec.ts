import { describe, expect, it } from 'vitest';
import { verifyAccessJwt } from '../src/index';

function base64Url(value: string | ArrayBuffer): string {
	const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : new Uint8Array(value);
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

async function fixture(overrides: Record<string, unknown> = {}) {
	const keyPair = (await crypto.subtle.generateKey(
		{ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
		true,
		['sign', 'verify'],
	)) as CryptoKeyPair;
	const publicKey = await crypto.subtle.exportKey('jwk', keyPair.publicKey);
	const now = 2_000_000_000;
	const header = base64Url(JSON.stringify({ alg: 'RS256', kid: 'test-key', typ: 'JWT' }));
	const payload = base64Url(
		JSON.stringify({
			aud: ['home-study-audience'],
			email: 'parent-a@example.test',
			exp: now + 300,
			iat: now - 10,
			nbf: now - 10,
			iss: 'https://family.cloudflareaccess.com',
			type: 'app',
			...overrides,
		}),
	);
	const signingInput = `${header}.${payload}`;
	const signature = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', keyPair.privateKey, new TextEncoder().encode(signingInput));
	return {
		token: `${signingInput}.${base64Url(signature)}`,
		now,
		fetcher: async () => Response.json({ keys: [{ ...publicKey, kid: 'test-key', alg: 'RS256', use: 'sig' }] }),
	};
}

describe('Cloudflare Access JWT verification', () => {
	it('accepts a correctly signed token for the configured application', async () => {
		const { token, now, fetcher } = await fixture();
		await expect(verifyAccessJwt(token, 'home-study-audience', 'family.cloudflareaccess.com', fetcher, now)).resolves.toEqual({
			email: 'parent-a@example.test',
		});
	});

	it.each([
		['wrong audience', { aud: ['another-application'] }],
		['expired token', { exp: 1_999_999_999 }],
		['wrong issuer', { iss: 'https://attacker.example' }],
		['wrong token type', { type: 'org' }],
	])('rejects a %s', async (_caseName, overrides) => {
		const { token, now, fetcher } = await fixture(overrides);
		await expect(verifyAccessJwt(token, 'home-study-audience', 'family.cloudflareaccess.com', fetcher, now)).resolves.toBeNull();
	});

	it('rejects a token whose signed content was changed', async () => {
		const { token, now, fetcher } = await fixture();
		const [header, , signature] = token.split('.');
		const tamperedPayload = base64Url(
			JSON.stringify({
				aud: ['home-study-audience'],
				email: 'attacker@example.test',
				exp: now + 300,
				iss: 'https://family.cloudflareaccess.com',
				type: 'app',
			}),
		);
		await expect(
			verifyAccessJwt(`${header}.${tamperedPayload}.${signature}`, 'home-study-audience', 'family.cloudflareaccess.com', fetcher, now),
		).resolves.toBeNull();
	});
});
