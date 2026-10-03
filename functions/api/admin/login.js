import { createSessionCookie, credentialsReady, passwordMatches } from "../../_shared/auth.js";
import { error, json, safeJson, sameOrigin } from "../../_shared/http.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return error("请求来源验证失败。", 403);
  if (!credentialsReady(env)) return error("后台登录密钥尚未在 Cloudflare 中配置。", 503);
  const body = await safeJson(request);
  if (!body || !passwordMatches(body.password, env)) return error("密码不正确。", 401);

  return json(
    { ok: true },
    { headers: { "set-cookie": await createSessionCookie(request, env) } },
  );
}
