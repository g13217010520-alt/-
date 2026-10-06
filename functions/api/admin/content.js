import { requireAdmin } from "../../_shared/auth.js";
import { normalizeContent } from "../../_shared/content.js";
import { error, json, requireBindings, safeJson } from "../../_shared/http.js";

export async function onRequestGet(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const missing = requireBindings(context.env, ["CMS_CONTENT"]);
  if (missing) return error(missing, 503);
  const content = await context.env.CMS_CONTENT.get("site-content", "json");
  return json({ ok: true, content: content || null });
}

export async function onRequestPut(context) {
  const denied = await requireAdmin(context);
  if (denied) return denied;
  const missing = requireBindings(context.env, ["CMS_CONTENT"]);
  if (missing) return error(missing, 503);
  const body = await safeJson(context.request);
  const content = normalizeContent(body?.content);
  if (!content) return error("内容格式不正确，至少需要一个有效的产品数组。", 422);
  const serialized = JSON.stringify(content);
  if (new TextEncoder().encode(serialized).byteLength > 10 * 1024 * 1024) {
    return error("内容数据过大；图片和视频请上传到媒体库，不要保存为 Base64。", 413);
  }
  await context.env.CMS_CONTENT.put("site-content", serialized);
  return json({ ok: true, updatedAt: content.updatedAt });
}
