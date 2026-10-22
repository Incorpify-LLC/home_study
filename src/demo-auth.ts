/**
 * Credential sign-in for the evaluation demo identities.
 *
 * The family signs in through Cloudflare Access email OTP. This module adds a
 * deliberately narrow second door, used so an automated browser check can drive
 * the demo learner and demo parent without a human relaying a one-time code:
 *
 * - only accounts with `is_demo = 1` can ever be signed in this way;
 * - a password must first be set through a one-time enrolment code, so there is
 *   no "first visitor claims the account" window;
 * - the session cookie is a random 256-bit token whose SHA-256 hash is the only
 *   thing stored, and it is bounded in time and revocable;
 * - repeated failures are counted per identifier and locked out.
 *
 * Secrets never pass through the agent or the repository: the password is typed
 * by the owner into a masked prompt and verified here by PBKDF2.
 */

export const SESSION_COOKIE = 'home_study_session';
export const SESSION_MAX_AGE_SECONDS = 12 * 60 * 60;

/** Cloudflare Workers caps PBKDF2 iterations at 100_000; higher counts throw. */
export const MAX_PBKDF2_ITERATIONS = 100_000;
const MAX_FAILURES = 8;
const FAILURE_WINDOW_MINUTES = 15;

const FALLBACK_HASH = 'pbkdf2-sha256$100000$MDEyMzQ1Njc4OWFiY2RlZg$CQEF03iMraucElCfobodRqkaFY16F3mxFDIvP9WoJcs';

export type DemoAuthEnv = { DB: D1Database };

export type SignedInUser = {
	id: string;
	role: 'parent' | 'student' | 'reviewer';
	display_name: string;
	is_demo: number;
};

