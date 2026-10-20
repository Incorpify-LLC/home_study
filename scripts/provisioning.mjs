import { Buffer } from 'node:buffer';
import { pbkdf2 as deriveKey, randomBytes } from 'node:crypto';
import { promisify } from 'node:util';

const pbkdf2 = promisify(deriveKey);
export const pbkdf2Iterations = 100_000;

function base64Url(value) {
	return Buffer.from(value).toString('base64url');
}

export async function hashPassword(password, salt = randomBytes(16)) {
	const derived = await pbkdf2(password, salt, pbkdf2Iterations, 32, 'sha256');
	return `pbkdf2-sha256$${pbkdf2Iterations}$${base64Url(salt)}$${base64Url(derived)}`;
}

export function parseTarget(argumentsList) {
	const targets = argumentsList.filter((argument) => argument === '--local' || argument === '--remote');
	if (targets.length !== 1 || argumentsList.length !== 1) {
		throw new Error('Choose exactly one destination: --local or --remote.');
	}
	return targets[0];
}

export function validatePassword(password) {
	if (password.length < 12) throw new Error('Password must contain at least 12 characters.');
	if (password.length > 256) throw new Error('Password must contain no more than 256 characters.');
	return password;
}

export function readSecret(input, output, prompt) {
	if (!input.isTTY || typeof input.setRawMode !== 'function') {
		return Promise.reject(new Error('Secret input requires an interactive terminal.'));
	}

	output.write(prompt);
	input.setRawMode(true);
	input.resume();
	return new Promise((resolve, reject) => {
		let value = '';
		const finish = (result, error) => {
			input.removeListener('data', onData);
			input.setRawMode(false);
			input.pause();
			output.write('\n');
			if (error) reject(error);
			else resolve(result);
		};
		const onData = (chunk) => {
			for (const character of chunk.toString('utf8')) {
				if (character === '\r' || character === '\n') return finish(value);
				if (character === '\u0003' || character === '\u0004') return finish(undefined, new Error('Password entry was cancelled.'));
				if (character === '\u007f' || character === '\b') {
					value = [...value].slice(0, -1).join('');
				} else if (character >= ' ') {
					value += character;
				}
			}
		};
		input.on('data', onData);
	});
}

function quoteSql(value) {
	if (value.includes('\0')) throw new Error('Account fields cannot contain a null character.');
	return `'${value.replaceAll("'", "''")}'`;
}

function containsControlCharacter(value) {
	return [...value].some((character) => {
		const codePoint = character.codePointAt(0);
		return codePoint !== undefined && (codePoint <= 31 || codePoint === 127);
	});
}

export function normalizeIdentifier(value) {
	const identifier = value.trim().toLowerCase();
	if (!/^[a-z0-9][a-z0-9._-]{2,63}$/.test(identifier)) {
		throw new Error('Sign-in name must be 3–64 characters using letters, numbers, dot, underscore, or hyphen.');
	}
	return identifier;
}

export function buildParentInsert({ id, displayName, identifier, email, passwordHash }) {
	if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
		throw new Error('The generated account ID is invalid.');
	}
	const normalizedName = displayName.trim();
	if (normalizedName.length === 0 || normalizedName.length > 80 || containsControlCharacter(normalizedName)) {
		throw new Error('Display name must be 1–80 printable characters.');
	}
	const normalizedIdentifier = normalizeIdentifier(identifier);
	const normalizedEmail = email.trim().toLowerCase();
	if (normalizedEmail && (normalizedEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail))) {
		throw new Error('Enter a valid email address, or leave it blank.');
	}
	if (!/^pbkdf2-sha256\$100000\$[A-Za-z0-9_-]+\$[A-Za-z0-9_-]+$/.test(passwordHash)) {
		throw new Error('The generated password verifier is invalid.');
	}

	const emailSql = normalizedEmail ? quoteSql(normalizedEmail) : 'NULL';
	return (
		'INSERT INTO users (id, role, display_name, email, password_hash, login_identifier) VALUES (' +
		[quoteSql(id), "'parent'", quoteSql(normalizedName), emailSql, quoteSql(passwordHash), quoteSql(normalizedIdentifier)].join(', ') +
		');\n'
	);
}
