export const normalizeContent = (value) => {
  if (!value || typeof value !== "object") return null;
  if (!Array.isArray(value.products)) return null;
  const content = structuredClone(value);
  content.version = Number(content.version) || 1;
  content.products = content.products
    .filter((product) => product && typeof product === "object" && product.id)
    .map((product, index) => ({ ...product, id: String(product.id).trim(), order: index }));
  if (!content.products.length) return null;
  content.featuredProductIds = Array.isArray(content.featuredProductIds)
    ? content.featuredProductIds.filter((id) => content.products.some((product) => product.id === id)).slice(0, 6)
    : [];
  content.updatedAt = new Date().toISOString();
  return content;
};
