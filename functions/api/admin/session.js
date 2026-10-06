import { credentialsReady, isAuthenticated } from "../../_shared/auth.js";
import { json } from "../../_shared/http.js";

export async function onRequestGet({ request, env }) {
  return json({
    ok: true,
    configured: credentialsReady(env),
    authenticated: await isAuthenticated(request, env),
    storage: {
      github: Boolean(env.GITHUB_CONTENT_TOKEN),
      legacyContent: Boolean(env.CMS_CONTENT),
      legacyMedia: Boolean(env.CMS_MEDIA),
    },
  });
}
