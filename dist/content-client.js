let contentPromise;

export const loadSiteContent = () => {
  if (contentPromise) return contentPromise;
  contentPromise = (async () => {
    try {
      const response = await fetch("/api/content", { headers: { accept: "application/json" } });
      if (response.ok) {
        const payload = await response.json();
        if (payload.content?.products?.length) return payload.content;
      }
    } catch {
      // Static/local previews intentionally fall back to the bundled content.
    }
    const fallback = await fetch("default-content.json", { cache: "no-store" });
    if (!fallback.ok) throw new Error("Unable to load site content");
    return fallback.json();
  })();
  return contentPromise;
};
