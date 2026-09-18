# Entrega

A multilingual application for creative freelancers, plus the original sales funnel. Spanish is the default; English and Portuguese are available throughout.

## Current private alpha

The application at `/app` saves clients, projects, deadlines, tasks and delivery links in D1. Review pages support comments, approvals and change requests with server-side permissions. The current site uses ChatGPT sign-in and remains private to its owner.

The sales pages at `/`, `/checkout`, `/upgrade` and `/confirmation` are still demonstrations. No real payments or subscriptions are created. Prices shown on those pages are proposals, not enforced paid entitlements.

## Run checks and build

Requires Node.js 24+.

```sh
npm ci
npm test
npm run build
```

Deployment requires a Worker runtime, the `DB` D1 binding, the generated migrations and a trusted identity gateway. A static server only previews the marketing pages and cannot run the application.

See [DEVELOPMENT.md](DEVELOPMENT.md) for architecture, security boundaries, test coverage and the remaining requirements before commercial launch. This GitHub copy does not automatically deploy to the existing ChatGPT Site.

## Cloudflare Pages

The public marketing funnel can be deployed from this repository with `dist` as the build output directory. `functions/api/pricing.js` provides the IP-country currency endpoint using trusted Cloudflare edge metadata. The `_headers` file adds baseline response protections.

The customer application remains a private beta on its existing authenticated host. On Cloudflare, `/app` intentionally shows a private-beta notice until a public identity provider, a D1 database and account provisioning are configured. Do not expose `worker/api.mjs` publicly without replacing the current host-specific identity headers with verified Cloudflare authentication.
