# Changelog

All notable changes to `@poof-bg/n8n-nodes-poof` are documented here.
This project follows [Semantic Versioning](https://semver.org/).

## 1.2.2 - 2026-10-21

- Background Color help (Remove Background and Remove Video Background) follows the API rule:
  setting it fills the background, so the result is opaque, for videos in every format (WebM,
  MOV and GIF included); with RGB channels (or JPG/MP4) and no color the background is white;
  ignored with Alpha channels. It used to say the color was ignored for transparent output.

## 1.2.1 - 2026-10-21

Fixes for n8n verification: `usableAsTool`, `NodeApiError` and themed icons.

- The Poof node is marked `usableAsTool: true`, so AI Agent nodes can use it as a tool.
- Errors are no longer re-thrown raw. Failed job polls are wrapped in `NodeApiError`, and
  `NodeOperationError`s pass through unchanged. Error messages and the Continue On Fail
  output stay the same.
- The node and the credential have light and dark icons (`poof.svg` and `poof.dark.svg`).
  The CSS `invert()` workaround in `poof.svg` is removed.

## 1.2.0 - 2026-10-20

- New **Remove Video Background** operation. It takes a binary upload or a public URL,
  polls the job until it finishes (the default timeout is 30 minutes) and downloads the
  result. Output can be WebM, MOV, MP4 or GIF, with channel, background color and size
  options.
- Transient errors (5xx, 429, network) are retried with backoff while polling. Errors on a
  job include the job id.
- Image size options now match the API (preview, medium, hd, full). An alpha channel option
  was added. Sending a video or an animated GIF to Remove Background now points you to
  Remove Video Background.
- Merging to `main` now publishes to npm with provenance and creates a tagged GitHub Release.

## 1.0.7 - 2026-03-27

- The credential icon now loads at runtime, because the icon is copied into
  `dist/credentials`.

## 1.0.6 - 2026-03-26

- Changes from the n8n verification review: added a credential icon, used the
  `NodeConnectionTypes` enum, sorted the options, and switched HTTP errors to `NodeApiError`.
- Moved to `@n8n/eslint-plugin-community-nodes` and ESLint 9 flat config.

## 1.0.5 - 2026-03-05

- Every output item, including Continue On Fail errors, now has `pairedItem`.

## 1.0.4 - 2026-02-16

- Removed the `form-data` dependency in favour of the native `FormData` and `Blob` APIs,
  which n8n Cloud requires.

## 1.0.3 - 2026-02-16

- Added n8n node linting for community verification and fixed the lint findings.

## 1.0.2 - 2026-02-16

- Updated the logo.

## 1.0.1 - 2026-02-16

- Fixed a "missing image" error in the Remove Background operation.

## 1.0.0 - 2026-02-03

- First release, with the Remove Background (image) and Get Account operations.
