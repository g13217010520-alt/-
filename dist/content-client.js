let contentPromise;

export const loadSiteContent = () => {
  if (contentPromise) return contentPromise;
  contentPromise = (async () => {
    const response = await fetch("default-content.json", { cache: "no-store" });
    if (!response.ok) throw new Error("Unable to load site content");
    return response.json();
  })();
  return contentPromise;
};
