# Entrega

Multilingual sales funnel (Spanish default, English and Brazilian Portuguese). Static website with monthly/annual plans, demo checkout, optional Team upgrade, demo confirmation, FAQ and preliminary legal/contact pages.

## Status
No real payments, accounts, subscription provisioning, emails or SaaS backend. The banner and checkout explicitly disclose this. No card input is collected. Checkout fields are not transmitted or persisted by the application. Amounts remain BRL in all languages.

## Commercial launch prerequisites
- Validate the brand, features, plan limits and prices. Current monthly prices: Professional BRL 29 and Team BRL 79; annual BRL 290 and BRL 790.
- Implement and deliver the actual product before advertising it as available.
- Supply seller identity, fiscal information, address and verified support contact. Review and complete terms, privacy and refund policy for the business and target markets.
- Connect the owner's Stripe account using server-side secrets, recurring Stripe Prices and hosted Stripe Checkout. Do not put secret keys in client code.
- Create checkout sessions on the server from an allowlisted plan/interval; never accept a client-provided amount. Select the final plan before starting Stripe Checkout.
- Verify signed Stripe webhooks and process events idempotently. Provision access only after authoritative payment/subscription events; the return URL is not proof of payment.
- Add authentication and Stripe Customer Portal for cancellation and subscription management. Decide upgrade proration and display it before consent.
- Replace the demo flow and disclosures only once these capabilities work and the offering is ready for sale.

Routes: /, /checkout, /upgrade, /confirmation, /terms, /privacy, /refunds, /contact.

Source: dist/app.js contains translated copy and UI logic; dist/style.css contains responsive styles. HTML entrypoints are duplicated for static route handling. Language and pricing selections are in URL parameters. Google Fonts is optional and falls back to sans-serif.

## Run locally

No build or dependency installation is required. Run `python -m http.server 8080 --directory dist` from the repository root, then open http://localhost:8080.

## Hosting

Serve `dist/` as the website root. This repository is a source copy; updates here do not automatically publish to the existing ChatGPT Site. Stripe payments remain in demo mode.
