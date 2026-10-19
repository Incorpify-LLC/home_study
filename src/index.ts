interface Env {
	ASSETS: Fetcher;
	DB: D1Database;
	ROUGH_WORK: R2Bucket;
}

const jsonHeaders = {
	'cache-control': 'no-store',
	'content-type': 'application/json; charset=utf-8',
};

const sessionMaxAgeSeconds = 8 * 60 * 60;
const fallbackPasswordHash = 'pbkdf2-sha256$210000$MDEyMzQ1Njc4OWFiY2RlZg$H_ZMdkjDEDpZ4T7DlMYQs7RkF9UgyowFSsi_pzKxi-s';

type LoginUser = {
	id: string;
	role: 'parent' | 'student' | 'reviewer';
	display_name: string;
	password_hash: string;
};

type SessionUser = {
	role: LoginUser['role'];
	display_name: string;
};

function decodeBase64Url(value: string): Uint8Array {
	const base64 = value
		.replace(/-/g, '+')
		.replace(/_/g, '/')
		.padEnd(Math.ceil(value.length / 4) * 4, '=');
	return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function toHex(bytes: ArrayBuffer): string {
	return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function sessionToken(request: Request): string | null {
	for (const part of (request.headers.get('cookie') ?? '').split(';')) {
		const [name, ...value] = part.trim().split('=');
		if (name === 'home_study_session') return value.join('=') || null;
	}
	return null;
}

async function sessionState(request: Request, env: Env): Promise<Response> {
	const token = sessionToken(request);
	if (!token) return json({ authenticated: false });

	let tokenBytes: Uint8Array;
	try {
		tokenBytes = decodeBase64Url(token);
	} catch {
		return json({ authenticated: false });
	}

	if (tokenBytes.byteLength !== 32) return json({ authenticated: false });
	const tokenHash = toHex(await crypto.subtle.digest('SHA-256', tokenBytes));
	const user = await env.DB.prepare(
		`SELECT users.role, users.display_name
		 FROM sessions
		 JOIN users ON users.id = sessions.user_id
		 WHERE sessions.token_hash = ?
		   AND sessions.revoked_at IS NULL
		   AND sessions.expires_at > ?
		   AND users.active = 1`,
	)
		.bind(tokenHash, new Date().toISOString())
		.first<SessionUser>();

	return user ? json({ authenticated: true, user: { displayName: user.display_name, role: user.role } }) : json({ authenticated: false });
}

async function logout(request: Request, env: Env): Promise<Response> {
	const token = sessionToken(request);
	if (token) {
		try {
			const tokenBytes = decodeBase64Url(token);
			if (tokenBytes.byteLength === 32) {
				const tokenHash = toHex(await crypto.subtle.digest('SHA-256', tokenBytes));
				await env.DB.prepare('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
					.bind(new Date().toISOString(), tokenHash)
					.run();
			}
		} catch {
			// An invalid cookie has no server-side session to revoke.
		}
	}

	return new Response(null, {
		status: 204,
		headers: {
			'cache-control': 'no-store',
			'set-cookie': 'home_study_session=; Max-Age=0; Path=/; Secure; HttpOnly; SameSite=Strict',
		},
	});
}

async function verifyPassword(password: string, encodedHash: string): Promise<boolean> {
	const [algorithm, iterationsText, saltText, expectedText] = encodedHash.split('$');
	const iterations = Number(iterationsText);

	if (algorithm !== 'pbkdf2-sha256' || !Number.isSafeInteger(iterations) || iterations < 100_000 || !saltText || !expectedText) {
		// Still perform comparable derivation work so response timing does not reveal why verification failed.
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

	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
	const actual = new Uint8Array(
		await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations }, key, expected.byteLength * 8),
	);
	let difference = actual.byteLength ^ expected.byteLength;
	for (let index = 0; index < Math.max(actual.byteLength, expected.byteLength); index += 1) {
		difference |= (actual[index] ?? 0) ^ (expected[index] ?? 0);
	}
	return difference === 0;
}

async function deriveFallback(password: string): Promise<void> {
	const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
	await crypto.subtle.deriveBits(
		{ name: 'PBKDF2', hash: 'SHA-256', salt: decodeBase64Url(fallbackPasswordHash.split('$')[2]), iterations: 210_000 },
		key,
		32 * 8,
	);
}

async function login(request: Request, env: Env): Promise<Response> {
	if (!request.headers.get('content-type')?.toLowerCase().startsWith('application/json')) {
		return json({ error: 'invalid_request', message: 'A JSON request body is required.' }, 400);
	}

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_request', message: 'A valid JSON request body is required.' }, 400);
	}

	if (
		typeof body !== 'object' ||
		body === null ||
		!('identifier' in body) ||
		!('password' in body) ||
		typeof body.identifier !== 'string' ||
		typeof body.password !== 'string'
	) {
		return json({ error: 'invalid_request', message: 'Identifier and password are required.' }, 400);
	}

	const identifier = body.identifier.trim().toLowerCase();
	if (identifier.length === 0 || identifier.length > 128 || body.password.length === 0 || body.password.length > 256) {
		return json({ error: 'invalid_request', message: 'The sign-in request is invalid.' }, 400);
	}

	const user = await env.DB.prepare(
		`SELECT id, role, display_name, password_hash
		 FROM users
		 WHERE active = 1 AND lower(login_identifier) = ? AND password_hash IS NOT NULL`,
	)
		.bind(identifier)
		.first<LoginUser>();

	const passwordIsValid = await verifyPassword(body.password, user?.password_hash ?? fallbackPasswordHash);
	if (!user || !passwordIsValid) {
		return json({ error: 'invalid_credentials', message: 'The identifier or password is incorrect.' }, 401);
	}

	const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
	const token = btoa(String.fromCharCode(...tokenBytes))
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=+$/, '');
	const tokenHash = toHex(await crypto.subtle.digest('SHA-256', tokenBytes));
	const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000).toISOString();

	await env.DB.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)').bind(tokenHash, user.id, expiresAt).run();

	const response = json({
		authenticated: true,
		user: { displayName: user.display_name, role: user.role },
	});
	response.headers.set(
		'set-cookie',
		`home_study_session=${token}; Max-Age=${sessionMaxAgeSeconds}; Path=/; Secure; HttpOnly; SameSite=Strict`,
	);
	return response;
}

function json(body: unknown, status = 200): Response {
	return new Response(JSON.stringify(body), {
		status,
		headers: jsonHeaders,
	});
}

export default {
	async fetch(request, env): Promise<Response> {
		const { pathname } = new URL(request.url);

		if (pathname === '/api/health') {
			return json({
				service: 'home-study',
				status: 'ok',
				version: '0.1.0',
			});
		}

		if (pathname === '/api/session' && request.method === 'GET') {
			return sessionState(request, env);
		}

		if (pathname === '/api/login' && request.method === 'POST') {
			return login(request, env);
		}

		if (pathname === '/api/logout' && request.method === 'POST') {
			return logout(request, env);
		}

		if (pathname.startsWith('/api/')) {
			return json(
				{
					error: 'not_found',
					message: 'The requested API route does not exist.',
				},
				404,
			);
		}

		return env.ASSETS.fetch(request);
	},
} satisfies ExportedHandler<Env>;
