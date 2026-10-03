const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = (value) => structuredClone(value);
const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
const escapeAttr = escapeHtml;
const slugify = (value = "product") => String(value).trim().toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-").replace(/^-|-$/g, "") || `product-${Date.now()}`;
const lines = (value = "") => String(value).split("\n").map((line) => line.trim()).filter(Boolean);
const pairs = (value = "") => lines(value).map((line) => {
  const separator = line.indexOf("|");
  return separator < 0 ? [line, ""] : [line.slice(0, separator).trim(), line.slice(separator + 1).trim()];
});
const pairText = (value = []) => (Array.isArray(value) ? value : []).map((row) => Array.isArray(row) ? `${row[0] || ""} | ${row[1] || ""}` : String(row)).join("\n");
const lineText = (value = []) => (Array.isArray(value) ? value : []).join("\n");
const formatBytes = (bytes = 0) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

const state = {
  content: null,
  dirty: false,
  activeGallery: "exhibition",
  media: [],
  currentPanel: "overview",
  saving: false,
};

const elements = {
  login: $("[data-login-view]"),
  shell: $("[data-admin-shell]"),
  toast: $("[data-toast]"),
  saveState: $("[data-save-state]"),
  confirm: $("[data-confirm-dialog]"),
};

const api = async (url, options = {}) => {
  const response = await fetch(url, { credentials: "same-origin", ...options });
  const data = await response.json().catch(() => ({ ok: false, error: `请求失败 (${response.status})` }));
  if (!response.ok || data.ok === false) {
    const failure = new Error(data.error || `请求失败 (${response.status})`);
    failure.status = response.status;
    throw failure;
  }
  return data;
};

const toast = (message, error = false) => {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", error);
  elements.toast.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3600);
};

const setDirty = (dirty = true) => {
  state.dirty = dirty;
  elements.saveState.textContent = dirty ? "有未发布的修改" : "内容已同步";
  elements.saveState.classList.toggle("is-dirty", dirty);
};

const confirmAction = (title, copy) => new Promise((resolve) => {
  $("[data-confirm-title]").textContent = title;
  $("[data-confirm-copy]").textContent = copy;
  elements.confirm.showModal();
  elements.confirm.addEventListener("close", () => resolve(elements.confirm.returnValue === "confirm"), { once: true });
});

