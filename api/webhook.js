// Creem webhook receiver. Configure this URL in the Creem dashboard as:
//   https://<your-domain>/api/webhook
// Verifies the `creem-signature` header (HMAC-SHA256 of the raw body, signed
// with CREEM_WEBHOOK_SECRET) before trusting anything in the payload.

import crypto from "node:crypto";

function isValidSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signatureHeader, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export async function POST(request) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    console.error("CREEM_WEBHOOK_SECRET is not set.");
    return new Response("Webhook not configured.", { status: 500 });
  }

  const rawBody = await request.text(); // raw text, read before any JSON parsing
  const signature = request.headers.get("creem-signature");

  if (!isValidSignature(rawBody, signature, secret)) {
    console.error("Invalid Creem webhook signature.");
    return new Response("Invalid signature.", { status: 401 });
  }

  let event;
  try {
    event = JSON.parse(rawBody);
  } catch (err) {
    return new Response("Invalid JSON.", { status: 400 });
  }

  try {
    if (event.eventType === "checkout.completed") {
      const email = event.object?.customer?.email;
      const productId = event.object?.product?.id;
      const checkoutId = event.object?.id;

      console.log("Payment confirmed:", { email, productId, checkoutId });

      // TODO once the intake/booking pipeline is wired up:
      //  - send the confirmation + intake form email (see 01-intake/INTAKE-FORM.md)
      //  - record the paid seat somewhere durable (a sheet, a DB row, etc.)
      // The buyer's browser is separately redirected to /booking.html via
      // success_url in api/checkout.js — this webhook is the server-side
      // record of truth, independent of whether they land on that page.
    }
  } catch (err) {
    console.error("Error handling Creem webhook event:", err);
  }

  return new Response("ok", { status: 200 });
}
