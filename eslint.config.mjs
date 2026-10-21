import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
	{
		ignores: ['coverage/**', 'node_modules/**', '.wrangler/**', '.wrangler-dist/**', 'worker-configuration.d.ts', 'vitest.config.mts'],
	},
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['**/*.ts', '**/*.mts'],
		languageOptions: {
			parserOptions: {
				project: ['./tsconfig.json', './test/tsconfig.json'],
				tsconfigRootDir: import.meta.dirname,
			},
		},
	},
);
