#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import process from 'node:process';

const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const violations = [];
const emailPattern = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const absoluteHomePattern = /\/home\/[^/\s]+\//g;

for (const file of files) {
	let source;
	try {
		source = readFileSync(file, 'utf8');
	} catch {
		continue;
	}
	if (source.includes('\0')) continue;
	for (const match of source.matchAll(emailPattern)) {
		const address = match[0].toLowerCase();
		if (address.endsWith('@example.test') || address === 'git@github.com' || address.endsWith('@users.noreply.github.com')) continue;
		violations.push(`${file}: non-fixture email address`);
	}
	if (absoluteHomePattern.test(source)) violations.push(`${file}: user-specific absolute home path`);
	absoluteHomePattern.lastIndex = 0;
}

if (violations.length > 0) {
	process.stderr.write(`${[...new Set(violations)].join('\n')}\n`);
	process.exit(1);
}
process.stdout.write(`Public-data check passed for ${files.length} tracked files.\n`);
