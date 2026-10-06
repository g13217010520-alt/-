import { loadSiteContent } from "./content-client.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
const htmlLines = (value = "") => escapeHtml(value).replace(/\n/g, "<br />");

const visualPreview = new URLSearchParams(window.location.search).has("cms-preview")
  && window.parent !== window
  && window.parent.JIAYI_VISUAL_CONTENT;
const content = visualPreview || await loadSiteContent();
window.JIAYI_CONTENT = content;

const setText = (selector, value) => { const element = document.querySelector(selector); if (element && value !== undefined) element.textContent = value; };
const intro = content.intro || {};
setText("[data-cms-intro-meta]", intro.topMeta);
setText("[data-cms-intro-eyebrow]", intro.eyebrow);
setText("[data-cms-intro-title]", intro.title);
setText("[data-cms-intro-accent]", intro.accentTitle);
setText("[data-cms-intro-lead]", intro.lead);
setText("[data-cms-intro-button]", intro.buttonLabel);
setText("[data-cms-intro-location]", intro.footerLocation);
setText("[data-cms-intro-scroll]", intro.scrollLabel);
const introBackground = document.querySelector("[data-cms-intro-background]");
if (introBackground && intro.backgroundImage) introBackground.style.backgroundImage = `url("${String(intro.backgroundImage).replace(/["\\]/g, "\\$&")}")`;

const page = content.page || {};
setText("[data-cms-hero-title]", page.heroTitle);
setText("[data-cms-hero-accent]", page.heroAccent);
setText("[data-cms-hero-intro]", page.heroIntro);
setText("[data-cms-about-title]", page.aboutTitle);
setText("[data-cms-about-accent]", page.aboutAccent);
setText("[data-cms-about-statement]", page.aboutStatement);

const productGrid = document.querySelector("[data-cms-product-grid]");
if (productGrid && Array.isArray(content.products)) {
  productGrid.innerHTML = content.products.map((product, index) => {
    const layout = ["wide", "full"].includes(product.cardLayout) ? ` product-card--${product.cardLayout}` : "";
    const details = Array.isArray(product.specs) ? product.specs.slice(0, 2).map((row) => `<li>${escapeHtml(Array.isArray(row) ? row[1] : row?.value ?? row)}</li>`).join("") : "";
    const body = product.cardLayout === "wide" ? `<div class="product-card__body"><div><h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.summary)}</p></div>${details ? `<ul>${details}</ul>` : ""}</div>` : `<h3>${escapeHtml(product.name)}</h3><p>${escapeHtml(product.summary)}</p>`;
    return `<article class="product-card${layout} reveal is-visible" data-product-id="${escapeHtml(product.id)}">
      <a class="card-hit" href="product-detail.html?id=${encodeURIComponent(product.id)}" aria-label="查看${escapeHtml(product.name)}详细介绍"></a>
      <div class="product-card__meta"><span>${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(product.cardLabel || product.category || "Product")}</span></div>
      ${body}<img src="${escapeHtml(product.image)}" alt="JIAYI POWER ${escapeHtml(product.name)}" loading="lazy" />
    </article>`;
  }).join("");
}

const projectStack = document.querySelector("[data-cms-featured]");
if (projectStack) {
  const selected = (content.featuredProductIds || []).map((id) => content.products.find((product) => product.id === id)).filter(Boolean);
  const card = (product, index, large = false) => {
    const featured = product.featured || {};
    const features = (featured.features || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    return `<article class="project-card${large ? " project-card--mower" : ""} reveal is-visible">
      <a class="project-hit" href="product-detail.html?id=${encodeURIComponent(product.id)}" aria-label="查看${escapeHtml(product.name)}详情"></a>
      <img src="${escapeHtml(featured.image || product.image)}" alt="${escapeHtml(product.name)}产品场景" loading="lazy" />
      <div class="project-card__overlay"></div>
      <div class="project-card__top">${features ? `<ul class="project-features">${features}</ul>` : `<span>${String(index + 1).padStart(2, "0")} / ${escapeHtml(product.cardLabel || "PRODUCT")}</span>`}<span>${escapeHtml(featured.meta || product.model || product.year || "JIAYI")}</span></div>
      <div class="project-card__copy"><p>${escapeHtml(featured.kicker || product.summary)}</p><h3>${htmlLines(featured.headline || product.featureTitle || product.name)}</h3></div>
    </article>`;
  };
  if (selected.length) {
    const [first, ...rest] = selected;
    projectStack.innerHTML = card(first, 0, true) + (rest.length ? `<div class="project-row">${rest.map((product, index) => card(product, index + 1)).join("")}</div>` : "");
  }
}

const contact = content.contact || {};
setText("[data-cms-contact-left]", contact.eyebrowLeft);
setText("[data-cms-contact-right]", contact.eyebrowRight);
setText("[data-cms-contact-title]", contact.title);
setText("[data-cms-contact-accent]", contact.accentTitle);
const wechat = document.querySelector("[data-cms-contact-wechat]");
if (wechat) { wechat.textContent = contact.wechatLabel || "微信联系"; wechat.href = contact.wechatUrl || "wechat-contact.html"; }
const video = document.querySelector("[data-cms-contact-video]");
if (video) { video.textContent = contact.videoLabel || "官方视频号"; video.href = contact.videoUrl || "official-video.html"; }
const emails = document.querySelectorAll("[data-cms-email]");
if (emails[0] && contact.email) { emails[0].textContent = contact.email; emails[0].href = `mailto:${contact.email}`; }
if (emails[1] && contact.secondaryEmail) { emails[1].textContent = contact.secondaryEmail; emails[1].href = `mailto:${contact.secondaryEmail}`; }
setText("[data-cms-address]", contact.address);
const businessEmail = document.querySelector("[data-cms-business-email]");
if (businessEmail && contact.email) { businessEmail.textContent = contact.email; businessEmail.href = `mailto:${contact.email}`; }
const businessPhone = document.querySelector("[data-cms-business-phone]");
if (businessPhone && contact.phone) { businessPhone.textContent = contact.phone; businessPhone.href = `https://wa.me/${String(contact.whatsapp || contact.phone).replace(/\D/g, "")}`; }

window.dispatchEvent(new CustomEvent("jiayi:content-ready", { detail: content }));
await import("./app.js");
