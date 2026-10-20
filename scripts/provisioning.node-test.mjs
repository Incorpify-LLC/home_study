import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import { spawnSync } from 'node:child_process';
import { EventEmitter } from 'node:events';
import process from 'node:process';
import { test } from 'node:test';
import { URL } from 'node:url';

import { buildParentInsert, hashPassword, parseTarget, readSecret, validatePassword } from './provisioning.mjs';

test('hashPassword creates a Worker-compatible PBKDF2 verifier', async () => {
	const encoded = await hashPassword('correct horse battery staple', Buffer.from('0123456789abcdef'));

	assert.equal(encoded, 'pbkdf2-sha256$100000$MDEyMzQ1Njc4OWFiY2RlZg$CQEF03iMraucElCfobodRqkaFY16F3mxFDIvP9WoJcs');
});

test('parseTarget requires an explicit local or remote destination', () => {
	assert.equal(parseTarget(['--local']), '--local');
	assert.equal(parseTarget(['--remote']), '--remote');
	assert.throws(() => parseTarget([]), /Choose exactly one/);
	assert.throws(() => parseTarget(['--local', '--remote']), /Choose exactly one/);
});

test('validatePassword requires a substantial private passphrase', () => {
	assert.throws(() => validatePassword('short'), /at least 12/);
	assert.throws(() => validatePassword('a'.repeat(257)), /no more than 256/);
	assert.equal(validatePassword('correct horse battery staple'), 'correct horse battery staple');
});

test('readSecret collects TTY input without writing the secret', async () => {
	class FakeTty extends EventEmitter {
		isTTY = true;
		rawModes = [];
		setRawMode(enabled) {
			this.rawModes.push(enabled);
		}
		resume() {}
		pause() {}
	}

	const input = new FakeTty();
	const writes = [];
	const output = { write: (value) => writes.push(value) };
	const secretPromise = readSecret(input, output, 'Password: ');
	input.emit('data', Buffer.from('private passphrase\r'));

	assert.equal(await secretPromise, 'private passphrase');
	assert.deepEqual(input.rawModes, [true, false]);
	assert.equal(writes.join(''), 'Password: \n');
	assert.doesNotMatch(writes.join(''), /private passphrase/);
});

test('parent provisioning refuses to read a password without an interactive terminal', () => {
	const result = spawnSync(process.execPath, ['scripts/provision-parent.mjs', '--remote'], {
		cwd: new URL('..', import.meta.url),
		encoding: 'utf8',
	});

	assert.equal(result.status, 1);
	assert.match(result.stderr, /interactive terminal/);
});

test('buildParentInsert validates and safely quotes account fields', () => {
	const sql = buildParentInsert({
		id: '11111111-1111-4111-8111-111111111111',
		displayName: "Parent O'Neil",
		identifier: ' Parent-A ',
		email: 'parent-a@example.test',
		passwordHash: 'pbkdf2-sha256$100000$salt$hash',
	});

	assert.equal(
		sql,
		"INSERT INTO users (id, role, display_name, email, password_hash, login_identifier) VALUES ('11111111-1111-4111-8111-111111111111', 'parent', 'Parent O''Neil', 'parent-a@example.test', 'pbkdf2-sha256$100000$salt$hash', 'parent-a');\n",
	);
});
