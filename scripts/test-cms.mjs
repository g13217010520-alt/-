import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { onRequestGet as getPublicContent } from "../functions/api/content.js";
import { onRequestPost as login } from "../functions/api/admin/login.js";
import { onRequestGet as getSession } from "../functions/api/admin/session.js";
import { onRequestGet as getAdminContent, onRequestPut as putAdminContent } from "../functions/api/admin/content.js";
import { onRequestGet as getGitHubContent, onRequestPut as putGitHubContent } from "../functions/api/admin/github-content.js";
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
assert.equal(saved.content.intro.title, "动力，藏于");
assert.equal(saved.content.intro.backgroundImage, "assets/intro-cover.webp");

const missingGitHub = await getGitHubContent({ request: request("/api/admin/github-content", { headers: { cookie } }), env });
assert.equal((await missingGitHub.json()).configured, false);

const nativeFetch = globalThis.fetch;
let githubContent = structuredClone(content);
let githubSha = "content-sha-1";
globalThis.fetch = async (_url, init = {}) => {
  if (!init.method || init.method === "GET") {
    return new Response(JSON.stringify({ type: "file", sha: githubSha, content: Buffer.from(JSON.stringify(githubContent)).toString("base64") }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  const payload = JSON.parse(init.body);
  assert.equal(payload.sha, githubSha);
  githubContent = JSON.parse(Buffer.from(payload.content, "base64").toString("utf8"));
  githubSha = "content-sha-2";
  return new Response(JSON.stringify({ content: { sha: githubSha }, commit: { html_url: "https://github.com/example/commit/2" } }), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

const githubEnv = { ...env, GITHUB_CONTENT_TOKEN: "test-token" };
const githubRead = await getGitHubContent({ request: request("/api/admin/github-content", { headers: { cookie } }), env: githubEnv });
const githubReadPayload = await githubRead.json();
assert.equal(githubReadPayload.content.intro.title, "动力，藏于");
assert.equal(githubReadPayload.sha, "content-sha-1");

githubReadPayload.content.intro.title = "新的入口标题";
const githubWrite = await putGitHubContent({
  request: request("/api/admin/github-content", {
    method: "PUT",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ content: githubReadPayload.content, sha: githubReadPayload.sha }),
  }),
  env: githubEnv,
});
const githubWritePayload = await githubWrite.json();
assert.equal(githubWrite.status, 200);
assert.equal(githubWritePayload.sha, "content-sha-2");
assert.equal(githubContent.intro.title, "新的入口标题");
globalThis.fetch = nativeFetch;

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
for (const marker of ["data-page-form", "data-gallery-upload", "data-admin-preview", "页面与研发能力"]) {
  assert.ok(adminHtml.includes(marker), `admin.html should include ${marker}`);
}
const visualAdminHtml = await readFile(new URL("../dist/visual-admin.html", import.meta.url), "utf8");
assert.ok(visualAdminHtml.includes("location.replace(`admin.html"), "visual-admin.html should redirect to the text-first admin");

console.log("CMS smoke tests passed: authentication, GitHub persistence, uploads, defaults, and text-first admin structure.");
