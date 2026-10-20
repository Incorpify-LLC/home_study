interface Env {
	ACCESS_AUD: string;
	ACCESS_TEAM_DOMAIN: string;
	ACCESS_TEST_MODE?: string;
	ASSETS: Fetcher;
	DB: D1Database;
	ROUGH_WORK: R2Bucket;
}

const jsonHeaders = {
	'cache-control': 'no-store',
	'content-type': 'application/json; charset=utf-8',
};

type SessionUser = {
	id: string;
	role: 'parent' | 'student' | 'reviewer';
	display_name: string;
};

type StudentSummary = {
	id: string;
	displayName: string;
	classLevel: string;
	board: string | null;
	examYear: number | null;
};

function decodeBase64Url(value: string): Uint8Array {
	if (!/^[A-Za-z0-9_-]*$/.test(value) || value.length % 4 === 1) throw new Error('Invalid base64url value.');
	const base64 = value
		.replace(/-/g, '+')
		.replace(/_/g, '/')
		.padEnd(Math.ceil(value.length / 4) * 4, '=');
	return Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
}

function decodeJwtJson(value: string): Record<string, unknown> {
	const decoded = new TextDecoder().decode(decodeBase64Url(value));
	const parsed: unknown = JSON.parse(decoded);
	if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw new Error('Invalid JWT JSON.');
	return parsed as Record<string, unknown>;
}

export async function verifyAccessJwt(
	token: string,
	expectedAudience: string,
	teamDomain: string,
	fetcher: typeof fetch = fetch,
	nowSeconds: number = Math.floor(Date.now() / 1000),
): Promise<{ email: string } | null> {
	try {
		const [headerText, payloadText, signatureText, extra] = token.split('.');
		if (!headerText || !payloadText || !signatureText || extra !== undefined) return null;
		const header = decodeJwtJson(headerText);
		const claims = decodeJwtJson(payloadText);
		if (header.alg !== 'RS256' || typeof header.kid !== 'string') return null;

		const normalizedTeamDomain = teamDomain
			.trim()
			.toLowerCase()
			.replace(/^https:\/\//, '')
			.replace(/\/$/, '');
		const expectedIssuer = `https://${normalizedTeamDomain}`;
		const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
		if (
			!normalizedTeamDomain.endsWith('.cloudflareaccess.com') ||
			!audience.includes(expectedAudience) ||
			claims.iss !== expectedIssuer ||
			claims.type !== 'app' ||
			typeof claims.exp !== 'number' ||
			claims.exp <= nowSeconds ||
			(typeof claims.nbf === 'number' && claims.nbf > nowSeconds) ||
			typeof claims.email !== 'string' ||
			claims.email.trim().length === 0
		) {
			return null;
		}

		const certsResponse = await fetcher(`${expectedIssuer}/cdn-cgi/access/certs`, { headers: { accept: 'application/json' } });
		if (!certsResponse.ok) return null;
		const certs: unknown = await certsResponse.json();
		if (typeof certs !== 'object' || certs === null || !('keys' in certs) || !Array.isArray(certs.keys)) return null;
		const jwk = certs.keys.find(
			(candidate): candidate is JsonWebKey & { kid: string } =>
				typeof candidate === 'object' &&
				candidate !== null &&
				'kid' in candidate &&
				candidate.kid === header.kid &&
				'kty' in candidate &&
				candidate.kty === 'RSA',
		);
		if (!jwk) return null;
		const publicKey = await crypto.subtle.importKey('jwk', jwk, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
		const verified = await crypto.subtle.verify(
			'RSASSA-PKCS1-v1_5',
			publicKey,
			decodeBase64Url(signatureText),
			new TextEncoder().encode(`${headerText}.${payloadText}`),
		);
		return verified ? { email: claims.email.trim().toLowerCase() } : null;
	} catch {
		return null;
	}
}

async function accessEmail(request: Request, env: Env): Promise<string | null> {
	if (env.ACCESS_TEST_MODE === 'true') {
		const testEmail = request.headers.get('cf-access-test-email')?.trim().toLowerCase();
		return testEmail || null;
	}
	const assertion = request.headers.get('cf-access-jwt-assertion');
	if (!assertion || !env.ACCESS_AUD || !env.ACCESS_TEAM_DOMAIN) return null;
	const identity = await verifyAccessJwt(assertion, env.ACCESS_AUD, env.ACCESS_TEAM_DOMAIN);
	return identity?.email ?? null;
}

async function authenticatedUser(request: Request, env: Env): Promise<SessionUser | null> {
	const email = await accessEmail(request, env);
	if (!email) return null;
	return env.DB.prepare(
		`SELECT id, role, display_name
		 FROM users
		 WHERE active = 1 AND lower(email) = ?`,
	)
		.bind(email)
		.first<SessionUser>();
}

async function sessionState(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	return user ? json({ authenticated: true, user: { displayName: user.display_name, role: user.role } }) : json({ authenticated: false });
}

function parentOnly(user: SessionUser | null): Response | null {
	if (!user) return json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);
	if (user.role !== 'parent') return json({ error: 'forbidden', message: 'This action is available only to a parent.' }, 403);
	return null;
}

async function listStudents(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = parentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const result = await env.DB.prepare(
		`SELECT users.id,
		        users.display_name AS displayName,
		        student_profiles.class_level AS classLevel,
		        student_profiles.board,
		        student_profiles.exam_year AS examYear
		 FROM parent_students
		 JOIN users ON users.id = parent_students.student_id
		 JOIN student_profiles ON student_profiles.user_id = users.id
		 WHERE parent_students.parent_id = ? AND users.active = 1
		 ORDER BY lower(users.display_name), users.id`,
	)
		.bind(user.id)
		.all<StudentSummary>();
	return json({ students: result.results });
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

		if (pathname === '/api/students' && request.method === 'GET') {
			return listStudents(request, env);
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
