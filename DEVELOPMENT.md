# Entrega application — private alpha

This increment adds the actual workspace at `/app`, with Spanish by default and English and Portuguese available. The sales pages and simulated checkout remain available and do not charge money.

## Implemented

- Authenticated, per-user client and project records in D1, with server-side ownership checks.
- Client registration, project creation/editing, deadlines, board/search/filter and archive.
- Task creation, completion and deletion.
- HTTPS delivery links, version-specific comments, approval and change requests.
- A review page at `/review?token=…`; a token alone does not grant access. The signed-in email must match the client email stored when that delivery was created, or the user must own the project. Only the assigned client can record approval/change decisions. Decisions apply to a delivery, not automatically to the project.
- Form errors retain user input. Labels, messages and dates support all three languages.

## Authentication and deployment boundary

The current deployment uses Sites' verified identity headers and ChatGPT sign-in. The site remains owner-private. A client review link cannot bypass that policy; external clients cannot use it until access is explicitly configured. No invitation or notification emails are sent.

Never expose this Worker directly on an untrusted origin that lets callers forge `oai-authenticated-user-*` headers. Before hosting outside Sites, replace this identity integration with a provider that verifies sessions server-side. Do not trust raw incoming identity headers outside the Sites gateway. No customer passwords or Stripe keys are stored in this repository.

## Development

Requires Node.js 24+ for the integration tests (`node:sqlite`); production uses Cloudflare D1, not Node SQLite.

```
npm ci
npm test
npm run build
```

Builds a bundled Worker at `dist/server/index.js`, including the authored static files in `dist/`, hosting metadata and generated Drizzle migrations. This application is no longer a static-only deployment: a Python static server can preview sales pages but cannot run the product API.

The schema is in `db/schema.ts`. Use `npm run db:generate` after schema changes, inspect the generated SQL, and preserve applied migration files. Sites provisions the `DB` binding and applies migrations. The integration tests exercise the migration against SQLite, real queries, cross-user authorization, review permissions, CSRF rejection, invalid dates/links and payload size limits. Browser visual QA is not included in these tests.

## Still required before selling

- Choose and configure the public customer account/onboarding model and external review access.
- Connect real Stripe Checkout, Customer Portal and idempotent signed webhooks; enforce entitlements and plan limits on the server.
- Team workspaces, invitations, roles, assignments, reminders and branding features are not implemented.
- Add operational rate limits, quotas, monitoring, backup/recovery, export/deletion and account-management processes before public launch.
- Complete the legal/privacy/support information, including the new stored project and client data, and reconcile marketing promises with delivered functionality.
- Run browser and device acceptance tests and a payment test-mode end-to-end check before charging customers.

There is no upload service; linked files remain with their original provider. Do not treat this alpha as the complete paid offering.
