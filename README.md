# n8n-nodes-poof

This is an n8n community node for the [Poof](https://poof.bg) background removal API.

Poof is the developer-first standard for background removal — precise, fast, and scalable.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### npm

```bash
npm install n8n-nodes-poof
```

### n8n Desktop/Cloud

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `n8n-nodes-poof` and click **Install**

## Operations

### Remove Background

Remove the background from an image.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| Input Binary Field | Name of the binary property containing the image |
| Output Binary Field | Name of the binary property for the result |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| Format | Output format: PNG, JPG, or WebP | PNG |
| Channels | RGBA (transparent) or RGB (opaque) | RGBA |
| Background Color | Color for RGB output (hex, rgb, or name) | - |
| Size | Output size: full, preview, small, medium, large | full |
| Crop to Subject | Crop image to subject bounds | false |

### Get Account

Retrieve account information including plan details and credit usage.

**Returns:**

- `organizationId` - Your organization ID
- `plan` - Current plan name
- `maxCredits` - Total credits in billing cycle
- `usedCredits` - Credits used this cycle
- `autoRechargeThreshold` - Auto-recharge threshold (if enabled)

## Credentials

You need a Poof API key to use this node.

1. Sign up at [dash.poof.bg](https://dash.poof.bg)
2. Create an API key in your dashboard
3. In n8n, create new credentials of type **Poof API**
4. Paste your API key

## Example Workflow

```
[Read Binary File] → [Poof: Remove Background] → [Write Binary File]
```

1. **Read Binary File**: Load an image
2. **Poof**: Remove the background
3. **Write Binary File**: Save the result

## Resources

- [Poof Documentation](https://docs.poof.bg)
- [Poof Dashboard](https://dash.poof.bg)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
