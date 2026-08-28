// Creates a Creem checkout session and redirects the browser to it.
// GET /api/checkout            -> full price
// GET /api/checkout?promo=CODE -> applies a Creem discount code (create codes in the Creem dashboard)

export async function GET(request) {
  const apiKey = process.env.CREEM_API_KEY;
  const productId = process.env.CREEM_PRODUCT_ID;
  const testMode = process.env.CREEM_TEST_MODE === "true";

  const url = new URL(request.url);
  const siteUrl = process.env.SITE_URL || url.origin;
  const promo = url.searchParams.get("promo") || undefined;

  if (!apiKey || !productId) {
    return new Response(
      "Checkout is not configured yet. Missing CREEM_API_KEY or CREEM_PRODUCT_ID.",
      { status: 500 }
    );
  }

  const base = testMode ? "https://test-api.creem.io" : "https://api.creem.io";
  const body = { product_id: productId, success_url: `${siteUrl}/booking.html` };
  if (promo) body.discount_code = promo;

  try {
    const resp = await fetch(`${base}/v1/checkouts`, {
      method: "POST",
      headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Creem checkout creation failed:", resp.status, text);
      return new Response("Could not start checkout. Please try again in a moment.", { status: 502 });
    }

    const data = await resp.json();
    if (!data.checkout_url) {
      console.error("Creem response missing checkout_url:", data);
      return new Response("Could not start checkout. Please try again in a moment.", { status: 502 });
    }

    return Response.redirect(data.checkout_url, 302);
  } catch (err) {
    console.error("Checkout error:", err);
    return new Response("Something went wrong starting checkout.", { status: 500 });
  }
}
