# Get Your Time Back — website + paygate

Plain static site (no framework, no build step) + two Vercel serverless functions for
Creem checkout and webhook handling. Deliberately minimal — no checkout form is built
here, Creem's own hosted checkout page does that part.

## Structure

```
index.html       the site (ported from the Claude artifact, all three tabs)
booking.html     where buyers land right after a successful payment
api/checkout.js  GET  /api/checkout          -> creates a Creem checkout session, redirects
                 GET  /api/checkout?promo=X  -> same, with a Creem discount code applied
api/webhook.js   POST /api/webhook           -> Creem calls this on payment events
```

## One-time setup

1. **Environment variables** — in the Vercel dashboard, Project → Settings → Environment
   Variables, add everything listed in `.env.example`. Get the values from your Creem
   dashboard (API key, the $99 product's ID, and the webhook's signing secret).

2. **Webhook URL** — in the Creem dashboard, Developers → Webhooks → Add webhook, set the
   URL to `https://<your-domain>/api/webhook`. Creem will show you the signing secret at
   that point — that's the `CREEM_WEBHOOK_SECRET` value from step 1.

3. **Discount codes** — create these directly in the Creem dashboard (percentage or fixed
   amount, with optional expiry/usage limits). To send someone a discounted link, share
   `https://<your-domain>/api/checkout?promo=THECODE` — no code changes needed here for a
   new discount code, it's all Creem-side configuration.

4. **Booking widget** — `booking.html` currently has a placeholder where a Calendly or
   Cal.com embed should go. Drop in the real embed once you've picked a scheduler.

## Deploying

```
vercel --prod
```

or connect this folder as a Vercel project via the dashboard/GitHub and it auto-deploys
on push. No build command needed — it's static files + `/api` functions, zero-config.

## Testing a real payment end to end

Per the project's own doctrine: pay yourself $99 with a real card through the live
checkout, confirm the webhook fires (check Vercel's function logs), then refund yourself
through the Creem dashboard.
