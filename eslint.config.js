import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import eslintConfigPrettier from "eslint-config-prettier/flat";

export default [
	{
		ignores: ["dist/**", "node_modules/**"]
	},
	{
		files: ["**/*.js", "**/*.mjs", "**/*.cjs"],
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module"
		},
		linterOptions: { reportUnusedDisableDirectives: true },
		rules: {
			"no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
			eqeqeq: ["warn", "always"]
		}
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tsParser,
			sourceType: "module",
			parserOptions: {
				projectService: true,
				tsconfigRootDir: import.meta.dirname
			}
		},
		plugins: {
			"@typescript-eslint": tseslint
		},
		rules: {
			...(tseslint.configs?.recommended?.rules ?? {}),

			// Disable base rule and enable plugin rule for unused vars (TypeScript-specific)
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

			"@typescript-eslint/no-explicit-any": "error"
		}
	},
	eslintConfigPrettier
];
