# HAR Forge

HAR Forge is a local-first tool to clean, filter, and sanitize HAR files before generating API and performance tests.

It is built for QA and performance workflows where a browser capture has too much noise and you only want the requests that matter before importing the HAR into k6 Studio, `har-to-k6`, Playwright, or another test tool.

## Live Demo

https://har-forge.pages.dev/

## Features

- Upload or drag and drop a `.har` file.
- Filter requests by URL, host, or path.
- Use contains or regex matching.
- Keep matching requests or drop matching requests.
- Remove `OPTIONS` requests.
- Remove static assets.
- Remove third-party requests based on the selected base host.
- Preview total, kept, and removed request counts.
- Inspect post-filter requests in a table with method, status, host, path, type, size, time, and category.
- Manually exclude individual requests from the final export.
- Sanitize sensitive data before export.
- Download a cleaned `clean.har` file.

## Privacy

HAR Forge runs entirely in the browser. Files are not uploaded to a server, and all parsing, filtering, sanitization, and export steps happen locally.

Sanitization redacts common sensitive fields such as:

- `Authorization`
- `Cookie`
- `Set-Cookie`
- `X-CSRF-Token`
- `access_token`
- `refresh_token`
- `id_token`
- `password`
- `senha`
- `token`
- `api_key`
- `client_secret`

## Getting Started

Install dependencies:

```bash
npm install
```

Run the local dev server:

```bash
npm run dev
```

Run tests:

```bash
npm run test
```

Build for production:

```bash
npm run build
```

## Tech Stack

- Vite
- React
- TypeScript
- Tailwind CSS
- Vitest
