import { loadSiteContent } from "./content-client.js";

const escapeHtml = (value = "") => String(value).replace(/[&<>"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
const { contact = {} } = await loadSiteContent();
const accounts = Array.isArray(contact.officialAccounts) ? contact.officialAccounts : [];
const grid = document.querySelector("[data-official-accounts]");
const placeholder = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M8 8h18v18H8zM14 14h6v6h-6zM38 8h18v18H38zM44 14h6v6h-6zM8 38h18v18H8zM14 44h6v6h-6zM36 36h8v8h-8zM48 36h8v8h-8zM36 48h8v8h-8zM48 48h8v8h-8z"/></svg><strong>二维码待添加</strong>`;
if (grid && accounts.length) {
  grid.innerHTML = accounts.map((account, index) => `<article class="video-qr-card"><span class="video-qr-card__index">${String(index + 1).padStart(2, "0")}</span><div class="video-qr-placeholder" aria-label="${escapeHtml(account.name)}二维码">${account.image ? `<img src="${escapeHtml(account.image)}" alt="${escapeHtml(account.name)}二维码" />` : placeholder}</div><h2>${escapeHtml(account.name)}</h2><p>${escapeHtml(account.description || "Official Channel")}</p></article>`).join("");
}