const fetchDefaults = async () => {
  const response = await fetch("default-content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("无法载入网站内置内容。");
  return response.json();
};

const loadContent = async () => {
  const [remote, defaults] = await Promise.all([api("/api/admin/content"), fetchDefaults()]);
  state.content = clone(remote.content || defaults);
  state.content.products ||= [];
  state.content.galleries ||= defaults.galleries || {};
  state.content.featuredProductIds ||= [];
  state.content.contact ||= defaults.contact || {};
  $("[data-bootstrap-notice]").hidden = Boolean(remote.content);
  setDirty(false);
  renderAll();
};

const showLogin = (message = "") => {
  elements.shell.hidden = true;
  elements.login.hidden = false;
  $("[data-login-message]").textContent = message;
  $("[data-login-form] input")?.focus();
};

const showAdmin = () => {
  elements.login.hidden = true;
  elements.shell.hidden = false;
};

const boot = async () => {
  try {
    const session = await api("/api/admin/session");
    const storage = session.storage || {};
    $("[data-storage-state]").textContent = storage.content && storage.media ? "Cloudflare 存储已连接" : "部分存储尚未配置";
    if (!session.configured) return showLogin("Cloudflare 中尚未配置 CMS_ADMIN_PASSWORD 和 CMS_SESSION_SECRET。请先完成部署说明中的设置。");
    if (!session.authenticated) return showLogin();
    showAdmin();
    await loadContent();
  } catch (error) {
    showLogin(error.message);
  }
};

const statCard = (label, value) => `<article class="stat-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></article>`;
const renderStats = () => {
  const galleryCount = Object.values(state.content.galleries || {}).reduce((sum, group) => sum + (group.items?.length || 0), 0);
  $("[data-stats]").innerHTML = [
    statCard("产品分类", state.content.products.length),
    statCard("精选产品", state.content.featuredProductIds.length),
    statCard("企业照片 / 视频", galleryCount),
    statCard("具体产品型号", state.content.products.reduce((sum, product) => sum + (product.series?.length || 0), 0)),
  ].join("");
};

const field = (label, path, value, options = {}) => {
  const classes = options.wide ? "span-2" : "";
  if (options.type === "textarea") return `<label class="${classes}">${escapeHtml(label)}<textarea data-field="${escapeAttr(path)}" placeholder="${escapeAttr(options.placeholder || "")}">${escapeHtml(value || "")}</textarea></label>`;
  if (options.type === "select") return `<label class="${classes}">${escapeHtml(label)}<select data-field="${escapeAttr(path)}">${options.options.map(([key, text]) => `<option value="${escapeAttr(key)}" ${key === value ? "selected" : ""}>${escapeHtml(text)}</option>`).join("")}</select></label>`;
  return `<label class="${classes}">${escapeHtml(label)}<input type="${options.type || "text"}" data-field="${escapeAttr(path)}" value="${escapeAttr(value || "")}" placeholder="${escapeAttr(options.placeholder || "")}" ${options.readonly ? "readonly" : ""} /></label>`;
};

const renderSeries = (product) => (product.series || []).map((item, index) => `
  <article class="series-editor" data-series-index="${index}">
    <div class="series-editor__top"><strong>${String(index + 1).padStart(2, "0")} · ${escapeHtml(item.name || "未命名型号")}</strong><div class="inline-actions">
      <button class="icon-button" type="button" data-action="series-up" title="上移">↑</button><button class="icon-button" type="button" data-action="series-down" title="下移">↓</button><button class="icon-button" type="button" data-action="series-delete" title="删除">×</button>
    </div></div>
    <div class="form-grid">
      ${field("型号", "model", item.model)}${field("型号名称", "name", item.name)}
      ${field("产品图片地址", "image", item.image, { wide: true })}
      ${field("产品概要", "description", item.description, { type: "textarea", wide: true })}
      ${field("参数摘要（每行一项）", "specsText", lineText(item.specs), { type: "textarea" })}
      ${field("核心参数（每行：名称 | 数值）", "parametersText", pairText(item.parameters), { type: "textarea" })}
      ${field("应用场景（每行一项）", "applicationsText", lineText(item.applications), { type: "textarea", wide: true })}
    </div>
  </article>
`).join("");

const renderProducts = () => {
  const container = $("[data-product-list]");
  container.innerHTML = state.content.products.map((product, index) => `
    <details class="product-editor" data-product-id="${escapeAttr(product.id)}">
      <summary>
        <span class="product-editor__handle">⋮⋮</span><img src="${escapeAttr(product.image)}" alt="" />
        <span><strong>${String(index + 1).padStart(2, "0")} · ${escapeHtml(product.name)}</strong><small>${escapeHtml(product.model || product.category)}</small></span>
        <small>${escapeHtml(product.cardLabel || product.category || "")}</small>
        <span class="product-editor__order"><button class="icon-button" type="button" data-action="product-up" title="上移">↑</button><button class="icon-button" type="button" data-action="product-down" title="下移">↓</button></span>
      </summary>
      <div class="product-editor__body">
        <div class="form-grid">
          ${field("产品 ID（链接标识）", "id", product.id, { readonly: true })}${field("产品标题", "name", product.name)}
          ${field("主型号", "model", product.model)}${field("年份", "year", product.year)}
          ${field("分类", "category", product.category)}${field("产品卡片标签", "cardLabel", product.cardLabel)}
          ${field("产品卡片版式", "cardLayout", product.cardLayout || "standard", { type: "select", options: [["standard", "标准"], ["wide", "横向宽卡"], ["full", "独立整行"]] })}${field("主图地址", "image", product.image)}
          ${field("产品概要", "summary", product.summary, { type: "textarea", wide: true })}
          ${field("亮点标题", "featureTitle", product.featureTitle, { type: "textarea" })}${field("产品文案", "description", product.description, { type: "textarea" })}
          ${field("核心参数（每行：名称 | 数值）", "specsText", pairText(product.specs), { type: "textarea" })}${field("应用场景（每行一项）", "usesText", lineText(product.uses), { type: "textarea" })}
        </div>
        <div class="subsection"><div class="subsection__heading"><h3>具体型号（${product.series?.length || 0}）</h3><button class="secondary-button" type="button" data-action="series-add">＋ 添加型号</button></div><div class="series-list">${renderSeries(product)}</div></div>
        <div class="subsection"><div class="inline-actions"><button class="secondary-button" type="button" data-action="product-duplicate">复制产品</button><button class="danger-button" type="button" data-action="product-delete">删除产品</button></div></div>
      </div>
    </details>
  `).join("");
};

const renderFeatured = () => {
  const selected = new Set(state.content.featuredProductIds);
  $("[data-featured-picker]").innerHTML = state.content.products.map((product) => `<label class="featured-toggle ${selected.has(product.id) ? "is-selected" : ""}"><input type="checkbox" data-featured-toggle="${escapeAttr(product.id)}" ${selected.has(product.id) ? "checked" : ""} /><span>${escapeHtml(product.name)}</span></label>`).join("");
  $("[data-featured-editor]").innerHTML = state.content.featuredProductIds.map((id, index) => {
    const product = state.content.products.find((item) => item.id === id);
    if (!product) return "";
    const featured = product.featured || {};
    return `<article class="featured-card-editor" data-featured-id="${escapeAttr(id)}"><header><h3>${String(index + 1).padStart(2, "0")} · ${escapeHtml(product.name)}</h3><div class="inline-actions"><button class="icon-button" type="button" data-action="featured-up">↑</button><button class="icon-button" type="button" data-action="featured-down">↓</button></div></header><div class="form-grid">
      ${field("场景图片地址", "image", featured.image || product.image, { wide: true })}${field("右上角信息", "meta", featured.meta || product.model)}
      ${field("绿色说明", "kicker", featured.kicker || product.summary)}${field("精选标题", "headline", featured.headline || product.featureTitle, { type: "textarea", wide: true })}
      ${field("标签（每行一项）", "featuresText", lineText(featured.features), { type: "textarea", wide: true })}
    </div></article>`;
  }).join("") || `<div class="notice-card"><strong>尚未选择精选产品</strong><p>请在上方勾选需要展示的产品。</p></div>`;
};

const galleryPreview = (item) => item.type === "video" ? `<video src="${escapeAttr(item.url)}" muted preload="metadata"></video>` : `<img src="${escapeAttr(item.url)}" alt="" loading="lazy" />`;
const renderGalleries = () => {
  const galleries = state.content.galleries || {};
  if (!galleries[state.activeGallery]) state.activeGallery = Object.keys(galleries)[0] || "exhibition";
  $("[data-gallery-tabs]").innerHTML = Object.entries(galleries).map(([key, group]) => `<button type="button" class="${key === state.activeGallery ? "is-active" : ""}" data-gallery-tab="${escapeAttr(key)}">${escapeHtml(group.title || key)} · ${group.items?.length || 0}</button>`).join("");
  const items = galleries[state.activeGallery]?.items || [];
  $("[data-gallery-list]").innerHTML = items.map((item, index) => `<article class="gallery-item" data-gallery-index="${index}">
    <div class="gallery-item__preview">${galleryPreview(item)}<span>${String(index + 1).padStart(2, "0")} · ${escapeHtml(item.type || "image")}</span></div>
    <div class="gallery-item__body">${field("媒体地址", "url", item.url)}${field("替代文字", "alt", item.alt)}${field("类型", "type", item.type || "image", { type: "select", options: [["image", "图片"], ["video", "视频"]] })}${field("方向", "orientation", item.orientation || "landscape", { type: "select", options: [["landscape", "横向"], ["portrait", "竖向"]] })}<div class="gallery-item__actions"><button type="button" data-action="gallery-up">↑ 上移</button><button type="button" data-action="gallery-down">↓ 下移</button><button type="button" data-action="gallery-delete">删除</button></div></div>
  </article>`).join("") || `<div class="notice-card"><strong>此分类暂无内容</strong><p>点击右上角添加照片或视频。</p></div>`;
};

const contactFields = [
  ["左侧小标题", "eyebrowLeft"], ["右侧小标题", "eyebrowRight"], ["主标题", "title"], ["绿色强调标题", "accentTitle"],
  ["业务邮箱", "email", "email"], ["备用邮箱", "secondaryEmail", "email"], ["联系电话", "phone"], ["WhatsApp 号码（仅数字）", "whatsapp"],
  ["页脚地区", "address"], ["详细联系地址", "streetAddress"], ["网站", "website"], ["微信按钮文字", "wechatLabel"], ["微信按钮链接", "wechatUrl"], ["视频号按钮文字", "videoLabel"], ["视频号按钮链接", "videoUrl"],
];
const renderContact = () => {
  const contact = state.content.contact || {};
  $("[data-contact-form]").innerHTML = contactFields.map(([label, key, type]) => field(label, key, contact[key], { type })).join("");
  contact.officialAccounts ||= [];
  $("[data-account-list]").innerHTML = contact.officialAccounts.map((account, index) => `<article class="series-editor" data-account-index="${index}"><div class="series-editor__top"><strong>${String(index + 1).padStart(2, "0")} · ${escapeHtml(account.name || "未命名账号")}</strong><div class="inline-actions"><button class="icon-button" type="button" data-action="account-up">↑</button><button class="icon-button" type="button" data-action="account-down">↓</button><button class="icon-button" type="button" data-action="account-delete">×</button></div></div><div class="form-grid">${field("账号名称", "name", account.name)}${field("说明", "description", account.description)}${field("二维码图片地址", "image", account.image, { wide: true })}</div></article>`).join("") || `<div class="notice-card"><strong>暂无官方账号</strong><p>点击“添加账号”创建二维码位置。</p></div>`;
};

const renderAll = () => {
  renderStats();
  renderProducts();
  renderFeatured();
  renderGalleries();
  renderContact();
};

const move = (array, index, direction) => {
  const target = index + direction;
  if (target < 0 || target >= array.length) return false;
  [array[index], array[target]] = [array[target], array[index]];
  return true;
};

const productFromElement = (element) => {
  const id = element.closest("[data-product-id]")?.dataset.productId;
  return state.content.products.find((product) => product.id === id);
};

const syncField = (event) => {
  const input = event.target.closest("[data-field]");
  if (!input || !state.content) return;
  const fieldName = input.dataset.field;
  const productElement = input.closest("[data-product-id]");
  const featuredElement = input.closest("[data-featured-id]");
  const galleryElement = input.closest("[data-gallery-index]");
  let target;
  if (productElement) {
    target = productFromElement(productElement);
    const seriesElement = input.closest("[data-series-index]");
    if (seriesElement) target = target?.series?.[Number(seriesElement.dataset.seriesIndex)];
  } else if (featuredElement) {
    const product = state.content.products.find((item) => item.id === featuredElement.dataset.featuredId);
    product.featured ||= {};
    target = product.featured;
  } else if (galleryElement) {
    target = state.content.galleries[state.activeGallery]?.items?.[Number(galleryElement.dataset.galleryIndex)];
  } else if (input.closest("[data-account-index]")) {
    target = state.content.contact.officialAccounts?.[Number(input.closest("[data-account-index]").dataset.accountIndex)];
  } else if (input.closest("[data-contact-form]")) {
    target = state.content.contact;
  }
  if (!target) return;
  if (fieldName === "specsText" || fieldName === "parametersText") target[fieldName.replace("Text", "")] = pairs(input.value);
  else if (["usesText", "applicationsText", "featuresText"].includes(fieldName)) target[fieldName.replace("Text", "")] = lines(input.value);
  else target[fieldName] = input.value;
  setDirty();
};

document.addEventListener("input", syncField);
document.addEventListener("change", syncField);

$("[data-login-form]").addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = $("button", form);
  button.disabled = true;
  $("[data-login-message]").textContent = "正在验证…";
  try {
    await api("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password: form.password.value }) });
    form.reset();
    showAdmin();
    await loadContent();
  } catch (error) {
    $("[data-login-message]").textContent = error.message;
  } finally { button.disabled = false; }
});

