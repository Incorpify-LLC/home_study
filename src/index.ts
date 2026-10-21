import {
	ensureFreshPlan,
	exerciseForParent,
	istToday,
	reschedulePlan,
	saveSettings,
	todaysTemplateIds,
	validateSettings,
	type PlanEnv,
} from './plan';
import { demoState, switchDemoClass, resetDemoProgress } from './demo';
import {
	checkThrottle,
	clearFailures,
	clearedSessionCookie,
	createSession,
	hashEnrolmentCode,
	hashPassword,
	recordFailure,
	revokeSession,
	userFromCookieSession,
	verifyPassword,
} from './demo-auth';

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
	is_demo: number;
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
	sequence: number;
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
	sequence: number;
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
	if (email) {
		return env.DB.prepare(
			`SELECT id, role, display_name, is_demo
			 FROM users
			 WHERE active = 1 AND lower(email) = ?`,
		)
			.bind(email)
			.first<SessionUser>();
	}
	// No Access identity: fall back to a demo-account cookie session. Cookie sign-in
	// is only ever issued to, and honoured for, `is_demo = 1` accounts.
	return userFromCookieSession(env, request) as Promise<SessionUser | null>;
}

async function sessionState(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	return user
		? json({
				authenticated: true,
				user: { displayName: user.display_name, role: user.role, demo: user.is_demo === 1 },
			})
		: json({ authenticated: false });
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

async function reviewedTemplateForStudent(
	env: Env,
	studentId: string,
	afterSequence = 0,
	subject?: string | null,
): Promise<LearningTemplate | null> {
	return env.DB.prepare(
		`SELECT assignment_templates.id AS templateId,
		        assignment_templates.sequence,
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
		 LEFT JOIN assignments
		   ON assignments.template_id = assignment_templates.id
		  AND assignments.student_id = student_profiles.user_id
		 WHERE student_profiles.user_id = ?
		   AND assignments.id IS NULL
		   AND assignment_templates.sequence > ?
		   AND assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'
		   AND (? IS NULL OR assignment_templates.subject = ?)
		   AND (curriculum_topics.board IS NULL OR lower(curriculum_topics.board) = lower(student_profiles.board))
		   AND (curriculum_topics.exam_year IS NULL OR curriculum_topics.exam_year = student_profiles.exam_year)
		 ORDER BY assignment_templates.sequence
		 LIMIT 1`,
	)
		.bind(studentId, afterSequence, subject ?? null, subject ?? null)
		.first<LearningTemplate>();
}

async function templateForStudent(env: Env, studentId: string, templateId: string): Promise<LearningTemplate | null> {
	return env.DB.prepare(
		`SELECT assignment_templates.id AS templateId,
		        assignment_templates.sequence,
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
		   AND assignment_templates.id = ?
		   AND assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'
		   AND (curriculum_topics.board IS NULL OR lower(curriculum_topics.board) = lower(student_profiles.board))
		   AND (curriculum_topics.exam_year IS NULL OR curriculum_topics.exam_year = student_profiles.exam_year)`,
	)
		.bind(studentId, templateId)
		.first<LearningTemplate>();
}

async function availableSubjects(env: Env, studentId: string): Promise<string[]> {
	const result = await env.DB.prepare(
		`SELECT DISTINCT assignment_templates.subject
		 FROM student_profiles
		 JOIN assignment_templates ON assignment_templates.class_level = student_profiles.class_level
		 JOIN learning_modules ON learning_modules.id = assignment_templates.module_id
		 JOIN curriculum_topics ON curriculum_topics.id = learning_modules.topic_id
		 WHERE student_profiles.user_id = ?
		   AND assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'
		   AND (curriculum_topics.board IS NULL OR lower(curriculum_topics.board) = lower(student_profiles.board))
		   AND (curriculum_topics.exam_year IS NULL OR curriculum_topics.exam_year = student_profiles.exam_year)
		 ORDER BY assignment_templates.subject`,
	)
		.bind(studentId)
		.all<{ subject: string }>();
	return result.results.map((row) => row.subject);
}

async function resolveSubject(request: Request, env: Env, studentId: string): Promise<string | null> {
	const requested = new URL(request.url).searchParams.get('subject');
	if (requested) return requested;
	const subjects = await availableSubjects(env, studentId);
	if (subjects.length === 0) return null;
	// The published calendar is the default learning path. An off-schedule chapter
	// may already be open, but it must not displace work explicitly planned for today.
	const planned = await todaysTemplateIds(env as PlanEnv, studentId);
	const scheduled = planned.keys().next().value;
	if (scheduled) return scheduled;
	const open = await env.DB.prepare(
		`SELECT assignment_templates.subject
		 FROM assignments
		 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
		 WHERE assignments.student_id = ?
		   AND assignments.status IN ('assigned', 'in_progress')
		 ORDER BY assignment_templates.subject
		 LIMIT 1`,
	)
		.bind(studentId)
		.first<{ subject: string }>();
	return open?.subject ?? subjects[0];
}

async function assignmentRecord(env: Env, studentId: string, assignmentId: string): Promise<AssignmentRecord | null> {
	return env.DB.prepare(
		`SELECT assignments.id,
		        assignments.status,
		        assignment_templates.id AS templateId,
		        assignment_templates.sequence,
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
		 JOIN student_profiles ON student_profiles.user_id = assignments.student_id
		 WHERE assignments.id = ?
		   AND assignments.student_id = ?
		   AND assignment_templates.class_level = student_profiles.class_level
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
	const [questions, totalRow] = await Promise.all([
		assignmentQuestions(env, assignment.id),
		env.DB.prepare(
			`SELECT COUNT(*) AS total
			 FROM assignment_templates
			 WHERE class_level = ? AND subject = ? AND active = 1 AND review_status = 'reviewed'`,
		)
			.bind(assignment.classLevel, assignment.subject)
			.first<{ total: number }>(),
	]);
	const totalModules = totalRow?.total ?? 0;
	const payload: Record<string, unknown> = {
		id: assignment.id,
		sequence: assignment.sequence,
		totalModules,
		courseComplete: assignment.sequence === totalModules,
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

async function createAssignment(env: Env, studentId: string, template: LearningTemplate): Promise<AssignmentRecord | null> {
	const assignmentId = crypto.randomUUID();
	const assignedFor = new Date().toISOString().slice(0, 10);
	await env.DB.prepare(
		`INSERT OR IGNORE INTO assignments
		   (id, student_id, assigned_for, status, estimated_minutes, template_id)
		 VALUES (?, ?, ?, 'assigned', ?, ?)`,
	)
		.bind(assignmentId, studentId, assignedFor, template.estimatedMinutes, template.templateId)
		.run();

	const existing = await env.DB.prepare(`SELECT id FROM assignments WHERE student_id = ? AND template_id = ?`)
		.bind(studentId, template.templateId)
		.first<{ id: string }>();
	if (!existing) return null;

	await env.DB.prepare(
		`INSERT OR IGNORE INTO assignment_items (assignment_id, question_id, position)
		 SELECT ?, question_id, position
		 FROM assignment_template_items
		 WHERE template_id = ?`,
	)
		.bind(existing.id, template.templateId)
		.run();
	return assignmentRecord(env, studentId, existing.id);
}

async function latestAssignmentForStudent(env: Env, studentId: string, subject?: string | null): Promise<AssignmentRecord | null> {
	// Scoped to the learner's current class: after a class change, an open assignment
	// from the previous class must never be served as the current chapter.
	const row = await env.DB.prepare(
		`SELECT assignments.id
		 FROM assignments
		 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
		 JOIN student_profiles ON student_profiles.user_id = assignments.student_id
		 WHERE assignments.student_id = ?
		   AND assignment_templates.class_level = student_profiles.class_level
		   AND (? IS NULL OR assignment_templates.subject = ?)
		 ORDER BY CASE WHEN assignments.status IN ('assigned', 'in_progress') THEN 0 ELSE 1 END,
		          assignment_templates.sequence DESC
		 LIMIT 1`,
	)
		.bind(studentId, subject ?? null, subject ?? null)
		.first<{ id: string }>();
	return row ? assignmentRecord(env, studentId, row.id) : null;
}

async function currentLearning(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const subject = await resolveSubject(request, env, user.id);
	if (!subject) return json({ error: 'not_found', message: 'No reviewed learning assignment is available for this class yet.' }, 404);
	// When the calendar names a chapter for today, serve that exact chapter. A
	// previous submission or an off-schedule open assignment must not displace it.
	const planned = await todaysTemplateIds(env as PlanEnv, user.id);
	const templateId = planned.get(subject);
	let assignment: AssignmentRecord | null = null;
	if (templateId) {
		const template = await templateForStudent(env, user.id, templateId);
		if (template) assignment = await createAssignment(env, user.id, template);
	}
	if (!assignment) assignment = await latestAssignmentForStudent(env, user.id, subject);
	if (!assignment) {
		const template = await reviewedTemplateForStudent(env, user.id, 0, subject);
		if (!template) return json({ error: 'not_found', message: 'No reviewed learning assignment is available for this subject yet.' }, 404);
		assignment = await createAssignment(env, user.id, template);
	}
	if (!assignment) return json({ error: 'internal_error', message: 'The assignment could not be prepared.' }, 500);
	return json({ assignment: await assignmentPayload(env, assignment) });
}

async function learningHistory(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const exercises = await env.DB.prepare(
		`SELECT assignments.id,
		        assignment_templates.title,
		        assignment_templates.subject,
		        assignment_templates.sequence,
		        assignments.submitted_at AS submittedAt,
		        COUNT(attempts.id) AS possible,
		        COALESCE(SUM(COALESCE(attempts.final_score, attempts.objective_score, 0)), 0) AS earned
		 FROM assignments
		 JOIN assignment_templates ON assignment_templates.id = assignments.template_id
		 JOIN student_profiles ON student_profiles.user_id = assignments.student_id
		 LEFT JOIN attempts ON attempts.assignment_id = assignments.id
		 WHERE assignments.student_id = ?
		   AND assignments.status IN ('submitted', 'reviewed')
		   AND assignment_templates.class_level = student_profiles.class_level
		 GROUP BY assignments.id, assignment_templates.id
		 ORDER BY assignments.submitted_at DESC, assignments.created_at DESC`,
	)
		.bind(user.id)
		.all<{
			id: string;
			title: string;
			subject: string;
			sequence: number;
			submittedAt: string;
			possible: number;
			earned: number;
		}>();

	return json({
		exercises: exercises.results.map((exercise) => ({
			...exercise,
			percentage: exercise.possible === 0 ? 0 : Math.round((exercise.earned / exercise.possible) * 100),
		})),
	});
}

async function learningHistoryDetail(request: Request, env: Env, assignmentId: string): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const assignment = await assignmentRecord(env, user.id, assignmentId);
	if (!assignment || (assignment.status !== 'submitted' && assignment.status !== 'reviewed')) {
		return json({ error: 'not_found', message: 'That completed exercise was not found.' }, 404);
	}
	return json({ assignment: await assignmentPayload(env, assignment) });
}

async function learningRoadmaps(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const result = await env.DB.prepare(
		`SELECT assignment_templates.sequence,
		        assignment_templates.subject,
		        assignment_templates.title,
		        assignments.id AS assignmentId,
		        COALESCE(assignments.status, 'not_started') AS status
		 FROM student_profiles
		 JOIN assignment_templates ON assignment_templates.class_level = student_profiles.class_level
		 JOIN learning_modules ON learning_modules.id = assignment_templates.module_id
		 JOIN curriculum_topics ON curriculum_topics.id = learning_modules.topic_id
		 LEFT JOIN assignments
		   ON assignments.template_id = assignment_templates.id
		  AND assignments.student_id = student_profiles.user_id
		 WHERE student_profiles.user_id = ?
		   AND assignment_templates.active = 1
		   AND assignment_templates.review_status = 'reviewed'
		   AND learning_modules.review_status = 'reviewed'
		   AND curriculum_topics.review_status = 'reviewed'
		   AND (curriculum_topics.board IS NULL OR lower(curriculum_topics.board) = lower(student_profiles.board))
		   AND (curriculum_topics.exam_year IS NULL OR curriculum_topics.exam_year = student_profiles.exam_year)
		 ORDER BY assignment_templates.subject, assignment_templates.sequence`,
	)
		.bind(user.id)
		.all<{
			sequence: number;
			subject: string;
			title: string;
			assignmentId: string | null;
			status: string;
		}>();
	if (result.results.length === 0) return json({ error: 'not_found', message: 'No reviewed learning roadmap is available.' }, 404);

	const grouped = new Map<string, typeof result.results>();
	for (const row of result.results) {
		const modules = grouped.get(row.subject) ?? [];
		modules.push(row);
		grouped.set(row.subject, modules);
	}
	const tracks = [...grouped.entries()].map(([subject, modules]) => {
		const completed = modules.filter((module) => module.status === 'submitted' || module.status === 'reviewed').length;
		const current = modules.find((module) => module.status === 'assigned' || module.status === 'in_progress');
		const firstPending = current ?? modules.find((module) => module.status === 'not_started');
		return {
			subject,
			total: modules.length,
			completed,
			current: firstPending ? { sequence: firstPending.sequence, title: firstPending.title } : null,
			modules: modules.map(({ sequence, title, status }) => ({ sequence, title, status })),
		};
	});
	return json({ tracks });
}

async function nextLearning(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const subject = await resolveSubject(request, env, user.id);
	if (!subject) return json({ error: 'not_found', message: 'Open the first chapter before continuing.' }, 404);
	const current = await latestAssignmentForStudent(env, user.id, subject);
	if (!current) return json({ error: 'not_found', message: 'Open the first chapter before continuing.' }, 404);
	if (current.status !== 'submitted' && current.status !== 'reviewed') {
		return json({ error: 'current_not_submitted', message: 'Submit the current chapter before opening the next one.' }, 409);
	}
	const template = await reviewedTemplateForStudent(env, user.id, current.sequence, subject);
	if (!template) return json({ error: 'course_complete', message: 'Every reviewed chapter in this course is complete.' }, 409);
	const assignment = await createAssignment(env, user.id, template);
	if (!assignment) return json({ error: 'internal_error', message: 'The next chapter could not be prepared.' }, 500);
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
	// Finishing a chapter changes the outstanding work, so the calendar is rebuilt
	// around what is left. A failure here must not lose the submission.
	let rescheduled = false;
	try {
		await reschedulePlan(env as PlanEnv, user.id, 'roll_forward');
		rescheduled = true;
	} catch (error) {
		console.error('study plan reschedule failed after submission', error);
	}
	return json({ result: await resultForAssignment(env, assignment.id), rescheduled });
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

async function linkedLearner(env: Env, parentId: string, learnerId: string): Promise<StudentSummary | null> {
	return env.DB.prepare(
		`SELECT users.id,
		        users.display_name AS displayName,
		        student_profiles.class_level AS classLevel,
		        student_profiles.board,
		        student_profiles.exam_year AS examYear
		 FROM parent_students
		 JOIN users ON users.id = parent_students.student_id
		 JOIN student_profiles ON student_profiles.user_id = users.id
		 WHERE parent_students.parent_id = ? AND parent_students.student_id = ? AND users.active = 1`,
	)
		.bind(parentId, learnerId)
		.first<StudentSummary>();
}

function planDenied(user: SessionUser | null): Response | null {
	const denied = parentOnly(user);
	if (denied) return denied;
	return null;
}

async function parentLearnerPlan(request: Request, env: Env, learnerId: string): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = planDenied(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const learner = await linkedLearner(env, user.id, learnerId);
	if (!learner) return json({ error: 'forbidden', message: 'This learner is not linked to your account.' }, 403);

	const view = await ensureFreshPlan(env as PlanEnv, learnerId);
	return json({ learner, ...view });
}

async function updateStudySettings(request: Request, env: Env, learnerId: string): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = planDenied(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const learner = await linkedLearner(env, user.id, learnerId);
	if (!learner) return json({ error: 'forbidden', message: 'This learner is not linked to your account.' }, 403);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_body', message: 'A JSON body is required.' }, 400);
	}
	const { settings, error } = validateSettings(body);
	if (!settings) return json({ error: 'invalid_settings', message: error ?? 'The study settings are not valid.' }, 400);

	await saveSettings(env as PlanEnv, learnerId, user.id, settings);
	const hadPlan = await env.DB.prepare(`SELECT 1 AS present FROM study_plans WHERE student_id = ? AND active = 1`)
		.bind(learnerId)
		.first<{ present: number }>();
	const view = await reschedulePlan(env as PlanEnv, learnerId, hadPlan ? 'hours_changed' : 'initial', settings);
	return json({ learner, ...view });
}

async function rescheduleParentPlan(request: Request, env: Env, learnerId: string): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = planDenied(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const learner = await linkedLearner(env, user.id, learnerId);
	if (!learner) return json({ error: 'forbidden', message: 'This learner is not linked to your account.' }, 403);

	const view = await reschedulePlan(env as PlanEnv, learnerId, 'manual');
	return json({ learner, ...view });
}

async function parentExercises(request: Request, env: Env, learnerId: string): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = planDenied(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const learner = await linkedLearner(env, user.id, learnerId);
	if (!learner) return json({ error: 'forbidden', message: 'This learner is not linked to your account.' }, 403);

	const url = new URL(request.url);
	const subject = url.searchParams.get('subject');
	const sequence = Number(url.searchParams.get('sequence'));
	if (!subject || !Number.isInteger(sequence) || sequence < 1) {
		return json({ error: 'invalid_request', message: 'A subject and a chapter number are required.' }, 400);
	}

	const exercise = await exerciseForParent(env as PlanEnv, learnerId, subject, sequence);
	if (!exercise) return json({ error: 'not_found', message: 'No reviewed exercise matches that subject and chapter.' }, 404);
	return json({ learner, exercise });
}

async function learnerPlan(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = studentOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	const view = (await ensureFreshPlan(env as PlanEnv, user.id)) as Awaited<ReturnType<typeof ensureFreshPlan>>;
	const today = istToday();
	const day = view.plan.days.find((candidate) => candidate.date === today);
	return json({
		plan: {
			revision: view.plan.revision,
			startDate: view.plan.startDate,
			endDate: view.plan.endDate,
			days: view.plan.days,
		},
		today: day ?? { date: today, capacityMinutes: 0, allocatedMinutes: 0, entries: [] },
	});
}

function demoOnly(user: SessionUser | null): Response | null {
	if (!user) return json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);
	if (user.is_demo !== 1) {
		return json({ error: 'forbidden', message: 'This action is available only to the evaluation demo learner.' }, 403);
	}
	return null;
}

async function demoClassesRoute(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = demoOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);
	return json(await demoState(env as PlanEnv, user.id));
}

async function demoSwitchClass(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = demoOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);

	let body: unknown;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'invalid_body', message: 'A JSON body is required.' }, 400);
	}
	const payload = typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : {};
	const classLevel = payload.classLevel;
	if (typeof classLevel !== 'string' || classLevel.trim().length === 0) {
		return json({ error: 'invalid_request', message: 'A class level is required.' }, 400);
	}
	// Progress is kept by default; startFresh clears the target class first.
	const startFresh = payload.startFresh === true;
	try {
		return json(await switchDemoClass(env as PlanEnv, user.id, classLevel.trim().toUpperCase(), { startFresh }));
	} catch {
		return json({ error: 'unknown_class', message: 'That class has no reviewed content yet.' }, 400);
	}
}

async function demoReset(request: Request, env: Env): Promise<Response> {
	const user = await authenticatedUser(request, env);
	const denied = demoOnly(user);
	if (denied || !user)
		return denied ?? json({ error: 'not_authenticated', message: 'A valid Cloudflare Access session is required.' }, 401);
	return json(await resetDemoProgress(env as PlanEnv, user.id));
}

type DemoCredentialUser = {
	id: string;
	role: 'parent' | 'student' | 'reviewer';
	display_name: string;
	password_hash: string | null;
};

async function demoCredentialUser(env: Env, identifier: string): Promise<DemoCredentialUser | null> {
	return env.DB.prepare(
		`SELECT id, role, display_name, password_hash
		 FROM users
		 WHERE active = 1 AND is_demo = 1 AND lower(login_identifier) = ?`,
	)
		.bind(identifier)
		.first<DemoCredentialUser>();
}

async function readJsonBody(request: Request): Promise<Record<string, unknown> | null> {
	try {
		const parsed: unknown = await request.json();
		if (typeof parsed !== 'object' || parsed === null) return null;
		return parsed as Record<string, unknown>;
	} catch {
		return null;
	}
}

function textField(body: Record<string, unknown>, key: string): string {
	const value = body[key];
	return typeof value === 'string' ? value.trim() : '';
}

/**
 * One-time enrolment: sets the demo password, and only while the account has no
 * password yet. The code is single use, so nobody can claim an unenrolled demo
 * account by arriving first.
 */
async function demoEnrol(request: Request, env: Env): Promise<Response> {
	const body = await readJsonBody(request);
	if (!body) return json({ error: 'invalid_body', message: 'A JSON body is required.' }, 400);
	const identifier = textField(body, 'identifier').toLowerCase();
	const enrolmentCode = textField(body, 'code');
	const password = typeof body.password === 'string' ? body.password : '';
	if (!identifier || !enrolmentCode || !password) {
		return json({ error: 'invalid_request', message: 'An identifier, one-time code and password are required.' }, 400);
	}

	const user = await demoCredentialUser(env, identifier);
	if (!user || user.password_hash) {
		// Already enrolled, or not a demo account: the same answer either way.
		return json({ error: 'enrolment_closed', message: 'This account cannot be enrolled.' }, 403);
	}

	const record = await env.DB.prepare(
		`SELECT id, code_hash FROM demo_enrolment WHERE lower(identifier) = ? AND used_at IS NULL ORDER BY created_at DESC LIMIT 1`,
	)
		.bind(identifier)
		.first<{ id: string; code_hash: string }>();
	const submitted = await hashEnrolmentCode(enrolmentCode);
	if (!record || record.code_hash !== submitted) {
		return json({ error: 'invalid_code', message: 'The one-time code was not accepted.' }, 403);
	}

	await env.DB.batch([
		env.DB.prepare(`UPDATE users SET password_hash = ? WHERE id = ?`).bind(await hashPassword(password), user.id),
		env.DB.prepare(`UPDATE demo_enrolment SET used_at = ? WHERE id = ?`).bind(new Date().toISOString(), record.id),
	]);
	return json({ enrolled: true });
}

async function demoLogin(request: Request, env: Env): Promise<Response> {
	const body = await readJsonBody(request);
	if (!body) return json({ error: 'invalid_body', message: 'A JSON body is required.' }, 400);
	const identifier = textField(body, 'identifier').toLowerCase();
	const supplied = typeof body.password === 'string' ? body.password : '';
	if (!identifier || !supplied) {
		return json({ error: 'invalid_request', message: 'An identifier and password are required.' }, 400);
	}

	const scope = `demo-login:${identifier}`;
	const throttle = await checkThrottle(env, scope);
	if (throttle.limited) {
		return new Response(
			JSON.stringify({
				error: 'too_many_attempts',
				message: `Too many failed attempts. Try again in ${Math.ceil(throttle.retryAfterSeconds / 60)} minute(s).`,
			}),
			{ status: 429, headers: { ...jsonHeaders, 'retry-after': String(throttle.retryAfterSeconds) } },
		);
	}

	const user = await demoCredentialUser(env, identifier);
	if (!user) {
		await verifyPassword(supplied, null);
		await recordFailure(env, scope);
		return json({ error: 'invalid_credentials', message: 'Those sign-in details were not accepted.' }, 401);
	}
	if (!user.password_hash) {
		await verifyPassword(supplied, null);
		return json({ error: 'enrolment_required', message: 'This demo account has no password yet. Use its one-time enrolment link.' }, 403);
	}

	const accepted = await verifyPassword(supplied, user.password_hash);
	if (!accepted) {
		await recordFailure(env, scope);
		return json({ error: 'invalid_credentials', message: 'Those sign-in details were not accepted.' }, 401);
	}

	await clearFailures(env, scope);
	const cookie = await createSession(env, user.id);
	return new Response(JSON.stringify({ signedIn: true, user: { displayName: user.display_name, role: user.role, demo: true } }), {
		status: 200,
		headers: { ...jsonHeaders, 'set-cookie': cookie },
	});
}

async function demoLogout(request: Request, env: Env): Promise<Response> {
	await revokeSession(env, request);
	return new Response(null, {
		status: 204,
		headers: { 'cache-control': 'no-store', 'set-cookie': clearedSessionCookie() },
	});
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

		if (pathname === '/api/auth/demo-login' && request.method === 'POST') {
			return demoLogin(request, env);
		}

		if (pathname === '/api/auth/demo-enrol' && request.method === 'POST') {
			return demoEnrol(request, env);
		}

		if (pathname === '/api/auth/logout' && request.method === 'POST') {
			return demoLogout(request, env);
		}

		if (pathname === '/api/students' && request.method === 'GET') {
			return listStudents(request, env);
		}

		if (pathname === '/api/learning/current' && request.method === 'GET') {
			return currentLearning(request, env);
		}

		if (pathname === '/api/learning/history' && request.method === 'GET') {
			return learningHistory(request, env);
		}

		if (pathname === '/api/learning/roadmaps' && request.method === 'GET') {
			return learningRoadmaps(request, env);
		}

		if (pathname === '/api/learning/next' && request.method === 'POST') {
			return nextLearning(request, env);
		}

		if (pathname === '/api/learning/plan' && request.method === 'GET') {
			return learnerPlan(request, env);
		}

		if (pathname === '/api/demo/classes' && request.method === 'GET') {
			return demoClassesRoute(request, env);
		}

		if (pathname === '/api/demo/class' && request.method === 'POST') {
			return demoSwitchClass(request, env);
		}

		if (pathname === '/api/demo/reset' && request.method === 'POST') {
			return demoReset(request, env);
		}

		const parentPlanMatch = pathname.match(/^\/api\/parent\/learners\/([A-Za-z0-9-]+)\/plan$/);
		if (parentPlanMatch && request.method === 'GET') {
			return parentLearnerPlan(request, env, parentPlanMatch[1]);
		}

		const rescheduleMatch = pathname.match(/^\/api\/parent\/learners\/([A-Za-z0-9-]+)\/plan\/reschedule$/);
		if (rescheduleMatch && request.method === 'POST') {
			return rescheduleParentPlan(request, env, rescheduleMatch[1]);
		}

		const settingsMatch = pathname.match(/^\/api\/parent\/learners\/([A-Za-z0-9-]+)\/study-settings$/);
		if (settingsMatch && request.method === 'PUT') {
			return updateStudySettings(request, env, settingsMatch[1]);
		}

		const exercisesMatch = pathname.match(/^\/api\/parent\/learners\/([A-Za-z0-9-]+)\/exercises$/);
		if (exercisesMatch && request.method === 'GET') {
			return parentExercises(request, env, exercisesMatch[1]);
		}

		const historyMatch = pathname.match(/^\/api\/learning\/history\/([A-Za-z0-9-]+)$/);
		if (historyMatch && request.method === 'GET') {
			return learningHistoryDetail(request, env, historyMatch[1]);
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
