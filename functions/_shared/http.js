export const json = (data, init = {}) => {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return new Response(JSON.stringify(data), { ...init, headers });
};

export const error = (message, status = 400, details) =>
  json({ ok: false, error: message, ...(details ? { details } : {}) }, { status });

export const sameOrigin = (request) => {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  return origin === new URL(request.url).origin;
};

export const safeJson = async (request) => {
  try {
    return await request.json();
  } catch {
    return null;
  }
};

export const requireBindings = (env, bindings) => {
  const missing = bindings.filter((name) => !env?.[name]);
  return missing.length ? `Cloudflare binding missing: ${missing.join(", ")}` : "";
};
