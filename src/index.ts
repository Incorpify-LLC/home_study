interface Env {
	ASSETS: Fetcher;
	DB: D1Database;
	ROUGH_WORK: R2Bucket;
}

const jsonHeaders = {
	'cache-control': 'no-store',
	'content-type': 'application/json; charset=utf-8',
};

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
