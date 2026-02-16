module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: __dirname,
	},
	plugins: ['eslint-plugin-n8n-nodes-base'],
	overrides: [
		{
			files: ['./nodes/**/*.ts'],
			extends: ['plugin:n8n-nodes-base/nodes'],
		},
		{
			files: ['./credentials/**/*.ts'],
			extends: ['plugin:n8n-nodes-base/credentials'],
			rules: {
				// Community nodes use full HTTP URLs, not camelCase slugs
				'n8n-nodes-base/cred-class-field-documentation-url-miscased': 'off',
			},
		},
		{
			files: ['./package.json'],
			parser: 'jsonc-eslint-parser',
			extends: ['plugin:n8n-nodes-base/community'],
		},
	],
};
