// eslint.config.js
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";

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
			"no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"no-console": ["warn", { allow: ["warn", "error"] }],
			semi: ["error", "always"],
			quotes: ["error", "single", { avoidEscape: true }],
			indent: ["error", 2],
			"comma-dangle": ["error", "always-multiline"],
			eqeqeq: ["error", "always"],
			curly: ["error", "all"],
			"brace-style": ["error", "1tbs"]
		}
	},
	{
		files: ["**/*.ts", "**/*.tsx"],
		languageOptions: {
			parser: tsParser,
			sourceType: "module",
			parserOptions: {
				project: "./tsconfig.json",
				tsconfigRootDir: import.meta.dirname
			}
		},
		plugins: {
			"@typescript-eslint": tseslint
		},
		rules: {
			"no-unused-vars": "off",
			quotes: "off",
			"comma-dangle": "off",
			"@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
			"@typescript-eslint/explicit-function-return-types": "warn",
			"@typescript-eslint/no-explicit-any": "error"
		}
	}
];
