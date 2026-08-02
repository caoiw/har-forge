# HAR Forge

**Clean, filter, and sanitize HAR files before generating API and performance tests.**

HAR Forge is a local-first tool for QA, automation, and performance workflows where a browser-recorded HAR file has too much noise and you only want the requests that matter before importing it into k6 Studio, `har-to-k6`, Playwright, or another test tool.

## Live Demo

https://har-forge.pages.dev/

## The problem

Recording a browser flow as a HAR file is useful, but the exported file usually contains a lot more than the test flow itself.

A single capture can include:

- static assets such as CSS, JavaScript, images, fonts, and source maps;
- preflight `OPTIONS` requests;
- analytics, tracking, and third-party calls;
- unrelated routes from the same session;
- cookies, tokens, authorization headers, and sensitive payload data.

That noise makes generated API and performance tests harder to read, maintain, and trust.

HAR Forge helps you turn a noisy browser capture into a cleaner HAR file that is safer to inspect, share, and use as input for test generation.

## What it does

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

## Example

Before filtering:

```text
184 requests
├─ API requests
├─ static assets
├─ OPTIONS/preflight requests
├─ analytics and tracking calls
├─ third-party domains
├─ unrelated routes
└─ sensitive headers, cookies, tokens, and payload values
```

After filtering with HAR Forge:

```text
23 relevant requests
├─ selected API flow kept
├─ noisy requests removed
├─ secrets sanitized
└─ clean.har ready for k6 Studio, har-to-k6, Playwright, or another test tool
```

## Typical workflow

1. Record a browser flow and export it as a `.har` file.
2. Open the HAR in HAR Forge.
3. Choose what should be kept or dropped.
4. Remove common noise such as `OPTIONS`, static assets, and third-party calls.
5. Sanitize secrets before export.
6. Download `clean.har`.
7. Import the cleaned file into your test generation workflow.

## Who it is for

HAR Forge is useful for:

- QA engineers preparing browser captures for API or performance testing;
- automation engineers generating tests from HAR files;
- performance engineers working with k6 Studio or `har-to-k6`;
- developers who need to inspect or share HAR files without leaking secrets.

## Privacy

HAR Forge runs entirely in the browser.

Files are not uploaded to a server, and all parsing, filtering, sanitization, and export steps happen locally.

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

## Roadmap

- Visual allowed-hosts selection.
- More presets for k6 and API-only workflows.
- Import and export reusable filter presets.
- Better before/after reports for cleaned HAR files.
- Example HAR files for local testing and demos.

## Product identity

**Turn noisy browser captures into focused evidence for debugging.**

- **Primary audience:** Engineers and QA practitioners who need to inspect or share HTTP archive files safely.
- **Problem:** Raw HAR captures are large, noisy, and can expose irrelevant or sensitive request data.
- **Value:** HAR Forge filters and reshapes captures into smaller, purpose-specific debugging artifacts.
- **Boundaries:** It assists inspection and redaction; it does not replace security review or observability platforms.
- **Maturity:** MVP

The canonical product profile is maintained in [.praxis/context/project.md](.praxis/context/project.md).