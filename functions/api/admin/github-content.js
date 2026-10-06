import { requireAdmin } from "../../_shared/auth.js";
import { normalizeContent } from "../../_shared/content.js";
import { error, json, safeJson } from "../../_shared/http.js";

const DEFAULT_REPOSITORY = "g13217010520-alt/-";
const DEFAULT_BRANCH = "main";
const DEFAULT_PATH = "dist/default-content.json";

const repositoryConfig = (env) => {
  const repository = String(env.GITHUB_CONTENT_REPO || DEFAULT_REPOSITORY).trim();
  const slash = repository.indexOf("/");
  if (slash < 1 || slash === repository.length - 1) return null;
  return {
    owner: repository.slice(0, slash),
    repo: repository.slice(slash + 1),
    branch: String(env.GITHUB_CONTENT_BRANCH || DEFAULT_BRANCH).trim(),
    path: String(env.GITHUB_CONTENT_PATH || DEFAULT_PATH).replace(/^\/+/, ""),
  };
};

const githubHeaders = (token) => ({
  accept: "application/vnd.github+json",
  authorization: `Bearer ${token}`,
  "content-type": "application/json",
  "user-agent": "jiayi-power-visual-cms",
  "x-github-api-version": "2022-11-28",
});

const githubUrl = ({ owner, repo, path }) =>
  `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;

const decodeBase64Utf8 = (value = "") => {
  const binary = atob(String(value).replace(/\s/g, ""));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

const encodeBase64Utf8 = (value = "") => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (let index = 0; index < bytes.length; index += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(index, index + 0x8000));
  }
  return btoa(binary);
};

const githubError = async (response, fallback) => {
  const payload = await response.json().catch(() => null);
  return payload?.message || fallback;
};

export async function onRequestGet(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const token = context.env.GITHUB_CONTENT_TOKEN;
  const config = repositoryConfig(context.env);
  if (!token) return json({ ok: true, configured: false, content: null, sha: null });
  if (!config) return error("GitHub 仓库配置不正确。", 503);

  const response = await fetch(`${githubUrl(config)}?ref=${encodeURIComponent(config.branch)}`, {
    headers: githubHeaders(token),
  });
  if (!response.ok) return error(await githubError(response, "无法读取 GitHub 内容。"), response.status);
  const file = await response.json();
  if (file.type !== "file" || !file.content || !file.sha) return error("GitHub 内容文件格式不正确。", 502);
  try {
    return json({
      ok: true,
      configured: true,
      content: JSON.parse(decodeBase64Utf8(file.content)),
      sha: file.sha,
      source: { repository: `${config.owner}/${config.repo}`, branch: config.branch, path: config.path },
    });
  } catch {
    return error("GitHub 内容文件不是有效的 JSON。", 502);
  }
}

export async function onRequestPut(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const token = context.env.GITHUB_CONTENT_TOKEN;
  const config = repositoryConfig(context.env);
  if (!token) return error("尚未配置 GitHub 内容写入密钥。", 503);
  if (!config) return error("GitHub 仓库配置不正确。", 503);

  const body = await safeJson(context.request);
  const content = normalizeContent(body?.content);
  if (!content) return error("内容格式不正确，至少需要一个有效的产品数组。", 422);
  if (!body?.sha) return error("内容版本信息缺失，请刷新后台后重试。", 409);
  const serialized = `${JSON.stringify(content, null, 2)}\n`;
  if (new TextEncoder().encode(serialized).byteLength > 10 * 1024 * 1024) {
    return error("内容数据过大；图片和视频请通过高级内容管理上传。", 413);
  }

  const response = await fetch(githubUrl(config), {
    method: "PUT",
    headers: githubHeaders(token),
    body: JSON.stringify({
      message: `后台更新：${config.path}`,
      content: encodeBase64Utf8(serialized),
      sha: body.sha,
      branch: config.branch,
    }),
  });
  if (!response.ok) {
    const message = response.status === 409
      ? "GitHub 内容已被其他后台修改，请刷新页面后重新编辑。"
      : await githubError(response, "GitHub 保存失败。");
    return error(message, response.status);
  }
  const result = await response.json();
  return json({
    ok: true,
    content,
    sha: result.content?.sha || null,
    commitUrl: result.commit?.html_url || null,
    updatedAt: content.updatedAt,
  });
}