$("[data-logout]").addEventListener("click", async () => { await api("/api/admin/logout", { method: "POST" }); showLogin("已安全退出。"); });
$("[data-menu]").addEventListener("click", () => document.body.classList.toggle("menu-open"));

const showPanel = (id) => {
  state.currentPanel = id;
  $$('[data-panel]').forEach((panel) => { panel.hidden = panel.id !== id; });
  $$('[data-nav]').forEach((link) => link.classList.toggle("is-active", link.hash === `#${id}`));
  const titles = { overview: ["Dashboard", "内容总览"], products: ["Products", "产品管理"], featured: ["Featured", "精选产品"], galleries: ["Galleries", "企业影像"], media: ["Media", "媒体库"], contact: ["Contact", "联系方式"] };
  $("[data-section-kicker]").textContent = titles[id]?.[0] || "CMS";
  $("[data-section-title]").textContent = titles[id]?.[1] || "网站管理";
  document.body.classList.remove("menu-open");
  window.scrollTo({ top: 0, behavior: "smooth" });
};

$$('[data-nav]').forEach((link) => link.addEventListener("click", (event) => { event.preventDefault(); history.replaceState(null, "", link.hash); showPanel(link.hash.slice(1)); }));
$$('[data-go]').forEach((button) => button.addEventListener("click", () => { const id = button.dataset.go; history.replaceState(null, "", `#${id}`); showPanel(id); if (id === "products") $("[data-add-product]")?.focus(); }));

