import { requireAdmin } from "../../_shared/auth.js";
import { error, json, requireBindings } from "../../_shared/http.js";

const allowedTypes = /^(image|video)\//;
const cleanName = (name = "file") => name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "").slice(-120) || "file";

export async function onRequestGet(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const missing = requireBindings(context.env, ["CMS_MEDIA"]);
  if (missing) return error(missing, 503);
  const cursor = new URL(context.request.url).searchParams.get("cursor") || undefined;
  const list = await context.env.CMS_MEDIA.list({ limit: 200, cursor, include: ["httpMetadata", "customMetadata"] });
  return json({
    ok: true,
    items: list.objects.map((item) => ({
      key: item.key,
      url: `/media/${item.key.split("/").map(encodeURIComponent).join("/")}`,
      size: item.size,
      uploaded: item.uploaded,
      type: item.httpMetadata?.contentType || item.customMetadata?.contentType || "application/octet-stream",
    })),
    truncated: list.truncated,
    cursor: list.truncated ? list.cursor : null,
  });
}

export async function onRequestPost(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const missing = requireBindings(context.env, ["CMS_MEDIA"]);
  if (missing) return error(missing, 503);
  const form = await context.request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return error("请选择需要上传的图片或视频。", 422);
  if (!allowedTypes.test(file.type)) return error("仅支持图片和视频文件。", 415);
  if (file.size > 50 * 1024 * 1024) return error("单个文件不能超过 50 MB。", 413);
  const folder = file.type.startsWith("video/") ? "videos" : "images";
  const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${cleanName(file.name)}`;
  await context.env.CMS_MEDIA.put(key, file.stream(), {
    httpMetadata: { contentType: file.type, cacheControl: "public, max-age=31536000, immutable" },
    customMetadata: { originalName: file.name, contentType: file.type },
  });
  return json({ ok: true, item: { key, url: `/media/${key}`, size: file.size, type: file.type } }, { status: 201 });
}

export async function onRequestDelete(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const missing = requireBindings(context.env, ["CMS_MEDIA"]);
  if (missing) return error(missing, 503);
  const key = new URL(context.request.url).searchParams.get("key");
  if (!key || !/^(images|videos)\//.test(key)) return error("媒体文件标识无效。", 422);
  await context.env.CMS_MEDIA.delete(key);
  return json({ ok: true });
}
