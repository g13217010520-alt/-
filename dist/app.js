const header = document.querySelector("[data-header]");

if (header) {
  const updateHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 30);
  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });
}

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealItems = document.querySelectorAll(".reveal");

if (reduceMotion || !("IntersectionObserver" in window)) {
  revealItems.forEach((item) => item.classList.add("is-visible"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "0px 0px -8%", threshold: 0.08 },
  );
  revealItems.forEach((item) => observer.observe(item));
}

document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener("click", (event) => {
    const target = document.querySelector(link.getAttribute("href"));
    if (!target) return;
    event.preventDefault();
    target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
  });
});

const productCards = document.querySelectorAll(".product-card");
const hasFinePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

if (hasFinePointer) {
  productCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const rect = card.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const edgeProximity = Math.min(1, Math.max(Math.abs(x - centerX) / centerX, Math.abs(y - centerY) / centerY));
      const glowOpacity = Math.max(0, Math.min(1, (edgeProximity - 0.3) / 0.7));
      const angle = (Math.atan2(y - centerY, x - centerX) * 180) / Math.PI + 90;

      card.style.setProperty("--cursor-angle", `${angle}deg`);
      card.style.setProperty("--glow-opacity", glowOpacity.toFixed(3));
    });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--glow-opacity", "0");
    });
  });
}

const companyGallery = document.querySelector("[data-company-gallery]");

