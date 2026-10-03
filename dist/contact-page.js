import { loadSiteContent } from "./content-client.js";

const { contact = {} } = await loadSiteContent();
const digits = String(contact.whatsapp || contact.phone || "").replace(/\D/g, "");
const setText = (selector, value) => { const element = document.querySelector(selector); if (element && value) element.textContent = value; };
const setLink = (selector, text, href) => {
  const element = document.querySelector(selector);
  if (!element || !text) return;
  element.textContent = text;
  element.href = href;
};

setText("[data-profile-address]", contact.streetAddress || contact.address);
setLink("[data-profile-website]", contact.website, /^https?:\/\//.test(contact.website || "") ? contact.website : `https://${contact.website}`);
setLink("[data-profile-email]", contact.email, `mailto:${contact.email}`);
setLink("[data-profile-phone]", contact.phone, `tel:+${String(contact.phone || "").replace(/\D/g, "")}`);
setText("[data-profile-wechat]", contact.phone);
setLink("[data-profile-whatsapp]", contact.phone, `https://wa.me/${digits}`);
