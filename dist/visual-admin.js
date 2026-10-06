const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clone = (value) => structuredClone(value);
const escapeHtml = (value = "") => String(value).replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '\"': "&quot;" })[character]);

const localDemo = ["127.0.0.1", "localhost"].includes(location.hostname);
const localStorageKey = "jiayi-visual-cms-content-v3";
const requestParams = new URLSearchParams(location.search);
const requestedSelection = requestParams.get("select");
const requestedPage = requestParams.get("page");
const state = {
  content: null,
  original: null,
  selected: null,
  previewPage: "index",
  sha: null,
  githubConfigured: true,
  dirty: false,
  saving: false,
  demo: localDemo,
  localPublishReady: false,
  localPublishInfo: null,
};

const elements = {
  login: $("[data-login]"),
  shell: $("[data-shell]"),
  loginForm: $("[data-login-form]"),
  loginMessage: $("[data-login-message]"),
  frame: $("[data-preview]"),
  previewUrl: $("[data-preview-url]"),
  openPreview: $("[data-open-preview]"),
  stage: $("[data-device-stage]"),
  modeBadge: $("[data-mode-badge]"),
  previewStatus: $("[data-preview-status]"),
  saveState: $("[data-save-state]"),
  publish: $("[data-publish]"),
  empty: $("[data-empty-state]"),
  editor: $("[data-editor]"),
  fields: $("[data-fields]"),
  editorKicker: $("[data-editor-kicker]"),
  editorTitle: $("[data-editor-title]"),
  editorHelp: $("[data-editor-help]"),
  toast: $("[data-toast]"),
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

const detectLocalPublisher = async () => {
  if (!state.demo) return;
  try {
    const status = await api("/api/local/status");
    state.localPublishReady = status.mode === "local-git";
    state.localPublishInfo = status;
  } catch {
    state.localPublishReady = false;
    state.localPublishInfo = null;
  }
  elements.modeBadge.textContent = state.localPublishReady ? "GitHub 发布已连接" : "仅保存本地草稿";
  elements.modeBadge.classList.toggle("is-ready", state.localPublishReady);
  elements.publish.textContent = state.localPublishReady ? "发布修改" : "保存本地草稿";
};

const toast = (message, isError = false) => {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("is-error", isError);
  elements.toast.hidden = false;
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => { elements.toast.hidden = true; }, 3600);
};

const setDirty = (dirty = true) => {
  state.dirty = dirty;
  elements.saveState.textContent = dirty ? "有未发布的修改" : "内容已同步";
  elements.saveState.classList.toggle("is-dirty", dirty);
};

const fetchDefaults = async () => {
  const response = await fetch("default-content.json", { cache: "no-store" });
  if (!response.ok) throw new Error("无法载入网站内容。");
  return response.json();
};

const loadContent = async () => {
  const defaults = await fetchDefaults();
  let content = defaults;
  if (state.demo) {
    try { content = JSON.parse(localStorage.getItem(localStorageKey)) || defaults; } catch { content = defaults; }
  } else {
    const remote = await api("/api/admin/github-content");
    content = remote.content || defaults;
    state.sha = remote.sha || null;
    state.githubConfigured = remote.configured !== false;
  }
  state.content = clone(content);
  state.content.intro ||= defaults.intro || {};
  state.content.page ||= defaults.page || {};
  state.content.products ||= [];
  state.content.galleries ||= {};
  state.content.contact ||= {};
  state.content.products.forEach((product) => {
    product.series ||= [];
    product.series.forEach((series) => {
      series.description ||= `${series.name || "该型号"}围绕${product.uses?.[0] || "真实作业"}等场景开发，以 ${(series.specs || []).join("、")} 为核心配置，在动力输出、操控与维护效率之间取得平衡。`;
      series.parameters = (series.parameters || []).map((row) => Array.isArray(row) ? { label: row[0] || "", value: row[1] || "" } : row);
      series.applications ||= product.uses || [];
    });
  });
  window.JIAYI_VISUAL_CONTENT = state.content;
  state.original = clone(state.content);
  setDirty(false);
  if (!state.demo && !state.githubConfigured) {
    elements.publish.disabled = true;
    elements.publish.title = "需要在 Cloudflare 中配置 GITHUB_CONTENT_TOKEN";
    elements.saveState.textContent = "GitHub 写入未配置";
    elements.saveState.classList.add("is-dirty");
  }
};