if (companyGallery) {
  const galleryGrid = companyGallery.querySelector("[data-gallery-grid]");
  const galleryTabs = Array.from(companyGallery.querySelectorAll("[data-gallery-category]"));
  const lightbox = document.querySelector("[data-photo-lightbox]");
  const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
  const lightboxCaption = lightbox?.querySelector("[data-lightbox-caption]");
  const factorySourceIndices = [...Array.from({ length: 41 }, (_, index) => index + 1), 50, 51, 52];
  const gallerySets = {
    exhibition: { directory: "exhibition", prefix: "exhibition", count: 10, mode: "accordion" },
    factory: { directory: "factory", prefix: "factory", count: factorySourceIndices.length, sourceIndices: factorySourceIndices, mode: "masonry" },
    meeting: { directory: "meeting", prefix: "meeting", count: 1 },
    rd: { directory: "rd", prefix: "rd", count: 3 },
  };
  let activeCategory = "exhibition";
  let activeIndex = 0;
  let accordionActiveIndex = 2;
  let lightboxTrigger = null;
  let swipeStartX = 0;
  let masonryFrame = 0;

  const assetFor = (category, index) => {
    const set = gallerySets[category];
    const sourceIndex = set.sourceIndices?.[index] ?? index + 1;
    return `assets/about-gallery-v1/${set.directory}/${set.prefix}-${String(sourceIndex).padStart(2, "0")}.jpg`;
  };

  const labelFor = (category) => galleryTabs.find((tab) => tab.dataset.galleryCategory === category)?.querySelector("strong")?.textContent || "JIAYI";

  const showLightboxImage = () => {
    if (!lightboxImage || !lightboxCaption) return;
    const label = labelFor(activeCategory);
    lightboxImage.src = assetFor(activeCategory, activeIndex);
    lightboxImage.alt = `${label} ${String(activeIndex + 1).padStart(2, "0")}`;
    lightboxCaption.textContent = `${label} · ${String(activeIndex + 1).padStart(2, "0")} / ${gallerySets[activeCategory].count}`;
  };

  const openLightbox = (index, trigger) => {
    if (!lightbox) return;
    activeIndex = index;
    lightboxTrigger = trigger;
    showLightboxImage();
    lightbox.hidden = false;
    document.body.classList.add("photo-lightbox-open");
    lightbox.querySelector("[data-lightbox-close]")?.focus({ preventScroll: true });
  };

  const closeLightbox = () => {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("photo-lightbox-open");
    lightboxImage?.removeAttribute("src");
    lightboxTrigger?.focus({ preventScroll: true });
  };

  const stepLightbox = (direction) => {
    const count = gallerySets[activeCategory].count;
    activeIndex = (activeIndex + direction + count) % count;
    showLightboxImage();
  };

  const setAccordionActive = (index, focus = false) => {
    if (!galleryGrid || activeCategory !== "exhibition") return;
    const items = Array.from(galleryGrid.querySelectorAll("[data-gallery-index]"));
    if (!items.length) return;
    accordionActiveIndex = (index + items.length) % items.length;
    items.forEach((item, itemIndex) => {
      const selected = itemIndex === accordionActiveIndex;
      item.classList.toggle("is-active", selected);
      item.setAttribute("aria-current", selected ? "true" : "false");
    });
    if (focus) items[accordionActiveIndex]?.focus({ preventScroll: true });
  };

  const getMasonryColumnCount = () => {
    if (window.innerWidth >= 1500) return 5;
    if (window.innerWidth >= 1000) return 4;
    if (window.innerWidth > 760) return 3;
    return 1;
  };

  const layoutMasonry = () => {
    if (!galleryGrid || activeCategory !== "factory") return;
    const items = Array.from(galleryGrid.querySelectorAll(".company-gallery__item--masonry"));
    const width = galleryGrid.clientWidth;
    if (!items.length || !width) return;

    const columns = getMasonryColumnCount();
    const gap = columns === 1 ? 12 : 14;
    const columnWidth = (width - gap * (columns - 1)) / columns;
    const columnHeights = new Array(columns).fill(0);

    items.forEach((item) => {
      const image = item.querySelector("img");
      const ratio = image?.naturalWidth && image?.naturalHeight ? image.naturalWidth / image.naturalHeight : 4 / 3;
      const itemHeight = Math.max(columnWidth * .72, Math.min(columnWidth / ratio, columnWidth * 1.55));
      const column = columnHeights.indexOf(Math.min(...columnHeights));
      const x = column * (columnWidth + gap);
      const y = columnHeights[column];
      columnHeights[column] += itemHeight + gap;
      item.style.setProperty("--masonry-x", `${x}px`);
      item.style.setProperty("--masonry-y", `${y}px`);
      item.style.setProperty("--masonry-width", `${columnWidth}px`);
      item.style.setProperty("--masonry-height", `${itemHeight}px`);
    });

    galleryGrid.style.height = `${Math.max(...columnHeights) - gap}px`;
    requestAnimationFrame(() => items.forEach((item) => item.classList.add("is-visible")));
  };

  const scheduleMasonryLayout = () => {
    cancelAnimationFrame(masonryFrame);
    masonryFrame = requestAnimationFrame(layoutMasonry);
  };

  const renderGallery = (category) => {
    const set = gallerySets[category];
    if (!set || !galleryGrid) return;
    activeCategory = category;
    galleryTabs.forEach((tab) => {
      const selected = tab.dataset.galleryCategory === category;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });

    galleryGrid.className = "company-gallery__grid";
    galleryGrid.style.removeProperty("height");
    galleryGrid.classList.add(`company-gallery__grid--${set.mode || "standard"}`);
    galleryGrid.setAttribute("aria-label", labelFor(category));
    galleryGrid.setAttribute("role", set.mode === "accordion" ? "list" : "tabpanel");

    const fragment = document.createDocumentFragment();
    for (let index = 0; index < set.count; index += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "company-gallery__item";
      button.dataset.galleryIndex = String(index);
      button.setAttribute("aria-label", `${labelFor(category)} ${String(index + 1).padStart(2, "0")}`);
      const number = String(index + 1).padStart(2, "0");
      const image = assetFor(category, index);
      if (set.mode === "accordion") {
        const selected = index === accordionActiveIndex;
        button.classList.add("accordion-gallery__panel");
        button.classList.toggle("is-active", selected);
        button.setAttribute("role", "listitem");
        button.setAttribute("aria-current", selected ? "true" : "false");
        button.innerHTML = `<span class="accordion-gallery__frame"><img src="${image}" alt="${labelFor(category)} ${number}" loading="lazy" decoding="async"><span class="accordion-gallery__shade" aria-hidden="true"></span></span><span class="accordion-gallery__label" aria-hidden="true"><i></i><strong>${labelFor(category)} ${number}</strong></span>`;
      } else {
        if (set.mode === "masonry") {
          button.classList.add("company-gallery__item--masonry");
          button.style.setProperty("--masonry-delay", `${Math.min(index, 18) * 42}ms`);
        }
        button.innerHTML = `<img src="${image}" alt="${labelFor(category)} ${number}" loading="lazy" decoding="async"><span class="company-gallery__index">${number}</span>`;
      }
      fragment.appendChild(button);
    }
    galleryGrid.replaceChildren(fragment);
    if (set.mode === "accordion") setAccordionActive(accordionActiveIndex);
    if (set.mode === "masonry") {
      galleryGrid.querySelectorAll("img").forEach((image) => image.addEventListener("load", scheduleMasonryLayout, { once: true }));
      scheduleMasonryLayout();
    }
  };

  galleryTabs.forEach((tab) => tab.addEventListener("click", () => renderGallery(tab.dataset.galleryCategory)));
  galleryGrid?.addEventListener("click", (event) => {
    const item = event.target.closest("[data-gallery-index]");
    if (!item) return;
    const index = Number(item.dataset.galleryIndex);
    if (activeCategory === "exhibition" && !item.classList.contains("is-active")) {
      setAccordionActive(index);
      return;
    }
    openLightbox(index, item);
  });
  galleryGrid?.addEventListener("pointerover", (event) => {
    if (activeCategory !== "exhibition" || !window.matchMedia("(hover: hover)").matches) return;
    const item = event.target.closest("[data-gallery-index]");
    if (item) setAccordionActive(Number(item.dataset.galleryIndex));
  });
  galleryGrid?.addEventListener("focusin", (event) => {
    if (activeCategory !== "exhibition") return;
    const item = event.target.closest("[data-gallery-index]");
    if (item) setAccordionActive(Number(item.dataset.galleryIndex));
  });
  galleryGrid?.addEventListener("keydown", (event) => {
    if (activeCategory !== "exhibition") return;
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    setAccordionActive(accordionActiveIndex + direction, true);
  });
  if (galleryGrid && "ResizeObserver" in window) {
    let observedMasonryWidth = 0;
    new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (Math.abs(width - observedMasonryWidth) < .5) return;
      observedMasonryWidth = width;
      scheduleMasonryLayout();
    }).observe(galleryGrid);
  }
  else window.addEventListener("resize", scheduleMasonryLayout, { passive: true });
  lightbox?.querySelector("[data-lightbox-close]")?.addEventListener("click", closeLightbox);
  lightbox?.querySelector("[data-lightbox-prev]")?.addEventListener("click", () => stepLightbox(-1));
  lightbox?.querySelector("[data-lightbox-next]")?.addEventListener("click", () => stepLightbox(1));
  lightbox?.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });
  lightbox?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") swipeStartX = event.clientX;
  });
  lightbox?.addEventListener("pointerup", (event) => {
    if (event.pointerType !== "touch") return;
    const delta = event.clientX - swipeStartX;
    if (Math.abs(delta) > 55) stepLightbox(delta > 0 ? -1 : 1);
  });
  document.addEventListener("keydown", (event) => {
    if (!lightbox || lightbox.hidden) return;
    if (event.key === "Escape") closeLightbox();
    if (event.key === "ArrowLeft") stepLightbox(-1);
    if (event.key === "ArrowRight") stepLightbox(1);
  });

  renderGallery(activeCategory);
}
