#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath, URL } from 'node:url';

import { buildParentInsert, hashPassword, normalizeIdentifier, parseTarget, readSecret, validatePassword } from './provisioning.mjs';

process.on('SIGINT', () => {
	process.stdout.write('\nCancelled.\n');
	process.exit(130);
});

async function collectAccount(target) {
	if (!process.stdin.isTTY || !process.stdout.isTTY) {
		throw new Error('Parent provisioning requires an interactive terminal so the password can be entered without echo.');
	}

	const readline = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
	let displayName;
	let identifier;
	let email;
	try {
		if (target === '--remote') {
			process.stdout.write('This will create a parent account in the PRODUCTION database.\n');
			const confirmation = await readline.question('Type CREATE REMOTE PARENT to continue: ');
			if (confirmation !== 'CREATE REMOTE PARENT') throw new Error('Production provisioning was not confirmed.');
		}

		displayName = await readline.question('Parent display name: ');
		identifier = normalizeIdentifier(await readline.question('Private sign-in name: '));
		email = await readline.question('Recovery email (optional for now): ');
	} finally {
		readline.close();
	}

	const password = validatePassword(await readSecret(process.stdin, process.stdout, 'Password (12–256 characters): '));
	const confirmation = await readSecret(process.stdin, process.stdout, 'Enter the password again: ');
	if (password !== confirmation) throw new Error('The two password entries do not match.');
	return { displayName, identifier, email, password };
}

async function executeInsert(target, sql) {
	const directory = await mkdtemp(join(tmpdir(), 'home-study-provision-'));
	await chmod(directory, 0o700);
	const sqlPath = join(directory, 'parent.sql');
	try {
		await writeFile(sqlPath, sql, { encoding: 'utf8', mode: 0o600, flag: 'wx' });
		const repository = fileURLToPath(new URL('..', import.meta.url));
		const result = spawnSync('npx', ['--no-install', 'wrangler', 'd1', 'execute', 'home-study', target, '--file', sqlPath], {
			cwd: repository,
			stdio: 'inherit',
		});
		if (result.error) throw result.error;
		if (result.status !== 0) throw new Error(`Wrangler exited with status ${result.status ?? 'unknown'}.`);
	} finally {
		await rm(directory, { recursive: true, force: true });
	}
}

async function main() {
	const target = parseTarget(process.argv.slice(2));
	const account = await collectAccount(target);
	const passwordHash = await hashPassword(account.password);
	const sql = buildParentInsert({
		id: randomUUID(),
		displayName: account.displayName,
		identifier: account.identifier,
		email: account.email,
		passwordHash,
	});
	await executeInsert(target, sql);
	process.stdout.write(`Parent account created for sign-in name “${account.identifier}”.\n`);
}

try {
	await main();
} catch (error) {
	const message = error instanceof Error ? error.message : String(error);
	process.stderr.write(`Provisioning failed: ${message}\n`);
	process.exitCode = 1;
}