const introDefinition = {
  kicker: "ENTRANCE HERO",
  title: "入口首屏",
  help: "这里对应访客打开网站时看到的全屏封面。可修改全部文案与背景图；排版和品牌样式会保持不变。",
  fields: [
    ["topMeta", "右上角年份标语", "text"],
    ["eyebrow", "英文眉题", "text"],
    ["title", "主标题", "text"],
    ["accentTitle", "描边标题", "text"],
    ["lead", "说明文字", "textarea"],
    ["buttonLabel", "进入按钮文字", "text"],
    ["footerLocation", "左下角地点", "text"],
    ["scrollLabel", "右下角提示", "text"],
    ["backgroundImage", "背景图片地址", "text", "例如：assets/intro-cover.webp"],
  ],
};

const pageFields = {
  hero: {
    kicker: "HERO SECTION",
    title: "首屏内容",
    help: "修改首页第一屏的主标题、强调文字和介绍。布局与字体由网站模板保护，不会被误改。",
    fields: [
      ["heroTitle", "主标题", "text"],
      ["heroAccent", "强调标题", "text"],
      ["heroIntro", "介绍文字", "textarea"],
    ],
  },
  about: {
    kicker: "ABOUT JIAYI",
    title: "企业介绍",
    help: "这里的修改会同步到关于嘉易板块。",
    fields: [
      ["aboutTitle", "板块标题", "text"],
      ["aboutAccent", "第二行标题", "text"],
      ["aboutStatement", "企业定位介绍", "textarea"],
    ],
  },
};

const contactDefinition = {
  kicker: "CONTACT",
  title: "联系方式与行动按钮",
  help: "修改后会同步更新页面联系板块、企业介绍中的商务联系方式和页脚。",
  fields: [
    ["title", "联系标题", "text"],
    ["accentTitle", "强调标题", "text"],
    ["email", "业务邮箱", "email"],
    ["secondaryEmail", "备用邮箱", "email"],
    ["phone", "联系电话", "text"],
    ["whatsapp", "WhatsApp 号码", "text"],
    ["address", "页脚地址", "text"],
    ["wechatLabel", "微信按钮文字", "text"],
    ["videoLabel", "视频按钮文字", "text"],
  ],
};

const productDefinition = {
  kicker: "PRODUCT",
  help: "修改产品卡片及详情页主信息。点击预览中的具体型号，可继续编辑型号参数和应用场景。",
  fields: [
    ["name", "产品名称", "text"],
    ["model", "主型号", "text"],
    ["category", "产品分类", "text"],
    ["cardLabel", "卡片英文标签", "text"],
    ["summary", "产品简介", "textarea"],
    ["featureTitle", "详情页标题", "textarea"],
    ["description", "详情页说明", "textarea"],
    ["image", "产品图片地址", "text", "例如：assets/series/chainsaw-10.webp"],
  ],
};

const seriesDefinition = {
  kicker: "PRODUCT MODEL",
  help: "这里对应详情页中的具体型号。参数和应用场景可在下方逐条增加、修改或删除。",
  fields: [
    ["model", "型号", "text"],
    ["name", "型号名称", "text"],
    ["description", "产品概要", "textarea"],
    ["image", "型号图片地址", "text", "例如：assets/catalog/xxx.webp"],
  ],
};

const galleryDefinition = {
  kicker: "GALLERY",
  help: "点击上方分类切换图库；下方可直接增加、修改、排序或删除图片。图片文件上传仍可使用 Pages CMS 媒体库。",
  fields: [
    ["title", "图库名称", "text"],
    ["mode", "展示模式", "select", "", [
      ["accordion", "手风琴"],
      ["depth", "纵深轮播"],
      ["grid", "网格"],
    ]],
  ],
};

const fieldMarkup = ([name, label, type, hint = "", options = []], value = "") => {
  const control = type === "textarea"
    ? `<textarea name="${escapeHtml(name)}">${escapeHtml(value)}</textarea>`
    : type === "select"
      ? `<select name="${escapeHtml(name)}">${options.map(([optionValue, optionLabel]) => `<option value="${escapeHtml(optionValue)}"${optionValue === value ? " selected" : ""}>${escapeHtml(optionLabel)}</option>`).join("")}</select>`
      : `<input type="${escapeHtml(type)}" name="${escapeHtml(name)}" value="${escapeHtml(value)}" />`;
  return `<label>${escapeHtml(label)}${control}${hint ? `<span class="field-hint">${escapeHtml(hint)}</span>` : ""}</label>`;
};

