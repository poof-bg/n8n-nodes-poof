# @poof-bg/n8n-nodes-poof

This is an n8n community node for the [Poof](https://poof.bg) [background removal API](https://poof.bg/background-removal-api).

Migrating from remove.bg? It shuts down on 1 December 2026 — see the [remove.bg alternative and migration guide](https://poof.bg/alternative/remove-bg).

Poof is the developer-first standard for background removal — precise, fast, and scalable.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

### npm

```bash
npm install @poof-bg/n8n-nodes-poof
```

### n8n Desktop/Cloud

1. Go to **Settings > Community Nodes**
2. Select **Install**
3. Enter `@poof-bg/n8n-nodes-poof` and click **Install**

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
| Channels | RGBA (transparent), RGB (opaque) or Alpha (grayscale mask only) | RGBA |
| Background Color | Color for RGB output (hex, rgb, or name) | - |
| Size | Output size preset: full, hd, medium, preview | full |
| Crop to Subject | Crop image to subject bounds | false |

### Remove Video Background

Remove the background from a video (MP4, MOV, WebM, M4V or MKV, up to 5 minutes). The node submits the video, polls the job every 3 seconds until it is done, and downloads the result. Costs 5 credits per second of video (10 per second above 30 fps); credits are refunded if the job fails.

**Parameters:**

| Parameter | Description |
|-----------|-------------|
| Input | Binary File (upload, max 100 MB) or URL (public video URL, max 500 MB) |
| Input Binary Field | Name of the binary property containing the video (Binary File input) |
| Video URL | Public URL of the video (URL input) |
| Download Result | Download the finished video into a binary property. Off: return the job only; its `result_url` is a direct link valid for 24 hours |
| Output Binary Field | Name of the binary property for the result |

**Options:**

| Option | Description | Default |
|--------|-------------|---------|
| Format | WebM (VP9, transparent), MOV (ProRes 4444, transparent) or MP4 (H.264, no transparency) | WebM |
| Channels | RGBA (transparent), RGB (on a background color) or Alpha (mask only) | RGBA |
| Background Color | Color behind the subject for RGB and MP4 output, e.g. `#00ff00` for green screen | - |
| Size | Longest-side cap: preview 640 px, medium 1280 px, hd 1920 px; full keeps the source resolution up to 4096 px (4K) | full |
| Timeout (Minutes) | How long to wait for the job before failing | 10 |

The output JSON is the job: `id`, `status`, `credits`, `duration_seconds`, `fps`, `result_url`, `expires_at`, `stats` and more.

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

The same works for video: `[Read Binary File (clip.mp4)] → [Poof: Remove Video Background] → [Write Binary File (clip.webm)]`.

## Resources

- [Poof Documentation](https://docs.poof.bg)
- [Poof Dashboard](https://dash.poof.bg)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## License

[MIT](LICENSE)
