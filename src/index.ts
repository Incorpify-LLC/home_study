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

type LearningTemplate = {
	templateId: string;
	classLevel: string;
	subject: string;
	title: string;
	instructions: string;
	estimatedMinutes: number;
	moduleTitle: string;
	overview: string;
	keyPointsJson: string;
	workedExampleJson: string;
	practiceAdvice: string;
};

type AssignmentRecord = {
	id: string;
	status: string;
	templateId: string;
	classLevel: string;
	subject: string;
	title: string;
	instructions: string;
	estimatedMinutes: number;
	moduleTitle: string;
	overview: string;
	keyPointsJson: string;
	workedExampleJson: string;
	practiceAdvice: string;
};

type QuestionRecord = {
	id: string;
	type: string;
	prompt: string;
	optionsJson: string | null;
	requiresRoughWork: number;
	position: number;
	responseJson: string | null;
	confidence: number | null;
};

type SubmissionQuestion = {
	id: string;
	type: string;
	answerJson: string;
	responseJson: string;
	confidence: number | null;
	elapsedSeconds: number | null;
	topicId: string;
};

type CorrectionRecord = {
	id: string;
	prompt: string;
	topic: string;
	answerJson: string;
	correctAnswerJson: string;
	rationale: string;
	score: number;
	confidence: number | null;
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

function studentOnly(user: SessionUser | null): Response | null {
	if (!user) return json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);
	if (user.role !== 'student') return json({ error: 'forbidden', message: 'This action is available only to a student.' }, 403);
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

function parseStoredJson<T>(value: string): T {
	return JSON.parse(value) as T;
}

async function reviewedTemplateForStudent(env: Env, studentId: string): Promise<LearningTemplate | null> {
	return env.DB.prepare(
		`SELECT assignment_templates.id AS templateId,
		        assignment_templates.class_level AS classLevel,
		        assignment_templates.subject,
		        assignment_templates.title,
		        assignment_templates.instructions,
		        assignment_templates.estimated_minutes AS estimatedMinutes,
		        learning_modules.title AS moduleTitle,
		        learning_modules.overview,
		        learning_modules.key_points_json AS keyPointsJson,
		        learning_modules.worked_example_json AS workedExampleJson,
		        learning_modules.practice_advice AS practiceAdvice
		 FROM student_profiles
		 JOIN assignment_templates ON assignment_templates.class_level = student_profiles.class_level
		 JOIN learning_modules ON learning_modules.id = assignment_templates.module_id
		 JOIN curriculum_topics ON curriculum_topics.id = learning_modules.topic_id
		 WHERE student_profiles.user_id = ?
		   AND assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'
		 ORDER BY assignment_templates.subject, assignment_templates.id
		 LIMIT 1`,
	)
		.bind(studentId)
		.first<LearningTemplate>();
}

async function assignmentRecord(env: Env, studentId: string, assignmentId: string): Promise<AssignmentRecord | null> {
	return env.DB.prepare(
		`SELECT assignments.id,
		        assignments.status,
		        assignment_templates.id AS templateId,
		        assignment_templates.class_level AS classLevel,
		        assignment_templates.subject,
		        assignment_templates.title,
		        assignment_templates.instructions,
		        assignment_templates.estimated_minutes AS estimatedMinutes,
		        learning_modules.title AS moduleTitle,
		        learning_modules.overview,
		        learning_modules.key_points_json AS keyPointsJson,
		        learning_modules.worked_example_json AS workedExampleJson,
		        learning_modules.practice_advice AS practiceAdvice
		 FROM assignments
		 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
		 JOIN learning_modules ON learning_modules.id = assignment_templates.module_id
		 JOIN curriculum_topics ON curriculum_topics.id = learning_modules.topic_id
		 WHERE assignments.id = ?
		   AND assignments.student_id = ?
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'`,
	)
		.bind(assignmentId, studentId)
		.first<AssignmentRecord>();
}

async function assignmentQuestions(env: Env, assignmentId: string): Promise<QuestionRecord[]> {
	const result = await env.DB.prepare(
		`SELECT questions.id,
		        questions.question_type AS type,
		        questions.prompt,
		        questions.options_json AS optionsJson,
		        questions.requires_rough_work AS requiresRoughWork,
		        assignment_items.position,
		        assignment_responses.answer_json AS responseJson,
		        assignment_responses.confidence
		 FROM assignment_items
		 JOIN questions ON questions.id = assignment_items.question_id
		 LEFT JOIN assignment_responses
		   ON assignment_responses.assignment_id = assignment_items.assignment_id
		  AND assignment_responses.question_id = assignment_items.question_id
		 WHERE assignment_items.assignment_id = ?
		   AND questions.review_status = 'reviewed'
		 ORDER BY assignment_items.position`,
	)
		.bind(assignmentId)
		.all<QuestionRecord>();
	return result.results;
}

async function resultForAssignment(env: Env, assignmentId: string): Promise<Record<string, unknown>> {
	const result = await env.DB.prepare(
		`SELECT questions.id,
		        questions.prompt,
		        curriculum_topics.topic,
		        attempts.answer_json AS answerJson,
		        questions.answer_json AS correctAnswerJson,
		        questions.rationale,
		        COALESCE(attempts.final_score, attempts.objective_score, 0) AS score,
		        attempts.confidence
		 FROM assignment_items
		 JOIN questions ON questions.id = assignment_items.question_id
		 JOIN curriculum_topics ON curriculum_topics.id = questions.topic_id
		 JOIN attempts
		   ON attempts.assignment_id = assignment_items.assignment_id
		  AND attempts.question_id = assignment_items.question_id
		 WHERE assignment_items.assignment_id = ?
		 ORDER BY assignment_items.position`,
	)
		.bind(assignmentId)
		.all<CorrectionRecord>();
	const corrections = result.results.map((row) => ({
		questionId: row.id,
		prompt: row.prompt,
		topic: row.topic,
		answer: parseStoredJson<unknown>(row.answerJson),
		correctAnswer: parseStoredJson<unknown>(row.correctAnswerJson),
		rationale: row.rationale,
		score: row.score,
		confidence: row.confidence,
	}));
	const earned = corrections.reduce((sum, correction) => sum + correction.score, 0);
	const possible = corrections.length;
	return {
		earned,
		possible,
		percentage: possible === 0 ? 0 : Math.round((earned / possible) * 100),
		corrections,
	};
}

async function assignmentPayload(env: Env, assignment: AssignmentRecord): Promise<Record<string, unknown>> {
	const questions = await assignmentQuestions(env, assignment.id);
	const payload: Record<string, unknown> = {
		id: assignment.id,
		classLevel: assignment.classLevel,
		subject: assignment.subject,
		title: assignment.title,
		instructions: assignment.instructions,
		estimatedMinutes: assignment.estimatedMinutes,
		status: assignment.status,
		lesson: {
			title: assignment.moduleTitle,
			overview: assignment.overview,
			keyPoints: parseStoredJson<string[]>(assignment.keyPointsJson),
			workedExample: parseStoredJson<Record<string, unknown>>(assignment.workedExampleJson),
			practiceAdvice: assignment.practiceAdvice,
		},
		questions: questions.map((question) => ({
			id: question.id,
			type: question.type,
			prompt: question.prompt,
			options: question.optionsJson ? parseStoredJson<unknown>(question.optionsJson) : null,
			requiresRoughWork: question.requiresRoughWork === 1,
			position: question.position,
			...(question.responseJson
				? {
						response: {
							answer: parseStoredJson<unknown>(question.responseJson),
							confidence: question.confidence,
						},
					}
				: {}),
		})),
	};
	if (assignment.status === 'submitted' || assignment.status === 'reviewed') {
		payload.result = await resultForAssignment(env, assignment.id);
	}
	return payload;
}

async function currentLearning(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const template = await reviewedTemplateForStudent(env, user.id);
	if (!template) return json({ error: 'not_found', message: 'No reviewed learning assignment is available for this class yet.' }, 404);

	const assignmentId = crypto.randomUUID();
	const assignedFor = new Date().toISOString().slice(0, 10);
	await env.DB.prepare(
		`INSERT OR IGNORE INTO assignments
		   (id, student_id, assigned_for, status, estimated_minutes, template_id)
		 VALUES (?, ?, ?, 'assigned', ?, ?)`,
	)
		.bind(assignmentId, user.id, assignedFor, template.estimatedMinutes, template.templateId)
		.run();

	const existing = await env.DB.prepare(`SELECT id FROM assignments WHERE student_id = ? AND template_id = ?`)
		.bind(user.id, template.templateId)
		.first<{ id: string }>();
	if (!existing) return json({ error: 'internal_error', message: 'The assignment could not be prepared.' }, 500);

	await env.DB.prepare(
		`INSERT OR IGNORE INTO assignment_items (assignment_id, question_id, position)
		 SELECT ?, question_id, position
		 FROM assignment_template_items
		 WHERE template_id = ?`,
	)
		.bind(existing.id, template.templateId)
		.run();

	const assignment = await assignmentRecord(env, user.id, existing.id);
	if (!assignment) return json({ error: 'internal_error', message: 'The assignment could not be loaded.' }, 500);
	return json({ assignment: await assignmentPayload(env, assignment) });
}

function isObject(value: unknown): value is Record<string, unknown> {
	return typeof value === 'object' && value !== null && !Array.isArray(value);
}

async function requestObject(request: Request): Promise<Record<string, unknown> | null> {
	try {
		const value: unknown = await request.json();
		return isObject(value) ? value : null;
	} catch {
		return null;
	}
}

function validAnswer(type: string, answer: unknown, optionsJson: string | null): answer is Record<string, unknown> {
	if (!isObject(answer)) return false;
	if (type === 'numeric') return typeof answer.value === 'number' && Number.isFinite(answer.value);
	if (type === 'single_choice') {
		if (typeof answer.choice !== 'string') return false;
		const options = optionsJson ? parseStoredJson<Array<{ id: string }>>(optionsJson) : [];
		return options.some((option) => option.id === answer.choice);
	}
	return false;
}

async function saveResponse(request: Request, env: Env, assignmentId: string): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const assignment = await env.DB.prepare(`SELECT id, status FROM assignments WHERE id = ? AND student_id = ?`)
		.bind(assignmentId, user.id)
		.first<{ id: string; status: string }>();
	if (!assignment) return json({ error: 'not_found', message: 'Assignment not found.' }, 404);
	if (assignment.status === 'submitted' || assignment.status === 'reviewed') {
		return json({ error: 'already_submitted', message: 'Submitted work cannot be changed.' }, 409);
	}

	const body = await requestObject(request);
	if (!body || typeof body.questionId !== 'string') {
		return json({ error: 'invalid_request', message: 'A question id and answer are required.' }, 400);
	}
	const question = await env.DB.prepare(
		`SELECT questions.question_type AS type, questions.options_json AS optionsJson
		 FROM assignment_items
		 JOIN questions ON questions.id = assignment_items.question_id
		 WHERE assignment_items.assignment_id = ?
		   AND questions.id = ?
		   AND questions.review_status = 'reviewed'`,
	)
		.bind(assignmentId, body.questionId)
		.first<{ type: string; optionsJson: string | null }>();
	if (!question) return json({ error: 'not_found', message: 'Question not found in this assignment.' }, 404);
	if (!validAnswer(question.type, body.answer, question.optionsJson)) {
		return json({ error: 'invalid_answer', message: 'The answer format is not valid for this question.' }, 400);
	}
	const confidence = body.confidence;
	if (confidence !== undefined && (!Number.isInteger(confidence) || (confidence as number) < 1 || (confidence as number) > 5)) {
		return json({ error: 'invalid_confidence', message: 'Confidence must be a whole number from 1 to 5.' }, 400);
	}
	const elapsedSeconds = body.elapsedSeconds;
	if (elapsedSeconds !== undefined && (!Number.isInteger(elapsedSeconds) || (elapsedSeconds as number) < 0)) {
		return json({ error: 'invalid_elapsed_time', message: 'Elapsed time must be a non-negative whole number.' }, 400);
	}

	await env.DB.batch([
		env.DB.prepare(
			`INSERT INTO assignment_responses
			   (assignment_id, question_id, answer_json, confidence, elapsed_seconds, updated_at)
			 VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
			 ON CONFLICT (assignment_id, question_id) DO UPDATE SET
			   answer_json = excluded.answer_json,
			   confidence = excluded.confidence,
			   elapsed_seconds = excluded.elapsed_seconds,
			   updated_at = CURRENT_TIMESTAMP`,
		).bind(assignmentId, body.questionId, JSON.stringify(body.answer), confidence ?? null, elapsedSeconds ?? null),
		env.DB.prepare(
			`UPDATE assignments
			 SET status = 'in_progress', started_at = COALESCE(started_at, CURRENT_TIMESTAMP)
			 WHERE id = ? AND student_id = ? AND status IN ('assigned', 'in_progress')`,
		).bind(assignmentId, user.id),
	]);
	return json({ saved: true });
}