const seriesListsMarkup = (series) => {
  series.parameters ||= [];
  series.applications ||= [];
  return `
    <section class="nested-editor">
      <div class="nested-editor__head"><h3>核心参数</h3><button type="button" data-list-action="add-parameter">＋ 添加参数</button></div>
      <div class="nested-list">${series.parameters.map((row, index) => `
        <div class="nested-row nested-row--pair">
          <input data-series-parameter-field="label" data-index="${index}" value="${escapeHtml(row?.label || row?.[0] || "")}" aria-label="参数名称" placeholder="参数名称" />
          <input data-series-parameter-field="value" data-index="${index}" value="${escapeHtml(row?.value || row?.[1] || "")}" aria-label="参数值" placeholder="参数值" />
          <button type="button" class="danger-link" data-list-action="delete-parameter" data-index="${index}">删除</button>
        </div>`).join("") || '<p class="nested-empty">暂无参数，可点击添加。</p>'}</div>
    </section>
    <section class="nested-editor">
      <div class="nested-editor__head"><h3>应用场景</h3><button type="button" data-list-action="add-application">＋ 添加场景</button></div>
      <div class="nested-list">${series.applications.map((item, index) => `
        <div class="nested-row">
          <input data-series-application data-index="${index}" value="${escapeHtml(item)}" aria-label="应用场景" placeholder="应用场景" />
          <button type="button" class="danger-link" data-list-action="delete-application" data-index="${index}">删除</button>
        </div>`).join("") || '<p class="nested-empty">暂无应用场景，可点击添加。</p>'}</div>
    </section>`;
};

const galleryItemsMarkup = (gallery) => {
  gallery.items ||= [];
  return `
    <section class="nested-editor">
      <div class="nested-editor__head"><h3>图库图片（${gallery.items.length}）</h3><button type="button" data-gallery-action="add">＋ 增加图片</button></div>
      <p class="nested-note">填写媒体库中的图片地址；添加或删除后，左侧预览会自动刷新。</p>
      <div class="gallery-editor-list">${gallery.items.map((item, index) => `
        <article class="gallery-editor-item">
          <img src="${escapeHtml(item.url || "assets/jiayi-logo.svg")}" alt="" />
          <div><strong>图片 ${String(index + 1).padStart(2, "0")}</strong><input data-gallery-item-field="url" data-index="${index}" value="${escapeHtml(item.url || "")}" aria-label="图片地址" placeholder="图片地址" /><input data-gallery-item-field="alt" data-index="${index}" value="${escapeHtml(item.alt || "")}" aria-label="图片说明" placeholder="图片说明" /></div>
          <div class="item-actions"><button type="button" data-gallery-action="up" data-index="${index}" aria-label="上移">↑</button><button type="button" data-gallery-action="down" data-index="${index}" aria-label="下移">↓</button><button type="button" class="danger-link" data-gallery-action="delete" data-index="${index}">删除</button></div>
        </article>`).join("") || '<p class="nested-empty">图库为空，点击“增加图片”创建第一张。</p>'}</div>
    </section>`;
};

const renderEditor = () => {
  const selection = state.selected;
  if (!selection) {
    elements.editor.hidden = true;
    elements.empty.hidden = false;
    return;
  }

  let definition;
  let target;
  if (selection.kind === "intro") {
    definition = introDefinition;
    target = state.content.intro;
  } else if (selection.kind === "page") {
    definition = pageFields[selection.section];
    target = state.content.page;
  } else if (selection.kind === "contact") {
    definition = contactDefinition;
    target = state.content.contact;
  } else if (selection.kind === "product") {
    definition = { ...productDefinition, title: targetTitle(selection.id) };
    target = state.content.products.find((product) => product.id === selection.id);
  } else if (selection.kind === "series") {
    const product = state.content.products.find((item) => item.id === selection.id);
    target = product?.series?.[selection.index];
    definition = { ...seriesDefinition, title: target ? `${target.model || "型号"} · ${target.name || "未命名"}` : "编辑型号" };
  } else if (selection.kind === "gallery") {
    definition = { ...galleryDefinition, title: state.content.galleries[selection.id]?.title || "企业影像" };
    target = state.content.galleries[selection.id];
  }

  if (!definition || !target) return;
  elements.empty.hidden = true;
  elements.editor.hidden = false;
  elements.editorKicker.textContent = definition.kicker;
  elements.editorTitle.textContent = definition.title;
  elements.editorHelp.textContent = definition.help;
  const baseFields = definition.fields.map((field) => fieldMarkup(field, target[field[0]] ?? "")).join("");
  const extras = selection.kind === "series" ? seriesListsMarkup(target) : selection.kind === "gallery" ? galleryItemsMarkup(target) : "";
  elements.fields.innerHTML = baseFields + extras;
};

const targetTitle = (id) => state.content.products.find((product) => product.id === id)?.name || "编辑产品";