$("[data-add-product]").addEventListener("click", () => {
  let id = `product-${Date.now().toString(36)}`;
  while (state.content.products.some((product) => product.id === id)) id += "-new";
  state.content.products.push({ id, year: String(new Date().getFullYear()), name: "新产品", model: "", category: "", cardLabel: "New Product", cardLayout: "standard", image: "assets/jiayi-logo.svg", summary: "", featureTitle: "", description: "", specs: [], uses: [], series: [], featured: null });
  renderProducts(); renderStats(); renderFeatured(); setDirty();
  const editor = $$('[data-product-id]').at(-1); editor.open = true; editor.scrollIntoView({ behavior: "smooth", block: "start" });
});

$("[data-expand-products]").addEventListener("click", (event) => {
  const editors = $$(".product-editor");
  const expand = editors.some((editor) => !editor.open);
  editors.forEach((editor) => { editor.open = expand; });
  event.currentTarget.textContent = expand ? "全部收起" : "全部展开";
});

$("[data-product-list]").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) return;
  event.preventDefault(); event.stopPropagation();
  const editor = button.closest("[data-product-id]");
  const product = productFromElement(editor);
  const index = state.content.products.indexOf(product);
  const action = button.dataset.action;
  if (action === "product-up" || action === "product-down") {
    if (move(state.content.products, index, action.endsWith("up") ? -1 : 1)) { renderProducts(); renderFeatured(); setDirty(); }
  } else if (action === "product-delete") {
    if (await confirmAction("删除产品", `确定删除“${product.name}”及其全部型号吗？媒体库中的原始文件不会被删除。`)) {
      state.content.products.splice(index, 1);
      state.content.featuredProductIds = state.content.featuredProductIds.filter((id) => id !== product.id);
      renderAll(); setDirty();
    }
  } else if (action === "product-duplicate") {
    const copy = clone(product); copy.id = `${slugify(product.id)}-copy-${Date.now().toString(36)}`; copy.name = `${product.name}（副本）`; state.content.products.splice(index + 1, 0, copy); renderAll(); setDirty();
  } else if (action === "series-add") {
    product.series ||= []; product.series.push({ model: "", name: "新型号", image: product.image, specs: [], parameters: [], applications: product.uses || [], description: "" }); renderProducts(); setDirty();
    const reopened = $(`[data-product-id="${CSS.escape(product.id)}"]`); reopened.open = true;
  } else if (action.startsWith("series-")) {
    const seriesIndex = Number(button.closest("[data-series-index]").dataset.seriesIndex);
    if (action === "series-delete") product.series.splice(seriesIndex, 1);
    else move(product.series, seriesIndex, action === "series-up" ? -1 : 1);
    renderProducts(); setDirty(); const reopened = $(`[data-product-id="${CSS.escape(product.id)}"]`); reopened.open = true;
  }
});

