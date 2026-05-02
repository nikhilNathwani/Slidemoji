import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import reactPlugin from "eslint-plugin-react";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
	globalIgnores(["dist"]),
	// Script files run in Node.js — give them Node globals (process, Buffer, etc.)
	{
		files: ["scripts/**/*.js"],
		languageOptions: {
			globals: { ...globals.node },
		},
	},
	// API routes run in Vercel Node.js — give them Node globals (process, Buffer, etc.)
	{
		files: ["api/**/*.js"],
		languageOptions: {
			globals: { ...globals.node },
		},
	},
	// JS/JSX files
	{
		files: ["**/*.{js,jsx}"],
		extends: [
			js.configs.recommended,
			reactHooks.configs.flat.recommended,
			reactRefresh.configs.vite,
		],
		plugins: {
			react: reactPlugin,
		},
		settings: {
			react: { version: "detect" },
		},
		languageOptions: {
			ecmaVersion: 2020,
			globals: globals.browser,
			parserOptions: {
				ecmaVersion: "latest",
				ecmaFeatures: { jsx: true },
				sourceType: "module",
			},
		},
		rules: {
			"no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z_]" }],
			"react/jsx-key": "error",
			"react/jsx-uses-vars": "error",
			"react/no-array-index-key": "warn",
			"react/self-closing-comp": "warn",
		},
	},
	// TS/TSX files — type-aware rules via typescript-eslint
	...tseslint.configs.recommended.map((config) => ({
		...config,
		files: ["**/*.{ts,tsx}"],
	})),
	{
		files: ["**/*.{ts,tsx}"],
		plugins: {
			react: reactPlugin,
		},
		settings: {
			react: { version: "detect" },
		},
		rules: {
			"@typescript-eslint/no-unused-vars": [
				"error",
				{ varsIgnorePattern: "^[A-Z_]" },
			],
			"@typescript-eslint/no-explicit-any": "warn",
			"react/jsx-key": "error",
			"react/no-array-index-key": "warn",
			"react/self-closing-comp": "warn",
		},
	},
]);
