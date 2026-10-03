import { credentialsReady, isAuthenticated } from "../../_shared/auth.js";
import { json } from "../../_shared/http.js";

export async function onRequestGet({ request, env }) {
  return json({
    ok: true,
    configured: credentialsReady(env),
    authenticated: await isAuthenticated(request, env),
    storage: { content: Boolean(env.CMS_CONTENT), media: Boolean(env.CMS_MEDIA) },
  });
}
