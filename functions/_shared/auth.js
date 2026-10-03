import { error, sameOrigin } from "./http.js";

const COOKIE_NAME = "jiayi_cms_session";
const encoder = new TextEncoder();

const base64Url = (bytes) => {
  let binary = "";
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const hmac = async (value, secret) => {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return base64Url(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
};

const constantTimeEqual = (left = "", right = "") => {
  const size = Math.max(left.length, right.length);
  let mismatch = left.length ^ right.length;
  for (let index = 0; index < size; index += 1) {
    mismatch |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }
  return mismatch === 0;
};

const cookieValue = (request, name) => {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : "";
};

export const credentialsReady = (env) => Boolean(env?.CMS_ADMIN_PASSWORD && env?.CMS_SESSION_SECRET);

export const passwordMatches = (password, env) =>
  constantTimeEqual(String(password || ""), String(env?.CMS_ADMIN_PASSWORD || ""));

export const createSessionCookie = async (request, env) => {
  const expires = Date.now() + 12 * 60 * 60 * 1000;
  const nonce = crypto.randomUUID();
  const payload = `${expires}.${nonce}`;
  const signature = await hmac(payload, env.CMS_SESSION_SECRET);
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(`${payload}.${signature}`)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=43200${secure}`;
};

export const clearSessionCookie = (request) => {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
};

export const isAuthenticated = async (request, env) => {
  if (!credentialsReady(env)) return false;
  const token = cookieValue(request, COOKIE_NAME);
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  const [expires, nonce, signature] = parts;
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now() || !nonce) return false;
  const expected = await hmac(`${expires}.${nonce}`, env.CMS_SESSION_SECRET);
  return constantTimeEqual(signature, expected);
};

export const requireAdmin = async (context) => {
  if (!sameOrigin(context.request)) return error("请求来源验证失败，请刷新后台后重试。", 403);
  if (!(await isAuthenticated(context.request, context.env))) return error("登录已失效，请重新登录。", 401);
  return null;
};
