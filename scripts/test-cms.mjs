import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onRequestGet as getPublicContent } from "../functions/api/content.js";
import { onRequestPost as login } from "../functions/api/admin/login.js";
import { onRequestGet as getSession } from "../functions/api/admin/session.js";
import { onRequestGet as getAdminContent, onRequestPut as putAdminContent } from "../functions/api/admin/content.js";
import { onRequestDelete as deleteMedia, onRequestGet as getMedia, onRequestPost as uploadMedia } from "../functions/api/admin/media.js";

class MemoryKV {
  values = new Map();
  async get(key, type) {
    const value = this.values.get(key) ?? null;
    return type === "json" && value ? JSON.parse(value) : value;
  }
  async put(key, value) { this.values.set(key, value); }
}

class MemoryR2 {
  values = new Map();
  async put(key, value, options) {
    this.values.set(key, { key, size: Number(value?.size) || 8, uploaded: new Date(), httpMetadata: options.httpMetadata, customMetadata: options.customMetadata });
  }
  async list() { return { objects: [...this.values.values()], truncated: false }; }
  async delete(key) { this.values.delete(key); }
}

const CMS_CONTENT = new MemoryKV();
const env = { CMS_CONTENT, CMS_MEDIA: new MemoryR2(), CMS_ADMIN_PASSWORD: "test-only-password", CMS_SESSION_SECRET: "test-only-session-secret-with-32-chars" };
const request = (path, init = {}) => new Request(`https://example.com${path}`, { ...init, headers: { origin: "https://example.com", ...(init.headers || {}) } });

const empty = await getPublicContent({ env: {} });
assert.equal(empty.status, 200);
assert.equal((await empty.json()).configured, false);

const badLogin = await login({ request: request("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: "wrong" }) }), env });
assert.equal(badLogin.status, 401);

const loginResponse = await login({ request: request("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: env.CMS_ADMIN_PASSWORD }) }), env });
assert.equal(loginResponse.status, 200);
const cookie = loginResponse.headers.get("set-cookie").split(";")[0];

const sessionResponse = await getSession({ request: request("/api/admin/session", { headers: { cookie } }), env });
assert.equal((await sessionResponse.json()).authenticated, true);

const content = JSON.parse(await readFile(new URL("../dist/default-content.json", import.meta.url), "utf8"));
const saveResponse = await putAdminContent({ request: request("/api/admin/content", { method: "PUT", headers: { cookie, "content-type": "application/json" }, body: JSON.stringify({ content }) }), env });
assert.equal(saveResponse.status, 200);

const readResponse = await getAdminContent({ request: request("/api/admin/content", { headers: { cookie } }), env });
const saved = await readResponse.json();
assert.equal(saved.content.products.length, 11);
assert.equal(saved.content.featuredProductIds.length, 3);

const mediaForm = new FormData();
mediaForm.append("file", new File([new Uint8Array([137, 80, 78, 71])], "test-image.png", { type: "image/png" }));
const uploadResponse = await uploadMedia({ request: request("/api/admin/media", { method: "POST", headers: { cookie }, body: mediaForm }), env });
assert.equal(uploadResponse.status, 201);
const uploaded = (await uploadResponse.json()).item;
assert.match(uploaded.url, /^\/media\/images\//);

const listResponse = await getMedia({ request: request("/api/admin/media", { headers: { cookie } }), env });
assert.equal((await listResponse.json()).items.length, 1);
const deleteResponse = await deleteMedia({ request: request(`/api/admin/media?key=${encodeURIComponent(uploaded.key)}`, { method: "DELETE", headers: { cookie } }), env });
assert.equal(deleteResponse.status, 200);

const adminHtml = await readFile(new URL("../dist/admin.html", import.meta.url), "utf8");
for (const marker of ["data-product-list", "data-featured-editor", "data-gallery-list", "data-media-list", "data-contact-form"]) {
  assert.ok(adminHtml.includes(marker), `admin.html should include ${marker}`);
}

console.log("CMS smoke tests passed: authentication, session, content persistence, defaults, and admin structure.");
