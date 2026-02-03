import type {
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	IDataObject,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

export class Poof implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Poof',
		name: 'poof',
		icon: 'file:poof.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Remove backgrounds from images with Poof API',
		defaults: {
			name: 'Poof',
		},
		inputs: ['main'],
		outputs: ['main'],
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
						name: 'Remove Background',
						value: 'removeBackground',
						description: 'Remove background from an image',
						action: 'Remove background from an image',
					},
					{
						name: 'Get Account',
						value: 'getAccount',
						description: 'Get account information and credit usage',
						action: 'Get account information',
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
						displayName: 'Background Color',
						name: 'bg_color',
						type: 'string',
						default: '',
						placeholder: '#ffffff',
						description: 'Background color (hex, rgb, or color name). Only applies when channels is RGB.',
					},
					{
						displayName: 'Size',
						name: 'size',
						type: 'options',
						options: [
							{ name: 'Full', value: 'full' },
							{ name: 'Preview', value: 'preview' },
							{ name: 'Small', value: 'small' },
							{ name: 'Medium', value: 'medium' },
							{ name: 'Large', value: 'large' },
						],
						default: 'full',
						description: 'Output image size preset',
					},
					{
						displayName: 'Crop to Subject',
						name: 'crop',
						type: 'boolean',
						default: false,
						description: 'Whether to crop the image to the subject bounds',
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
					const formData: IDataObject = {
						image_file: {
							value: buffer,
							options: {
								filename: binaryData.fileName || 'image.png',
								contentType: binaryData.mimeType || 'image/png',
							},
						},
					};

					// Add options to form data
					if (options.format) {
						formData.format = options.format;
					}
					if (options.channels) {
						formData.channels = options.channels;
					}
					if (options.bg_color) {
						formData.bg_color = options.bg_color;
					}
					if (options.size) {
						formData.size = options.size;
					}
					if (options.crop !== undefined) {
						formData.crop = options.crop;
					}

					const response = await this.helpers.httpRequestWithAuthentication.call(
						this,
						'poofApi',
						{
							method: 'POST',
							url: 'https://api.poof.bg/v1/remove',
							body: formData,
							encoding: 'arraybuffer',
							returnFullResponse: true,
							headers: {
								'Content-Type': 'multipart/form-data',
							},
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
					};

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
					});
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: {
							error: (error as Error).message,
						},
					});
					continue;
				}
				throw new NodeOperationError(this.getNode(), error as Error, {
					itemIndex: i,
				});
			}
		}

		return [returnData];
	}
}