$("[data-featured-picker]").addEventListener("change", (event) => {
  const input = event.target.closest("[data-featured-toggle]"); if (!input) return;
  const id = input.dataset.featuredToggle;
  if (input.checked) { if (!state.content.featuredProductIds.includes(id)) state.content.featuredProductIds.push(id); }
  else state.content.featuredProductIds = state.content.featuredProductIds.filter((item) => item !== id);
  renderFeatured(); renderStats(); setDirty();
});

$("[data-featured-editor]").addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]"); if (!button) return;
  const id = button.closest("[data-featured-id]")?.dataset.featuredId;
  const index = state.content.featuredProductIds.indexOf(id);
  if (move(state.content.featuredProductIds, index, button.dataset.action === "featured-up" ? -1 : 1)) { renderFeatured(); setDirty(); }
});

$("[data-gallery-tabs]").addEventListener("click", (event) => { const tab = event.target.closest("[data-gallery-tab]"); if (!tab) return; state.activeGallery = tab.dataset.galleryTab; renderGalleries(); });
$("[data-add-gallery-item]").addEventListener("click", () => { const group = state.content.galleries[state.activeGallery]; group.items ||= []; group.items.push({ id: `${state.activeGallery}-${Date.now().toString(36)}`, type: "image", url: "assets/jiayi-logo.svg", alt: group.title || "企业影像", orientation: "landscape" }); renderGalleries(); renderStats(); setDirty(); });
$("[data-gallery-list]").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]"); if (!button) return;
  const items = state.content.galleries[state.activeGallery].items;
  const index = Number(button.closest("[data-gallery-index]").dataset.galleryIndex);
  if (button.dataset.action === "gallery-delete") { if (await confirmAction("删除影像", "确定从此分类移除这项内容吗？媒体库中的原始文件不会被删除。")) items.splice(index, 1); else return; }
  else move(items, index, button.dataset.action === "gallery-up" ? -1 : 1);
  renderGalleries(); renderStats(); setDirty();
});

