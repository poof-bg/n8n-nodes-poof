import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError, sleep } from 'n8n-workflow';

const API_URL = 'https://api.poof.bg/v1';
const JOB_POLL_INTERVAL_MS = 3000;

const VIDEO_MIME_TYPES: Record<string, string> = {
	webm: 'video/webm',
	mov: 'video/quicktime',
	mp4: 'video/mp4',
};

export class Poof implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Poof',
		name: 'poof',
		icon: 'file:poof.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Remove backgrounds from images and videos with Poof API',
		defaults: {
			name: 'Poof',
		},
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'poofApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Get Account',
						value: 'getAccount',
						description: 'Get account information and credit usage',
						action: 'Get account information',
					},
					{
						name: 'Remove Background',
						value: 'removeBackground',
						description: 'Remove background from an image',
						action: 'Remove background from an image',
					},
					{
						name: 'Remove Video Background',
						value: 'removeVideoBackground',
						description: 'Remove background from a video. Costs 5 credits per second of video (10 per second above 30 fps).',
						action: 'Remove background from a video',
					},
				],
				default: 'removeBackground',
			},
			// Remove Background fields
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['removeBackground'],
					},
				},
				description: 'Name of the binary property containing the image to process',
			},
			{
				displayName: 'Output Binary Field',
				name: 'outputBinaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['removeBackground'],
					},
				},
				description: 'Name of the binary property to store the processed image',
			},
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['removeBackground'],
					},
				},
				options: [
					{
						displayName: 'Background Color',
						name: 'bg_color',
						type: 'color',
						default: '',
						placeholder: '#ffffff',
						description: 'Background color (hex, rgb, or color name). Only applies when channels is RGB.',
					},
					{
						displayName: 'Channels',
						name: 'channels',
						type: 'options',
						options: [
							{ name: 'RGBA (Transparent)', value: 'rgba' },
							{ name: 'RGB (Opaque)', value: 'rgb' },
						],
						default: 'rgba',
						description: 'Output color channels. Use RGBA for transparency, RGB for opaque background.',
					},
					{
						displayName: 'Crop to Subject',
						name: 'crop',
						type: 'boolean',
						default: false,
						description: 'Whether to crop the image to the subject bounds',
					},
					{
						displayName: 'Format',
						name: 'format',
						type: 'options',
						options: [
							{ name: 'PNG', value: 'png' },
							{ name: 'JPG', value: 'jpg' },
							{ name: 'WebP', value: 'webp' },
						],
						default: 'png',
						description: 'Output image format',
					},
					{
						displayName: 'Size',
						name: 'size',
						type: 'options',
						options: [
							{ name: 'Full', value: 'full' },
							{ name: 'Large', value: 'large' },
							{ name: 'Medium', value: 'medium' },
							{ name: 'Preview', value: 'preview' },
							{ name: 'Small', value: 'small' },
						],
						default: 'full',
						description: 'Output image size preset',
					},
				],
			},
			// Remove Video Background fields
			{
				displayName: 'Input',
				name: 'videoInput',
				type: 'options',
				options: [
					{ name: 'Binary File', value: 'binary', description: 'Upload a video from a binary property (max 100 MB)' },
					{ name: 'URL', value: 'url', description: 'Let Poof download a public video URL (max 500 MB)' },
				],
				default: 'binary',
				displayOptions: {
					show: {
						operation: ['removeVideoBackground'],
					},
				},
				description: 'Where the video comes from. MP4, MOV, WebM, M4V and MKV up to 5 minutes are supported.',
			},
			{
				displayName: 'Input Binary Field',
				name: 'binaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['removeVideoBackground'],
						videoInput: ['binary'],
					},
				},
				description: 'Name of the binary property containing the video to process',
			},
			{
				displayName: 'Video URL',
				name: 'videoUrl',
				type: 'string',
				default: '',
				required: true,
				placeholder: 'https://example.com/clip.mp4',
				displayOptions: {
					show: {
						operation: ['removeVideoBackground'],
						videoInput: ['url'],
					},
				},
				description: 'Public URL of the video to process',
			},
			{
				displayName: 'Download Result',
				name: 'downloadResult',
				type: 'boolean',
				default: true,
				displayOptions: {
					show: {
						operation: ['removeVideoBackground'],
					},
				},
				description:
					'Whether to download the finished video into a binary property. When off, only the job is returned; its result_url is a direct download link valid for 24 hours.',
			},
			{
				displayName: 'Output Binary Field',
				name: 'outputBinaryPropertyName',
				type: 'string',
				default: 'data',
				required: true,
				displayOptions: {
					show: {
						operation: ['removeVideoBackground'],
						downloadResult: [true],
					},
				},
				description: 'Name of the binary property to store the processed video',
			},
			{
				displayName: 'Options',
				name: 'videoOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						operation: ['removeVideoBackground'],
					},
				},
				options: [
					{
						displayName: 'Background Color',
						name: 'bg_color',
						type: 'color',
						default: '',
						placeholder: '#00ff00',
						description:
							'Background color (hex, rgb, or color name) behind the subject. Applies to RGB output and to MP4, which has no transparency.',
					},
					{
						displayName: 'Channels',
						name: 'channels',
						type: 'options',
						options: [
							{ name: 'RGBA (Transparent)', value: 'rgba' },
							{ name: 'RGB (Opaque)', value: 'rgb' },
							{ name: 'Alpha (Mask Only)', value: 'alpha' },
						],
						default: 'rgba',
						description: 'Output color channels: transparent, subject on a background color, or the grayscale mask only',
					},
					{
						displayName: 'Format',
						name: 'format',
						type: 'options',
						options: [
							{ name: 'WebM (VP9, Transparent)', value: 'webm' },
							{ name: 'MOV (ProRes 4444, Transparent)', value: 'mov' },
							{ name: 'MP4 (H.264, No Transparency)', value: 'mp4' },
						],
						default: 'webm',
						description: 'Output video format',
					},
					{
						displayName: 'Size',
						name: 'size',
						type: 'options',
						options: [
							{ name: 'Full (Source, Up To 4096 Px)', value: 'full' },
							{ name: 'HD (1920 Px)', value: 'hd' },
							{ name: 'Medium (1280 Px)', value: 'medium' },
							{ name: 'Preview (640 Px)', value: 'preview' },
						],
						default: 'full',
						description:
							'Cap on the longest side of the output video. Full keeps the source resolution up to 4096 px (4K); output is never upscaled beyond the source.',
					},
					{
						displayName: 'Timeout (Minutes)',
						name: 'timeoutMinutes',
						type: 'number',
						typeOptions: { minValue: 1 },
						default: 10,
						description: 'How long to wait for the job to finish before failing. The job keeps running on Poof and can be fetched later.',
					},
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				if (operation === 'removeBackground') {
					const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
					const outputBinaryPropertyName = this.getNodeParameter('outputBinaryPropertyName', i) as string;
					const options = this.getNodeParameter('options', i) as IDataObject;

					const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
					const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);

					// Build form data
					const form = new FormData();
					form.append(
						'image_file',
						new Blob([buffer], { type: binaryData.mimeType || 'image/png' }),
						binaryData.fileName || 'image.png',
					);

					if (options.format) form.append('format', options.format as string);
					if (options.channels) form.append('channels', options.channels as string);
					if (options.bg_color) form.append('bg_color', options.bg_color as string);
					if (options.size) form.append('size', options.size as string);
					if (options.crop !== undefined) form.append('crop', String(options.crop));

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'poofApi',
						{
							method: 'POST',
							url: 'https://api.poof.bg/v1/remove',
							body: form,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						},
					);

					const contentType = response.headers['content-type'] as string || 'image/png';
					const format = options.format as string || 'png';
					
					// Determine file extension from format or content-type
					let extension = format;
					if (contentType.includes('jpeg') || contentType.includes('jpg')) {
						extension = 'jpg';
					} else if (contentType.includes('webp')) {
						extension = 'webp';
					} else if (contentType.includes('png')) {
						extension = 'png';
					}

					const newItem: INodeExecutionData = {
						json: {
							success: true,
							requestId: response.headers['x-request-id'],
							processingTimeMs: response.headers['x-processing-time-ms'],
							imageWidth: response.headers['x-image-width'],
							imageHeight: response.headers['x-image-height'],
						},
						binary: {
							[outputBinaryPropertyName]: await this.helpers.prepareBinaryData(
								Buffer.from(response.body as Buffer),
								`processed.${extension}`,
								contentType,
							),
						},
						pairedItem: { item: i },
					};

					returnData.push(newItem);
				} else if (operation === 'removeVideoBackground') {
					const videoInput = this.getNodeParameter('videoInput', i) as string;
					const downloadResult = this.getNodeParameter('downloadResult', i) as boolean;
					const options = this.getNodeParameter('videoOptions', i) as IDataObject;

					const form = new FormData();
					if (videoInput === 'url') {
						form.append('url', this.getNodeParameter('videoUrl', i) as string);
					} else {
						const binaryPropertyName = this.getNodeParameter('binaryPropertyName', i) as string;
						const binaryData = this.helpers.assertBinaryData(i, binaryPropertyName);
						const buffer = await this.helpers.getBinaryDataBuffer(i, binaryPropertyName);
						form.append(
							'file',
							new Blob([buffer], { type: binaryData.mimeType || 'video/mp4' }),
							binaryData.fileName || 'video.mp4',
						);
					}

					if (options.format) form.append('format', options.format as string);
					if (options.channels) form.append('channels', options.channels as string);
					if (options.bg_color) form.append('bg_color', options.bg_color as string);
					if (options.size) form.append('size', options.size as string);

					const response = await this.helpers.httpRequestWithAuthentication.call(this, 'poofApi', {
						method: 'POST',
						url: `${API_URL}/remove`,
						body: form,
						encoding: 'arraybuffer',
						returnFullResponse: true,
					});

					// An image input is answered with the processed image (200), not a job
					const contentType = (response.headers['content-type'] as string) || '';
					if (response.statusCode !== 202 || !contentType.includes('application/json')) {
						throw new NodeOperationError(
							this.getNode(),
							'Poof did not return a video job. The input looks like an image; use the Remove Background operation for images.',
							{ itemIndex: i },
						);
					}

					let job = JSON.parse(Buffer.from(response.body as Buffer).toString('utf8')) as IDataObject;
					const timeoutMinutes = (options.timeoutMinutes as number) || 10;
					const deadline = Date.now() + timeoutMinutes * 60_000;

					while (job.status !== 'completed' && job.status !== 'failed') {
						if (Date.now() > deadline) {
							throw new NodeOperationError(
								this.getNode(),
								`Video job ${job.id} did not finish within ${timeoutMinutes} minutes (status: ${job.status}). It keeps running on Poof; fetch it with GET ${API_URL}/jobs/${job.id}.`,
								{ itemIndex: i },
							);
						}
						await sleep(JOB_POLL_INTERVAL_MS);
						job = (await this.helpers.httpRequestWithAuthentication.call(this, 'poofApi', {
							method: 'GET',
							url: `${API_URL}/jobs/${job.id}`,
							json: true,
						})) as IDataObject;
					}

					if (job.status === 'failed') {
						const jobError = (job.error as IDataObject) || {};
						throw new NodeOperationError(
							this.getNode(),
							`Video job ${job.id} failed: ${jobError.message || 'unknown error'} (credits are refunded)`,
							{ itemIndex: i, description: jobError.code as string | undefined },
						);
					}

					const newItem: INodeExecutionData = {
						json: job,
						pairedItem: { item: i },
					};

					if (downloadResult) {
						const outputBinaryPropertyName = this.getNodeParameter('outputBinaryPropertyName', i) as string;
						const format = (job.format as string) || 'webm';
						// result_url is a public CDN link, so no credentials are sent
						const download = await this.helpers.httpRequest({
							method: 'GET',
							url: job.result_url as string,
							encoding: 'arraybuffer',
							returnFullResponse: true,
						});
						newItem.binary = {
							[outputBinaryPropertyName]: await this.helpers.prepareBinaryData(
								Buffer.from(download.body as Buffer),
								`processed.${format}`,
								VIDEO_MIME_TYPES[format] || (download.headers['content-type'] as string),
							),
						};
					}

					returnData.push(newItem);
				} else if (operation === 'getAccount') {
					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'poofApi',
						{
							method: 'GET',
							url: 'https://api.poof.bg/v1/me',
							json: true,
						},
					);

					returnData.push({
						json: response as IDataObject,
						pairedItem: { item: i },
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
						pairedItem: { item: i },
					});
					continue;
				}
				if (error instanceof NodeOperationError) throw error;
				throw new NodeApiError(this.getNode(), error as JsonObject, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
