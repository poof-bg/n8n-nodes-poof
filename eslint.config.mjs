import { n8nCommunityNodesPlugin } from '@n8n/eslint-plugin-community-nodes';

export default [
	{ ignores: ['dist/', 'gulpfile.js'] },
	n8nCommunityNodesPlugin.configs.recommended,
];