$("[data-add-account]").addEventListener("click", () => { state.content.contact.officialAccounts ||= []; state.content.contact.officialAccounts.push({ name: `官方账号 ${String(state.content.contact.officialAccounts.length + 1).padStart(2, "0")}`, description: "Official Channel", image: "" }); renderContact(); setDirty(); });
$("[data-account-list]").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]"); if (!button) return;
  const accounts = state.content.contact.officialAccounts || [];
  const index = Number(button.closest("[data-account-index]").dataset.accountIndex);
  if (button.dataset.action === "account-delete") { if (await confirmAction("删除官方账号", "确定移除这个二维码位置吗？")) accounts.splice(index, 1); else return; }
  else move(accounts, index, button.dataset.action === "account-up" ? -1 : 1);
  renderContact(); setDirty();
});

const renderMedia = () => {
  $("[data-media-list]").innerHTML = state.media.map((item) => `<article class="media-item" data-media-key="${escapeAttr(item.key)}"><div class="media-item__preview">${item.type.startsWith("video/") ? `<video src="${escapeAttr(item.url)}" muted controls preload="metadata"></video>` : `<img src="${escapeAttr(item.url)}" alt="" loading="lazy" />`}<span>${item.type.startsWith("video/") ? "VIDEO" : "IMAGE"}</span></div><div class="media-item__body"><strong title="${escapeAttr(item.key)}">${escapeHtml(item.key.split("/").at(-1))}</strong><small>${formatBytes(item.size)} · ${item.uploaded ? new Date(item.uploaded).toLocaleDateString("zh-CN") : "刚刚上传"}</small><div class="media-item__actions"><button type="button" data-action="media-copy">复制地址</button><button type="button" data-action="media-gallery">加入当前影像</button><button type="button" data-action="media-delete">删除</button></div></div></article>`).join("") || `<div class="notice-card"><strong>媒体库为空</strong><p>上传后的图片和视频会显示在这里。</p></div>`;
};

