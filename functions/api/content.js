import { json } from "../_shared/http.js";

export async function onRequestGet({ env }) {
  if (!env.CMS_CONTENT) {
    return json({ ok: true, configured: false, content: null });
  }

  const content = await env.CMS_CONTENT.get("site-content", "json");
  return json(
    { ok: true, configured: true, content: content || null },
    { headers: { "cache-control": "public, max-age=30, stale-while-revalidate=120" } },
  );
}
