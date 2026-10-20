// Unit tests for the Poof node against a mocked n8n execution context.
// Run with `npm test` (builds first; tests load the compiled node from dist/).
const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const workflow = require('n8n-workflow');

// Skip the real poll / backoff delays
const sleeps = [];
Object.defineProperty(workflow, 'sleep', {
	configurable: true,
	value: async (ms) => {
		sleeps.push(ms);
	},
});

const { Poof } = require('../dist/nodes/Poof/Poof.node.js');

const JOB = {
	id: 'job_test',
	status: 'queued',
	progress: 0,
	format: 'gif',
	credits: 15,
	result_url: null,
};

let requests;
beforeEach(() => {
	requests = [];
	sleeps.length = 0;
});

/** Build a mock IExecuteFunctions; `replies` are consumed in order by authenticated requests */
function context(params, replies, binary = { mimeType: 'image/gif', fileName: 'in.gif' }) {
	const next = async (opts) => {
		requests.push(opts);
		const reply = replies.shift();
		if (!reply) throw new Error(`unexpected request ${opts.method} ${opts.url}`);
		if (reply instanceof Error) throw reply;
		return reply;
	};
	return {
		getInputData: () => [{ json: {}, binary: { data: binary } }],
		getNodeParameter: (name) => params[name],
		getNode: () => ({ name: 'Poof', type: 'poof', typeVersion: 1, parameters: {} }),
		continueOnFail: () => false,
		helpers: {
			assertBinaryData: () => binary,
			getBinaryDataBuffer: async () => Buffer.from('GIF89a'),
			httpRequestWithAuthentication: (_cred, opts) => next(opts),
			httpRequest: async (opts) => {
				requests.push(opts);
				return { body: Buffer.from('GIF89a'), headers: { 'content-type': 'image/gif' } };
			},
			prepareBinaryData: async (data, fileName, mimeType) => ({ fileName, mimeType, size: data.length }),
		},
	};
}

const accepted = (job = JOB) => ({
	statusCode: 202,
	headers: { 'content-type': 'application/json' },
	body: Buffer.from(JSON.stringify(job)),
});

function httpError(status) {
	const error = new Error(`Request failed with status code ${status}`);
	error.response = { status };
	return error;
}

const imageParams = {
	operation: 'removeBackground',
	binaryPropertyName: 'data',
	outputBinaryPropertyName: 'data',
	options: { crop: false },
};

const videoParams = {
	operation: 'removeVideoBackground',
	videoInput: 'binary',
	binaryPropertyName: 'data',
	downloadResult: true,
	outputBinaryPropertyName: 'data',
	videoOptions: { format: 'gif' },
};

test('Remove Background: an animated GIF points to Remove Video Background', async () => {
	const ctx = context(imageParams, [accepted()]);
	await assert.rejects(new Poof().execute.call(ctx), (error) => {
		assert.match(error.message, /animated GIF/);
		assert.match(error.message, /Remove Video Background/);
		return true;
	});
});

test('Remove Background: crop is only sent when enabled', async () => {
	const image = { statusCode: 200, headers: { 'content-type': 'image/png' }, body: Buffer.from('png') };
	await new Poof().execute.call(context(imageParams, [image], { mimeType: 'image/png', fileName: 'a.png' }));
	assert.equal(requests[0].body.has('crop'), false);

	requests = [];
	const withCrop = { ...imageParams, options: { crop: true } };
	await new Poof().execute.call(context(withCrop, [image], { mimeType: 'image/png', fileName: 'a.png' }));
	assert.equal(requests[0].body.get('crop'), 'true');
});

test('Remove Video Background: polls through transient errors, then downloads the GIF', async () => {
	const done = { ...JOB, status: 'completed', progress: 1, result_url: 'https://cdn.poof.bg/r.gif' };
	const ctx = context(videoParams, [accepted(), httpError(503), new Error('socket hang up'), done]);
	const [[item]] = await new Poof().execute.call(ctx);

	assert.equal(item.json.status, 'completed');
	assert.deepEqual(item.binary.data, { fileName: 'processed.gif', mimeType: 'image/gif', size: 6 });
	assert.equal(requests[0].body.get('format'), 'gif');
	assert.equal(requests.filter((r) => r.method === 'GET' && r.url.endsWith('/jobs/job_test')).length, 3);
	assert.deepEqual(sleeps, [3000, 2000, 4000]);
});

test('Remove Video Background: a 4xx while polling is not retried', async () => {
	const ctx = context(videoParams, [accepted(), httpError(404)]);
	await assert.rejects(new Poof().execute.call(ctx));
	assert.equal(requests.length, 2);
});

test('Remove Video Background: gives up after the retry budget', async () => {
	const ctx = context(videoParams, [accepted(), ...Array.from({ length: 5 }, () => httpError(502))]);
	await assert.rejects(new Poof().execute.call(ctx));
	assert.equal(requests.length, 6);
});

test('Remove Video Background: default timeout is 30 minutes', () => {
	const options = new Poof().description.properties.find((p) => p.name === 'videoOptions').options;
	assert.equal(options.find((o) => o.name === 'timeoutMinutes').default, 30);
});