const currentTarget = () => {
  if (!state.selected) return null;
  if (state.selected.kind === "intro") return state.content.intro;
  if (state.selected.kind === "page") return state.content.page;
  if (state.selected.kind === "contact") return state.content.contact;
  if (state.selected.kind === "product") return state.content.products.find((product) => product.id === state.selected.id);
  if (state.selected.kind === "series") return state.content.products.find((product) => product.id === state.selected.id)?.series?.[state.selected.index];
  if (state.selected.kind === "gallery") return state.content.galleries[state.selected.id];
  return null;
};

const previewDocument = () => {
  try { return elements.frame.contentDocument; } catch { return null; }
};

const setPreviewText = (doc, selector, value) => {
  const element = doc.querySelector(selector);
  if (element && value !== undefined) element.textContent = value;
};

const productForPreview = () => {
  const frameUrl = new URL(elements.frame.src, location.href);
  const id = frameUrl.searchParams.get("id");
  return id ? state.content.products.find((product) => product.id === id) : null;
};

const renderSeriesPreview = (doc, product) => {
  if (!product || !doc.querySelector("[data-product-name]")) return;
  setPreviewText(doc, "[data-product-name]", product.name);
  setPreviewText(doc, "[data-product-model]", product.model);
  setPreviewText(doc, "[data-product-category]", `${product.category || ""}${product.year ? ` · ${product.year}` : ""}`);
  setPreviewText(doc, "[data-product-summary]", product.summary);
  setPreviewText(doc, "[data-series-name]", product.name);
  setPreviewText(doc, "[data-series-summary]", `共收录 ${(product.series || []).length} 款${product.name || "产品"}型号。每款产品均提供产品概要、核心参数与应用场景。`);
  const heroImage = doc.querySelector("[data-product-image]");
  if (heroImage && product.image) heroImage.src = product.image;
  (product.series || []).forEach((series, index) => {
    const card = doc.querySelector(`[data-series-index="${index}"]`);
    if (!card) return;
    setPreviewText(card, "[data-cms-series-model]", series.model);
    setPreviewText(card, "[data-cms-series-name]", series.name);
    setPreviewText(card, "[data-cms-series-description]", series.description || "");
    const image = card.querySelector("[data-cms-series-image]");
    if (image && series.image) { image.src = series.image; image.alt = `${series.model || ""} ${series.name || ""}`.trim(); }
    const parameters = card.querySelector("[data-cms-series-parameters]");
    if (parameters) {
      parameters.replaceChildren(...(series.parameters || []).map((row) => {
        const wrapper = doc.createElement("div");
        const label = doc.createElement("dt");
        const value = doc.createElement("dd");
        label.textContent = row?.label || row?.[0] || "";
        value.textContent = row?.value || row?.[1] || "";
        wrapper.append(label, value);
        return wrapper;
      }));
    }
    const applications = card.querySelector("[data-cms-series-applications]");
    if (applications) {
      applications.replaceChildren(...(series.applications || []).map((use, useIndex) => {
        const item = doc.createElement("li");
        const number = doc.createElement("span");
        number.textContent = String(useIndex + 1).padStart(2, "0");
        item.append(number, doc.createTextNode(use));
        return item;
      }));
    }
  });
};