function scoreAnswer(type: string, expectedJson: string, actualJson: string): number {
	const expected = parseStoredJson<Record<string, unknown>>(expectedJson);
	const actual = parseStoredJson<Record<string, unknown>>(actualJson);
	if (type === 'single_choice') return expected.choice === actual.choice ? 1 : 0;
	if (type === 'numeric' && typeof expected.value === 'number' && typeof actual.value === 'number') {
		const tolerance = typeof expected.tolerance === 'number' ? expected.tolerance : 0;
		return Math.abs(expected.value - actual.value) <= tolerance ? 1 : 0;
	}
	return 0;
}

async function submitAssignment(request: Request, env: Env, assignmentId: string): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const assignment = await assignmentRecord(env, user.id, assignmentId);
	if (!assignment) return json({ error: 'not_found', message: 'Assignment not found.' }, 404);
	if (assignment.status === 'submitted' || assignment.status === 'reviewed') {
		return json({ result: await resultForAssignment(env, assignment.id) });
	}

	const questions = await env.DB.prepare(
		`SELECT questions.id,
		        questions.question_type AS type,
		        questions.answer_json AS answerJson,
		        assignment_responses.answer_json AS responseJson,
		        assignment_responses.confidence,
		        assignment_responses.elapsed_seconds AS elapsedSeconds,
		        questions.topic_id AS topicId
		 FROM assignment_items
		 JOIN questions ON questions.id = assignment_items.question_id
		 LEFT JOIN assignment_responses
		   ON assignment_responses.assignment_id = assignment_items.assignment_id
		  AND assignment_responses.question_id = assignment_items.question_id
		 WHERE assignment_items.assignment_id = ?
		   AND questions.review_status = 'reviewed'
		 ORDER BY assignment_items.position`,
	)
		.bind(assignment.id)
		.all<SubmissionQuestion>();
	if (questions.results.length === 0 || questions.results.some((question) => question.responseJson === null)) {
		return json({ error: 'incomplete_assignment', message: 'Answer every question before submitting.' }, 409);
	}

	const attempted = questions.results.map((question) => ({
		...question,
		attemptId: crypto.randomUUID(),
		score: scoreAnswer(question.type, question.answerJson, question.responseJson),
	}));
	const statements = attempted.map((question) =>
		env.DB.prepare(
			`INSERT INTO attempts
			   (id, assignment_id, question_id, answer_json, objective_score, final_score, confidence, elapsed_seconds)
			 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		).bind(
			question.attemptId,
			assignment.id,
			question.id,
			question.responseJson,
			question.score,
			question.score,
			question.confidence,
			question.elapsedSeconds,
		),
	);
	const earned = attempted.reduce((sum, question) => sum + question.score, 0);
	const masteryState = earned / attempted.length >= 0.8 ? 'practised' : earned / attempted.length >= 0.5 ? 'developing' : 'needs_review';
	statements.push(
		env.DB.prepare(
			`UPDATE assignments
			 SET status = 'submitted', submitted_at = CURRENT_TIMESTAMP
			 WHERE id = ? AND student_id = ? AND status IN ('assigned', 'in_progress')`,
		).bind(assignment.id, user.id),
		env.DB.prepare(
			`INSERT INTO mastery_events (id, student_id, topic_id, state, evidence_attempt_id)
			 VALUES (?, ?, ?, ?, ?)`,
		).bind(crypto.randomUUID(), user.id, attempted[0].topicId, masteryState, attempted[0].attemptId),
	);
	await env.DB.batch(statements);
	return json({ result: await resultForAssignment(env, assignment.id) });
}

async function studentProgress(request: Request, env: Env, studentId: string): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = parentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const student = await env.DB.prepare(
		`SELECT users.id, users.display_name AS displayName
		 FROM parent_students
		 JOIN users ON users.id = parent_students.student_id
		 WHERE parent_students.parent_id = ?
		   AND parent_students.student_id = ?
		   AND users.active = 1`,
	)
		.bind(user.id, studentId)
		.first<{ id: string; displayName: string }>();
	if (!student) return json({ error: 'not_found', message: 'Learner not found.' }, 404);

	const assignments = await env.DB.prepare(
		`SELECT assignments.id,
		        assignments.status,
		        assignments.assigned_for AS assignedFor,
		        assignments.submitted_at AS submittedAt,
		        assignment_templates.title,
		        assignment_templates.subject,
		        COUNT(attempts.id) AS possible,
		        COALESCE(SUM(COALESCE(attempts.final_score, attempts.objective_score, 0)), 0) AS earned
		 FROM assignments
		 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
		 LEFT JOIN attempts ON attempts.assignment_id = assignments.id
		 WHERE assignments.student_id = ?
		 GROUP BY assignments.id, assignment_templates.id
		 ORDER BY assignments.created_at DESC`,
	)
		.bind(studentId)
		.all<{
			id: string;
			status: string;
			assignedFor: string;
			submittedAt: string | null;
			title: string;
			subject: string;
			possible: number;
			earned: number;
		}>();

	const payload = await Promise.all(
		assignments.results.map(async (assignment) => {
			const evidence =
				assignment.status === 'submitted' || assignment.status === 'reviewed'
					? ((await resultForAssignment(env, assignment.id)).corrections as unknown[])
					: [];
			return {
				...assignment,
				percentage: assignment.possible === 0 ? null : Math.round((assignment.earned / assignment.possible) * 100),
				evidence,
			};
		}),
	);
	return json({ student, assignments: payload });
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

		if (pathname === '/api/learning/current' && request.method === 'GET') {
			return currentLearning(request, env);
		}

		const responseMatch = pathname.match(/^\/api\/learning\/assignments\/([A-Za-z0-9-]+)\/responses$/);
		if (responseMatch && request.method === 'PUT') {
			return saveResponse(request, env, responseMatch[1]);
		}

		const submitMatch = pathname.match(/^\/api\/learning\/assignments\/([A-Za-z0-9-]+)\/submit$/);
		if (submitMatch && request.method === 'POST') {
			return submitAssignment(request, env, submitMatch[1]);
		}

		const progressMatch = pathname.match(/^\/api\/students\/([A-Za-z0-9-]+)\/progress$/);
		if (progressMatch && request.method === 'GET') {
			return studentProgress(request, env, progressMatch[1]);
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
