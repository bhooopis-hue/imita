import { pricing } from '../../worker/pricing.mjs';

// Cloudflare Pages Functions entrypoint. Country detection comes from the
// trusted request.cf metadata added by Cloudflare at the edge.
export function onRequestGet(context) {
  return pricing(context.request);
}

export function onRequest() {
  return Response.json(
    { error: 'method-not-allowed' },
    { status: 405, headers: { Allow: 'GET' } },
  );
}