const syncPreview = () => {
  const doc = previewDocument();
  if (!doc || !state.content) return;
  const intro = state.content.intro || {};
  setPreviewText(doc, "[data-cms-intro-meta]", intro.topMeta);
  setPreviewText(doc, "[data-cms-intro-eyebrow]", intro.eyebrow);
  setPreviewText(doc, "[data-cms-intro-title]", intro.title);
  setPreviewText(doc, "[data-cms-intro-accent]", intro.accentTitle);
  setPreviewText(doc, "[data-cms-intro-lead]", intro.lead);
  setPreviewText(doc, "[data-cms-intro-button]", intro.buttonLabel);
  setPreviewText(doc, "[data-cms-intro-location]", intro.footerLocation);
  setPreviewText(doc, "[data-cms-intro-scroll]", intro.scrollLabel);
  const introBackground = doc.querySelector("[data-cms-intro-background]");
  if (introBackground && intro.backgroundImage) introBackground.style.backgroundImage = `url("${String(intro.backgroundImage).replace(/["\\]/g, "\\$&")}")`;

  const page = state.content.page || {};
  setPreviewText(doc, "[data-cms-hero-title]", page.heroTitle);
  setPreviewText(doc, "[data-cms-hero-accent]", page.heroAccent);
  setPreviewText(doc, "[data-cms-hero-intro]", page.heroIntro);
  setPreviewText(doc, "[data-cms-about-title]", page.aboutTitle);
  setPreviewText(doc, "[data-cms-about-accent]", page.aboutAccent);
  setPreviewText(doc, "[data-cms-about-statement]", page.aboutStatement);

  const contact = state.content.contact || {};
  setPreviewText(doc, "[data-cms-contact-title]", contact.title);
  setPreviewText(doc, "[data-cms-contact-accent]", contact.accentTitle);
  setPreviewText(doc, "[data-cms-contact-wechat]", contact.wechatLabel);
  setPreviewText(doc, "[data-cms-contact-video]", contact.videoLabel);
  doc.querySelectorAll("[data-cms-email]").forEach((element, index) => {
    const email = index === 0 ? contact.email : contact.secondaryEmail;
    if (email) { element.textContent = email; element.href = `mailto:${email}`; }
  });
  const businessEmail = doc.querySelector("[data-cms-business-email]");
  if (businessEmail && contact.email) { businessEmail.textContent = contact.email; businessEmail.href = `mailto:${contact.email}`; }
  const businessPhone = doc.querySelector("[data-cms-business-phone]");
  if (businessPhone && contact.phone) { businessPhone.textContent = contact.phone; businessPhone.href = `https://wa.me/${String(contact.whatsapp || contact.phone).replace(/\D/g, "")}`; }
  setPreviewText(doc, "[data-cms-address]", contact.address);

  state.content.products.forEach((product) => {
    const cards = [...doc.querySelectorAll(`[data-product-id="${product.id}"]`)];
    doc.querySelectorAll(`a[href*="id=${encodeURIComponent(product.id)}"]`).forEach((link) => {
      const card = link.closest(".product-card,.project-card");
      if (card && !cards.includes(card)) cards.push(card);
    });
    cards.forEach((card) => {
      const heading = card.querySelector("h3");
      const copy = card.querySelector(".product-card__body p,.project-card__copy p,.product-card > p");
      const image = card.querySelector("img");
      const label = card.querySelector(".product-card__meta span:last-child");
      if (heading) heading.textContent = product.name || "未命名产品";
      if (copy) copy.textContent = product.summary || "";
      if (image && product.image) image.src = product.image;
      if (label) label.textContent = product.cardLabel || product.category || "Product";
    });
  });

  renderSeriesPreview(doc, productForPreview());

  Object.entries(state.content.galleries || {}).forEach(([key, gallery]) => {
    setPreviewText(doc, `[data-gallery-category="${key}"] strong`, gallery.title);
  });
};

const previewStyle = `
  [data-visual-editable] { outline: 1.5px dashed rgba(125,255,55,.82) !important; outline-offset: 4px !important; cursor: pointer !important; transition: outline-color .16s, box-shadow .16s !important; }
  [data-visual-editable]:hover { outline: 3px solid #8cff3f !important; box-shadow: 0 0 0 7px rgba(140,255,63,.12) !important; }
  [data-visual-editable].visual-selected { outline: 3px solid #8cff3f !important; box-shadow: 0 0 0 9px rgba(140,255,63,.17) !important; }
  [data-visual-editable] * { cursor: pointer !important; }
`;

const markEditable = (element, kind, id = "") => {
  if (!element) return;
  element.dataset.visualEditable = kind;
  if (id) element.dataset.visualId = id;
};

