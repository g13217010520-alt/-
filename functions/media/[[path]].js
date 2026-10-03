import { error } from "../_shared/http.js";

export async function onRequestGet({ params, env, request }) {
  if (!env.CMS_MEDIA) return error("CMS media storage is not configured.", 503);
  const segments = Array.isArray(params.path) ? params.path : [params.path];
  const key = segments.filter(Boolean).map(decodeURIComponent).join("/");
  if (!key) return error("Media not found.", 404);
  const object = await env.CMS_MEDIA.get(key, { onlyIf: request.headers });
  if (!object) return error("Media not found.", 404);
  if (!object.body) return new Response(null, { status: 304 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", object.httpMetadata?.cacheControl || "public, max-age=31536000, immutable");
  headers.set("x-content-type-options", "nosniff");
  return new Response(object.body, { headers });
}