const loadMedia = async () => { try { const result = await api("/api/admin/media"); state.media = result.items || []; renderMedia(); } catch (error) { toast(error.message, true); } };
$("[data-refresh-media]").addEventListener("click", loadMedia);
$("[data-upload-form]").addEventListener("submit", async (event) => {
  event.preventDefault(); const file = event.currentTarget.file.files[0]; if (!file) return;
  const button = $("button", event.currentTarget); button.disabled = true; button.textContent = "正在上传…";
  try { const form = new FormData(); form.append("file", file); const result = await api("/api/admin/media", { method: "POST", body: form }); state.media.unshift(result.item); renderMedia(); event.currentTarget.reset(); toast("媒体上传成功，可以复制地址或加入企业影像。"); }
  catch (error) { toast(error.message, true); } finally { button.disabled = false; button.textContent = "开始上传"; }
});

$("[data-media-list]").addEventListener("click", async (event) => {
  const button = event.target.closest("[data-action]"); if (!button) return;
  const key = button.closest("[data-media-key]").dataset.mediaKey;
  const item = state.media.find((entry) => entry.key === key); if (!item) return;
  if (button.dataset.action === "media-copy") { await navigator.clipboard.writeText(new URL(item.url, location.href).href); toast("媒体地址已复制。"); }
  if (button.dataset.action === "media-gallery") { const group = state.content.galleries[state.activeGallery]; group.items.push({ id: `${state.activeGallery}-${Date.now().toString(36)}`, type: item.type.startsWith("video/") ? "video" : "image", url: item.url, alt: group.title || "企业影像", orientation: "landscape" }); renderGalleries(); renderStats(); setDirty(); toast(`已加入“${group.title}”，保存发布后生效。`); }
  if (button.dataset.action === "media-delete" && await confirmAction("永久删除媒体", "此操作会从 Cloudflare R2 永久删除文件。如果网页仍在使用该地址，将显示失败。确定继续吗？")) { await api(`/api/admin/media?key=${encodeURIComponent(key)}`, { method: "DELETE" }); state.media = state.media.filter((entry) => entry.key !== key); renderMedia(); toast("媒体文件已删除。"); }
});

const save = async () => {
  if (state.saving || !state.content) return;
  state.saving = true; const buttons = $$('[data-save]'); buttons.forEach((button) => { button.disabled = true; button.textContent = "正在发布…"; });
  try { const result = await api("/api/admin/content", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ content: state.content }) }); state.content.updatedAt = result.updatedAt; setDirty(false); $("[data-bootstrap-notice]").hidden = true; toast("保存成功，线上网站已更新。"); }
  catch (error) { if (error.status === 401) showLogin("登录已失效，请重新登录。"); else toast(error.message, true); }
  finally { state.saving = false; buttons.forEach((button) => { button.disabled = false; button.textContent = "保存并发布"; }); }
};
$$('[data-save]').forEach((button) => button.addEventListener("click", save));
window.addEventListener("beforeunload", (event) => { if (!state.dirty) return; event.preventDefault(); event.returnValue = ""; });
document.addEventListener("keydown", (event) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") { event.preventDefault(); save(); } });

const initialPanel = location.hash.slice(1);
if (["overview", "products", "featured", "galleries", "media", "contact"].includes(initialPanel)) showPanel(initialPanel);
boot();
