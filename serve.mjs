import { createServer } from "node:http";
import { execFile } from "node:child_process";
import { access, mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { basename, dirname, extname, join, normalize, resolve } from "node:path";
import { promisify } from "node:util";
import { normalizeContent } from "./functions/_shared/content.js";

const workspace = process.cwd();
const root = join(workspace, "dist");
const port = Number(process.env.PORT || 4173);
const execFileAsync = promisify(execFile);
const contentPath = join(root, "default-content.json");
const uploadsPath = join(root, "assets", "uploads");
const gitRuntimeBin = resolve(dirname(process.execPath), "..", "..", "native", "git", "mingw64", "bin");
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

const sendJson = (response, status, payload) => {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  response.end(JSON.stringify(payload));
};

const readJson = async (request) => {
  let raw = "";
  for await (const chunk of request) {
    raw += chunk;
    if (raw.length > 10 * 1024 * 1024) throw new Error("内容数据过大。");
  }
  return JSON.parse(raw || "null");
};

const readBuffer = async (request) => {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 50 * 1024 * 1024) throw new Error("单个文件不能超过 50 MB。");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};

const safeUploadName = (value = "upload") => {
  const raw = basename(String(value)).normalize("NFKC");
  const extension = extname(raw).toLowerCase();
  const allowed = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg", ".mp4", ".webm"]);
  if (!allowed.has(extension)) throw new Error("仅支持 JPG、PNG、WebP、GIF、SVG、MP4 或 WebM 文件。");
  const stem = basename(raw, extension).replace(/[^a-zA-Z0-9\u4e00-\u9fff_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "media";
  return `${Date.now()}-${stem}${extension}`;
};

const localMedia = async () => {
  await mkdir(uploadsPath, { recursive: true });
  const entries = await readdir(uploadsPath, { withFileTypes: true });
  const items = await Promise.all(entries.filter((entry) => entry.isFile()).map(async (entry) => {
    const info = await stat(join(uploadsPath, entry.name));
    const extension = extname(entry.name).toLowerCase();
    const type = [".mp4", ".webm"].includes(extension) ? `video/${extension.slice(1)}` : `image/${extension === ".jpg" ? "jpeg" : extension.slice(1)}`;
    return { key: `uploads/${entry.name}`, url: `assets/uploads/${entry.name}`, type, size: info.size, uploaded: info.mtime.toISOString() };
  }));
  return items.sort((left, right) => String(right.uploaded).localeCompare(String(left.uploaded)));
};

const localRequestAllowed = (request) => {
  const origin = request.headers.origin;
  return !origin || origin === `http://${request.headers.host}`;
};

let gitEnvironmentPromise;
const gitEnvironment = async () => {
  if (!gitEnvironmentPromise) {
    gitEnvironmentPromise = access(gitRuntimeBin)
      .then(() => ({ ...process.env, GIT_EXEC_PATH: gitRuntimeBin, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "Never" }))
      .catch(() => ({ ...process.env, GIT_TERMINAL_PROMPT: "0", GCM_INTERACTIVE: "Never" }));
  }
  return gitEnvironmentPromise;
};

const git = async (...args) => {
  const { stdout = "" } = await execFileAsync("git", ["-c", "http.sslBackend=openssl", ...args], {
    cwd: workspace,
    env: await gitEnvironment(),
    windowsHide: true,
    timeout: 120000,
  });
  return stdout.trim();
};

const publishLocalContent = async (content) => {
  await git("fetch", "origin", "main");
  const [head, remoteHead] = await Promise.all([git("rev-parse", "HEAD"), git("rev-parse", "origin/main")]);
  if (head !== remoteHead) {
    const failure = new Error("GitHub 已有新版本，本机项目需要先同步后才能发布，以免覆盖线上修改。");
    failure.status = 409;
    throw failure;
  }

  const current = JSON.parse(await readFile(contentPath, "utf8"));
  const comparable = (value) => {
    const copy = structuredClone(value);
    delete copy.updatedAt;
    return JSON.stringify(copy);
  };
  const contentChanged = comparable(current) !== comparable(content);
  if (contentChanged) {
    const temporaryPath = `${contentPath}.${process.pid}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(content, null, 2)}\n`, "utf8");
    await rename(temporaryPath, contentPath);
  }
  await mkdir(uploadsPath, { recursive: true });
  await git("add", "--", "dist/default-content.json", "dist/assets/uploads");
  const changed = await git("diff", "--cached", "--name-only", "--", "dist/default-content.json", "dist/assets/uploads");
  if (!changed) return { commit: head, changed: false, content: current };
  await git("commit", "-m", "后台发布：网站内容", "--", "dist/default-content.json", "dist/assets/uploads");
  const commit = await git("rev-parse", "HEAD");
  await git("push", "origin", "HEAD:main");
  return { commit, changed: true, content };
};

createServer(async (request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
    if (pathname === "/api/local/status" && request.method === "GET") {
      return sendJson(response, 200, { ok: true, mode: "local-git", repository: "g13217010520-alt/-", branch: "main" });
    }
    if (pathname === "/api/local/media" && request.method === "GET") {
      return sendJson(response, 200, { ok: true, items: await localMedia() });
    }
    if (pathname === "/api/local/media" && request.method === "DELETE") {
      if (!localRequestAllowed(request)) return sendJson(response, 403, { ok: false, error: "请求来源验证失败。" });
      const key = new URL(request.url, "http://localhost").searchParams.get("key") || "";
      if (!/^uploads\/[^/]+$/.test(key)) return sendJson(response, 422, { ok: false, error: "媒体文件标识不正确。" });
      await unlink(join(uploadsPath, basename(key)));
      return sendJson(response, 200, { ok: true });
    }
    if (pathname === "/api/local/upload" && request.method === "POST") {
      if (!localRequestAllowed(request)) return sendJson(response, 403, { ok: false, error: "请求来源验证失败。" });
      const requestedName = new URL(request.url, "http://localhost").searchParams.get("name") || "upload";
      const filename = safeUploadName(requestedName);
      const data = await readBuffer(request);
      if (!data.length) return sendJson(response, 422, { ok: false, error: "请选择需要上传的文件。" });
      await mkdir(uploadsPath, { recursive: true });
      await writeFile(join(uploadsPath, filename), data);
      const type = String(request.headers["content-type"] || "application/octet-stream").split(";")[0];
      return sendJson(response, 200, { ok: true, item: { key: `uploads/${filename}`, url: `assets/uploads/${filename}`, type, size: data.length, uploaded: new Date().toISOString() } });
    }
    if (pathname === "/api/local/publish" && request.method === "POST") {
      if (!localRequestAllowed(request)) return sendJson(response, 403, { ok: false, error: "请求来源验证失败。" });
      const content = normalizeContent((await readJson(request))?.content);
      if (!content) return sendJson(response, 422, { ok: false, error: "内容格式不正确。" });
      try {
        const result = await publishLocalContent(content);
        return sendJson(response, 200, { ok: true, ...result });
      } catch (error) {
        return sendJson(response, error.status || 502, { ok: false, error: error.stderr?.trim() || error.message || "发布失败。" });
      }
    }
    const relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
    let filePath = normalize(join(root, relative));
    if (!filePath.startsWith(root)) throw new Error("Invalid path");
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    const body = await readFile(filePath);
    response.writeHead(200, { "Content-Type": types[extname(filePath)] || "application/octet-stream" });
    response.end(body);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("404 · Page not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`Local: http://127.0.0.1:${port}`);
});
