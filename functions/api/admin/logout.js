import { clearSessionCookie } from "../../_shared/auth.js";
import { json } from "../../_shared/http.js";

export function onRequestPost({ request }) {
  return json({ ok: true }, { headers: { "set-cookie": clearSessionCookie(request) } });
}