const annotatePreview = () => {
  const doc = previewDocument();
  if (!doc?.body) return;
  if (!doc.getElementById("visual-admin-preview-style")) {
    const style = doc.createElement("style");
    style.id = "visual-admin-preview-style";
    style.textContent = previewStyle;
    doc.head.append(style);
  }

  markEditable(doc.querySelector(".intro__image"), "intro", "intro");
  markEditable(doc.querySelector(".intro__topbar > p"), "intro", "intro");
  markEditable(doc.querySelector(".intro__content"), "intro", "intro");
  markEditable(doc.querySelector(".intro__footer"), "intro", "intro");
  markEditable(doc.querySelector(".hero__copy"), "page", "hero");
  markEditable(doc.querySelector(".about__lead"), "page", "about");
  markEditable(doc.querySelector(".about__content"), "page", "about");
  markEditable(doc.querySelector("#contact .contact__inner"), "contact");
  markEditable(doc.querySelector(".footer__contacts"), "contact");

  doc.querySelectorAll(".product-card,.project-card").forEach((card) => {
    let id = card.dataset.productId;
    if (!id) {
      const href = card.querySelector('a[href*="product-detail.html?id="]')?.getAttribute("href") || "";
      id = new URL(href, location.href).searchParams.get("id");
    }
    if (id) markEditable(card, "product", id);
  });
  doc.querySelectorAll("[data-gallery-category]").forEach((tab) => markEditable(tab, "gallery", tab.dataset.galleryCategory));
  const detailProduct = productForPreview();
  if (detailProduct) {
    markEditable(doc.querySelector(".detail-copy"), "product", detailProduct.id);
    markEditable(doc.querySelector(".product-stage"), "product", detailProduct.id);
    doc.querySelectorAll("[data-series-index]").forEach((card) => {
      markEditable(card, "series", detailProduct.id);
      card.dataset.visualIndex = card.dataset.seriesIndex;
    });
  }

  if (!doc.documentElement.dataset.visualAdminBound) {
    doc.documentElement.dataset.visualAdminBound = "true";
    doc.addEventListener("click", (event) => {
      if (event.target.closest(".entry-button") && state.previewPage === "index") {
        event.preventDefault();
        event.stopPropagation();
        switchPreviewPage("company");
        return;
      }
      const productLink = event.target.closest('a[href*="product-detail.html?id="]');
      if (productLink) {
        event.preventDefault();
        event.stopPropagation();
        const id = new URL(productLink.href, location.href).searchParams.get("id");
        if (id) openProductDetail(id);
        return;
      }
      const editable = event.target.closest("[data-visual-editable]");
      if (!editable) return;
      if (editable.dataset.visualEditable === "product" && state.previewPage === "company") {
        event.preventDefault();
        event.stopPropagation();
        openProductDetail(editable.dataset.visualId);
        return;
      }
      if (editable.dataset.visualEditable === "gallery") {
        doc.querySelectorAll(".visual-selected").forEach((item) => item.classList.remove("visual-selected"));
        editable.classList.add("visual-selected");
        state.selected = { kind: "gallery", id: editable.dataset.visualId };
        renderEditor();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      doc.querySelectorAll(".visual-selected").forEach((item) => item.classList.remove("visual-selected"));
      editable.classList.add("visual-selected");
      state.selected = {
        kind: editable.dataset.visualEditable,
        id: editable.dataset.visualId,
        section: editable.dataset.visualId,
        index: Number(editable.dataset.visualIndex || 0),
      };
      renderEditor();
    }, true);
  }
  if (requestedSelection && !state.selected) {
    const requestedTarget = requestedSelection.startsWith("product:")
      ? doc.querySelector(`[data-product-id="${requestedSelection.slice(8)}"]`)
      : doc.querySelector(`[data-visual-id="${requestedSelection}"], [data-visual-editable="${requestedSelection}"]`);
    requestedTarget?.click();
  }
  syncPreview();
  elements.previewStatus.textContent = "预览已连接";
};

const refreshGalleryPreview = () => {
  if (state.selected?.kind !== "gallery") return;
  const galleryId = state.selected.id;
  window.JIAYI_VISUAL_CONTENT = state.content;
  state.previewPage = "company";
  $$('[data-preview-page]').forEach((button) => button.classList.toggle("is-active", button.dataset.previewPage === "company"));
  elements.previewUrl.textContent = "jiayipower.com/company#company-gallery";
  elements.openPreview.href = `company.html?gallery=${encodeURIComponent(galleryId)}#company-gallery`;
  elements.previewStatus.textContent = "正在刷新图库预览…";
  elements.frame.onload = () => previewDocument()?.getElementById("company-gallery")?.scrollIntoView({ block: "start" });
  elements.frame.src = `company.html?cms-preview=1&gallery=${encodeURIComponent(galleryId)}#company-gallery`;
};

const updateNestedField = (input) => {
  const target = currentTarget();
  if (!target) return false;
  const index = Number(input.dataset.index);
  if (input.dataset.seriesParameterField) {
    target.parameters ||= [];
    const current = target.parameters[index] || {};
    target.parameters[index] = Array.isArray(current) ? { label: current[0] || "", value: current[1] || "" } : current;
    target.parameters[index][input.dataset.seriesParameterField] = input.value;
  } else if (input.hasAttribute("data-series-application")) {
    target.applications ||= [];
    target.applications[index] = input.value;
  } else if (input.dataset.galleryItemField) {
    target.items ||= [];
    if (!target.items[index]) return false;
    target.items[index][input.dataset.galleryItemField] = input.value;
  } else {
    return false;
  }
  setDirty(true);
  syncPreview();
  return true;
};

elements.fields.addEventListener("input", (event) => {
  if (updateNestedField(event.target)) return;
  const target = currentTarget();
  if (!target || !event.target.name) return;
  target[event.target.name] = event.target.value;
  setDirty(true);
  syncPreview();
});

elements.fields.addEventListener("change", (event) => {
  if (updateNestedField(event.target)) {
    if (event.target.dataset.galleryItemField) refreshGalleryPreview();
    return;
  }
  const target = currentTarget();
  if (!target || !event.target.name) return;
  target[event.target.name] = event.target.value;
  setDirty(true);
  syncPreview();
  if (state.selected?.kind === "gallery") refreshGalleryPreview();
});

elements.fields.addEventListener("click", (event) => {
  const listAction = event.target.closest("[data-list-action]");
  const galleryAction = event.target.closest("[data-gallery-action]");
  if (!listAction && !galleryAction) return;
  event.preventDefault();
  const target = currentTarget();
  if (!target) return;

  if (listAction) {
    const index = Number(listAction.dataset.index);
    if (listAction.dataset.listAction === "add-parameter") (target.parameters ||= []).push({ label: "参数名称", value: "参数值" });
    if (listAction.dataset.listAction === "delete-parameter") target.parameters?.splice(index, 1);
    if (listAction.dataset.listAction === "add-application") (target.applications ||= []).push("新的应用场景");
    if (listAction.dataset.listAction === "delete-application") target.applications?.splice(index, 1);
    setDirty(true);
    renderEditor();
    syncPreview();
    return;
  }

  target.items ||= [];
  const index = Number(galleryAction.dataset.index);
  if (galleryAction.dataset.galleryAction === "add") {
    target.items.push({
      id: `${state.selected.id}-${Date.now().toString(36)}`,
      type: "image",
      url: "assets/jiayi-logo.svg",
      alt: `${target.title || "企业影像"} 新图片`,
      orientation: "landscape",
    });
  } else if (galleryAction.dataset.galleryAction === "delete") {
    target.items.splice(index, 1);
  } else if (galleryAction.dataset.galleryAction === "up" && index > 0) {
    [target.items[index - 1], target.items[index]] = [target.items[index], target.items[index - 1]];
  } else if (galleryAction.dataset.galleryAction === "down" && index < target.items.length - 1) {
    [target.items[index + 1], target.items[index]] = [target.items[index], target.items[index + 1]];
  }
  setDirty(true);
  renderEditor();
  refreshGalleryPreview();
});

elements.frame.addEventListener("load", () => {
  elements.previewStatus.textContent = "正在连接可编辑区域…";
  setTimeout(annotatePreview, 280);
  setTimeout(annotatePreview, 900);
});

const switchPreviewPage = (page, scrollTarget = "") => {
  const nextPage = page === "company" ? "company" : "index";
  window.JIAYI_VISUAL_CONTENT = state.content;
  state.previewPage = nextPage;
  state.selected = null;
  renderEditor();
  $$('[data-preview-page]').forEach((button) => button.classList.toggle("is-active", button.dataset.previewPage === nextPage));
  const file = nextPage === "company" ? "company.html" : "index.html";
  elements.previewUrl.textContent = nextPage === "company" ? "jiayipower.com/company" : "jiayipower.com";
  elements.openPreview.href = file;
  elements.previewStatus.textContent = "正在载入页面…";
  elements.frame.onload = () => {
    if (!scrollTarget) return;
    const doc = previewDocument();
    const target = doc?.getElementById(scrollTarget);
    target?.scrollIntoView({ block: "start" });
  };
  elements.frame.src = `${file}?cms-preview=1`;
};

const openProductDetail = (id) => {
  const product = state.content.products.find((item) => item.id === id);
  if (!product) return;
  window.JIAYI_VISUAL_CONTENT = state.content;
  state.previewPage = "product";
  state.selected = { kind: "product", id };
  renderEditor();
  $$('[data-preview-page]').forEach((button) => button.classList.toggle("is-active", button.dataset.previewPage === "company"));
  elements.previewUrl.textContent = `jiayipower.com/product-detail?id=${id}`;
  elements.openPreview.href = `product-detail.html?id=${encodeURIComponent(id)}`;
  elements.previewStatus.textContent = "正在载入产品详情…";
  elements.frame.src = `product-detail.html?id=${encodeURIComponent(id)}&cms-preview=1`;
};

$$('[data-preview-page]').forEach((button) => button.addEventListener("click", () => {
  if (button.dataset.previewPage === state.previewPage) return;
  switchPreviewPage(button.dataset.previewPage);
}));

$$('[data-scroll-target]').forEach((button) => button.addEventListener("click", () => {
  if (state.previewPage !== "company") {
    switchPreviewPage("company", button.dataset.scrollTarget);
    return;
  }
  const doc = previewDocument();
  const target = doc?.getElementById(button.dataset.scrollTarget);
  target?.scrollIntoView({ behavior: "smooth", block: "start" });
}));

$$('[data-viewport]').forEach((button) => button.addEventListener("click", () => {
  $$('[data-viewport]').forEach((item) => item.classList.toggle("is-active", item === button));
  elements.stage.classList.toggle("is-mobile", button.dataset.viewport === "mobile");
}));

$("[data-close-editor]").addEventListener("click", () => {
  state.selected = null;
  previewDocument()?.querySelectorAll(".visual-selected").forEach((item) => item.classList.remove("visual-selected"));
  renderEditor();
});

$("[data-reset]").addEventListener("click", () => {
  if (!state.dirty) return toast("当前没有需要撤销的修改。");
  state.content = clone(state.original);
  window.JIAYI_VISUAL_CONTENT = state.content;
  setDirty(false);
  if (state.previewPage === "product" && state.selected?.id) openProductDetail(state.selected.id);
  else if (state.selected?.kind === "gallery") refreshGalleryPreview();
  else syncPreview();
  renderEditor();
  toast("已撤销本次尚未发布的修改。");
});

$("[data-download]").addEventListener("click", () => {
  const blob = new Blob([`${JSON.stringify(state.content, null, 2)}\n`], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `jiayi-content-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

elements.publish.addEventListener("click", async () => {
  if (state.saving) return;
  if (!state.dirty) return toast("内容没有变化，无需重复发布。");
  state.saving = true;
  elements.publish.disabled = true;
  elements.publish.textContent = "正在发布…";
  try {
    if (state.demo) {
      localStorage.setItem(localStorageKey, JSON.stringify(state.content));
      if (state.localPublishReady) {
        const result = await api("/api/local/publish", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ content: state.content }),
        });
        state.content = clone(result.content || state.content);
        window.JIAYI_VISUAL_CONTENT = state.content;
        toast(result.changed
          ? "已提交到 GitHub，Cloudflare 正在部署；通常 1–3 分钟后线上生效。"
          : "内容与 GitHub 版本一致，无需重复发布。");
      } else {
        toast("已保存为本地草稿；当前服务器未连接 GitHub 发布通道。", true);
      }
    } else {
      const result = await api("/api/admin/github-content", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ content: state.content, sha: state.sha }),
      });
      state.content = clone(result.content || state.content);
      window.JIAYI_VISUAL_CONTENT = state.content;
      state.sha = result.sha;
      toast("已提交到 GitHub，Cloudflare 正在自动部署。通常 1–3 分钟后生效。");
    }
    state.original = clone(state.content);
    setDirty(false);
  } catch (error) {
    toast(error.message, true);
    if (error.status === 401) showLogin("登录已失效，请重新登录。");
  } finally {
    state.saving = false;
    elements.publish.disabled = !state.demo && !state.githubConfigured;
    elements.publish.textContent = state.demo && !state.localPublishReady ? "保存本地草稿" : "发布修改";
  }
});

elements.modeBadge.addEventListener("click", () => {
  if (state.localPublishReady) {
    toast(`本机已连接 ${state.localPublishInfo.repository} · ${state.localPublishInfo.branch}；“发布修改”会提交 GitHub 并触发线上部署。`);
  } else {
    toast("当前只会保存浏览器草稿。请使用项目自带的本地服务器重新打开后台。", true);
  }
});

const showLogin = (message = "") => {
  elements.shell.hidden = true;
  elements.login.hidden = false;
  elements.loginMessage.textContent = message;
  elements.loginForm.password?.focus();
};

const showEditor = async () => {
  elements.login.hidden = true;
  elements.shell.hidden = false;
  elements.modeBadge.hidden = !state.demo;
  await detectLocalPublisher();
  await loadContent();
  if (requestedPage === "company") switchPreviewPage("company");
  else annotatePreview();
};

elements.loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  elements.loginMessage.textContent = "正在验证…";
  try {
    await api("/api/admin/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: event.currentTarget.password.value }),
    });
    await showEditor();
  } catch (error) {
    elements.loginMessage.textContent = error.message;
  }
});

const boot = async () => {
  try {
    if (state.demo) return await showEditor();
    const session = await api("/api/admin/session");
    if (!session.configured) return showLogin("后台登录密钥尚未在 Cloudflare 中配置。");
    if (!session.authenticated) return showLogin();
    await showEditor();
  } catch (error) {
    showLogin(error.message);
  }
};

boot();
