import { n8nCommunityNodesPlugin } from '@n8n/eslint-plugin-community-nodes';

export default [
	{ ignores: ['dist/', 'gulpfile.js', 'test/'] },
	n8nCommunityNodesPlugin.configs.recommended,
];
