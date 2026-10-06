let contentPromise;

export const loadSiteContent = () => {
  if (contentPromise) return contentPromise;
  contentPromise = fetch("default-content.json", { cache: "no-store" }).then((response) => {
    if (!response.ok) throw new Error("Unable to load site content");
    return response.json();
  });
  return contentPromise;
};