function decodeBase64Url(value: string): Uint8Array {
	const base64 = value
		.replace(/-/g, '+')
		.replace(/_/g, '/')
		.padEnd(Math.ceil(value.length / 4) * 4, '=');
	return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function encodeBase64Url(bytes: Uint8Array): string {
	return btoa(String.fromCharCode(...bytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
}

function toHex(buffer: ArrayBuffer): string {
	return [...new Uint8Array(buffer)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function derive(password: string, salt: Uint8Array, iterations: number, length: number): Promise<Uint8Array> {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
	const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, length * 8);
	return new Uint8Array(bits);
}

/** Comparable work on a rejection path, so timing does not reveal the reason. */
async function deriveFallback(password: string): Promise<void> {
	await derive(password, decodeBase64Url(FALLBACK_HASH.split('$')[2]), MAX_PBKDF2_ITERATIONS, 32);
}

export async function hashPassword(password: string): Promise<string> {
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const derived = await derive(password, salt, MAX_PBKDF2_ITERATIONS, 32);
	return `pbkdf2-sha256$${MAX_PBKDF2_ITERATIONS}$${encodeBase64Url(salt)}$${encodeBase64Url(derived)}`;
}

export async function verifyPassword(password: string, encodedHash: string | null): Promise<boolean> {
	if (!encodedHash) {
		await deriveFallback(password);
		return false;
	}
	const [algorithm, iterationsText, saltText, expectedText] = encodedHash.split('$');
	const iterations = Number(iterationsText);
	if (
		algorithm !== 'pbkdf2-sha256' ||
		!Number.isSafeInteger(iterations) ||
		iterations < MAX_PBKDF2_ITERATIONS ||
		iterations > MAX_PBKDF2_ITERATIONS ||
		!saltText ||
		!expectedText
	) {
		await deriveFallback(password);
		return false;
	}

	let salt: Uint8Array;
	let expected: Uint8Array;
	try {
		salt = decodeBase64Url(saltText);
		expected = decodeBase64Url(expectedText);
	} catch {
		await deriveFallback(password);
		return false;
	}
	if (expected.byteLength === 0) {
		await deriveFallback(password);
		return false;
	}

	const actual = await derive(password, salt, iterations, expected.byteLength);
	let difference = actual.byteLength ^ expected.byteLength;
	for (let index = 0; index < Math.max(actual.byteLength, expected.byteLength); index += 1) {
		difference |= (actual[index] ?? 0) ^ (expected[index] ?? 0);
	}
	return difference === 0;
}

export async function hashEnrolmentCode(code: string): Promise<string> {
	return toHex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code)));
}

export function cookieValue(request: Request, name: string): string | null {
	for (const part of (request.headers.get('cookie') ?? '').split(';')) {
		const [key, ...value] = part.trim().split('=');
		if (key === name) return value.join('=') || null;
	}
	return null;
}

function sessionCookie(token: string, maxAge: number): string {
	return `${SESSION_COOKIE}=${token}; Max-Age=${maxAge}; Path=/; Secure; HttpOnly; SameSite=Strict`;
}

export function clearedSessionCookie(): string {
	return sessionCookie('', 0);
}

export async function createSession(env: DemoAuthEnv, userId: string): Promise<string> {
	const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
	const token = encodeBase64Url(tokenBytes);
	const tokenHash = toHex(await crypto.subtle.digest('SHA-256', tokenBytes));
	const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();
	await env.DB.batch([
		env.DB.prepare(`DELETE FROM sessions WHERE expires_at < ?`).bind(new Date().toISOString()),
		env.DB.prepare(`INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)`).bind(tokenHash, userId, expiresAt),
	]);
	return sessionCookie(token, SESSION_MAX_AGE_SECONDS);
}

/**
 * Resolves a cookie session. Cookie sign-in is honoured only for demo accounts,
 * so the family's access can never rest on an app-level cookie.
 */
export async function userFromCookieSession(env: DemoAuthEnv, request: Request): Promise<SignedInUser | null> {
	const token = cookieValue(request, SESSION_COOKIE);
	if (!token) return null;
	let tokenBytes: Uint8Array;
	try {
		tokenBytes = decodeBase64Url(token);
	} catch {
		return null;
	}
	if (tokenBytes.byteLength !== 32) return null;
	const tokenHash = toHex(await crypto.subtle.digest('SHA-256', tokenBytes));
	return env.DB.prepare(
		`SELECT users.id, users.role, users.display_name, users.is_demo
		 FROM sessions
		 JOIN users ON users.id = sessions.user_id
		 WHERE sessions.token_hash = ?
		   AND sessions.revoked_at IS NULL
		   AND sessions.expires_at > ?
		   AND users.active = 1
		   AND users.is_demo = 1`,
	)
		.bind(tokenHash, new Date().toISOString())
		.first<SignedInUser>();
}

export async function revokeSession(env: DemoAuthEnv, request: Request): Promise<void> {
	const token = cookieValue(request, SESSION_COOKIE);
	if (!token) return;
	try {
		const tokenBytes = decodeBase64Url(token);
		if (tokenBytes.byteLength !== 32) return;
		const tokenHash = toHex(await crypto.subtle.digest('SHA-256', tokenBytes));
		await env.DB.prepare(`UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL`)
			.bind(new Date().toISOString(), tokenHash)
			.run();
	} catch {
		// A malformed cookie has no server-side session to revoke.
	}
}

export type ThrottleState = { limited: boolean; retryAfterSeconds: number };

export async function checkThrottle(env: DemoAuthEnv, scope: string): Promise<ThrottleState> {
	const row = await env.DB.prepare(`SELECT failures, window_started_at FROM login_attempts WHERE scope = ?`)
		.bind(scope)
		.first<{ failures: number; window_started_at: string }>();
	if (!row) return { limited: false, retryAfterSeconds: 0 };
	const windowStart = Date.parse(row.window_started_at);
	const elapsedMinutes = (Date.now() - windowStart) / 60000;
	if (!Number.isFinite(windowStart) || elapsedMinutes > FAILURE_WINDOW_MINUTES) return { limited: false, retryAfterSeconds: 0 };
	if (row.failures < MAX_FAILURES) return { limited: false, retryAfterSeconds: 0 };
	return { limited: true, retryAfterSeconds: Math.max(1, Math.ceil((FAILURE_WINDOW_MINUTES - elapsedMinutes) * 60)) };
}

export async function recordFailure(env: DemoAuthEnv, scope: string): Promise<void> {
	const row = await env.DB.prepare(`SELECT failures, window_started_at FROM login_attempts WHERE scope = ?`)
		.bind(scope)
		.first<{ failures: number; window_started_at: string }>();
	const windowStart = row ? Date.parse(row.window_started_at) : Number.NaN;
	const withinWindow = Number.isFinite(windowStart) && (Date.now() - windowStart) / 60000 <= FAILURE_WINDOW_MINUTES;
	const failures = withinWindow ? (row?.failures ?? 0) + 1 : 1;
	await env.DB.prepare(
		`INSERT INTO login_attempts (scope, failures, window_started_at) VALUES (?, ?, ?)
		 ON CONFLICT (scope) DO UPDATE SET failures = excluded.failures, window_started_at = excluded.window_started_at`,
	)
		.bind(scope, failures, withinWindow && row ? row.window_started_at : new Date().toISOString())
		.run();
}

export async function clearFailures(env: DemoAuthEnv, scope: string): Promise<void> {
	await env.DB.prepare(`DELETE FROM login_attempts WHERE scope = ?`).bind(scope).run();
}
