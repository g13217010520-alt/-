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
    factory: { directory: "factory", prefix: "factory", count: factorySourceIndices.length, sourceIndices: factorySourceIndices, mode: "depth" },
    meeting: { directory: "meeting", prefix: "meeting", count: 1 },
    rd: { directory: "rd", prefix: "rd", count: 3 },
  };
  const requestedGallery = new URLSearchParams(window.location.search).get("gallery");
  let activeCategory = gallerySets[requestedGallery] ? requestedGallery : "exhibition";
  let activeIndex = 0;
  let accordionActiveIndex = 2;
  let lightboxTrigger = null;
  let swipeStartX = 0;
  let depthActiveIndex = 0;
  let depthAutoplayTimer = 0;
  let depthWheelLocked = false;
  let depthPointer = null;
  let depthSuppressClick = false;
  let depthHovering = false;
  let depthFocused = false;

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

  const stopDepthAutoplay = () => {
    window.clearInterval(depthAutoplayTimer);
    depthAutoplayTimer = 0;
  };

  const layoutDepthCarousel = () => {
    if (!galleryGrid || activeCategory !== "factory") return;
    const cards = Array.from(galleryGrid.querySelectorAll(".depth-carousel__card"));
    const dots = Array.from(galleryGrid.querySelectorAll(".depth-carousel__dot"));
    const count = cards.length;
    if (!count) return;

    const compact = window.matchMedia("(max-width: 760px)").matches;
    const spread = compact ? 32 : 78;
    const depth = compact ? 125 : 205;
    const tilt = compact ? 14 : 21;
    const visibleCards = 4;

    cards.forEach((card, index) => {
      const distance = (index - depthActiveIndex + count) % count;
      const shown = distance <= visibleCards;
      const brightness = Math.max(.24, 1 - distance * .19);
      const blur = Math.min(6, distance * 1.45);
      card.style.setProperty("--depth-x", `${distance * spread}px`);
      card.style.setProperty("--depth-z", `${distance * -depth}px`);
      card.style.setProperty("--depth-rotate", `${Math.min(distance, 1) * tilt}deg`);
      card.style.setProperty("--depth-opacity", shown ? "1" : "0");
      card.style.setProperty("--depth-brightness", brightness.toFixed(2));
      card.style.setProperty("--depth-blur", `${blur}px`);
      card.style.zIndex = String(1000 - distance);
      card.style.pointerEvents = shown ? "auto" : "none";
      card.classList.toggle("is-active", distance === 0);
      card.setAttribute("aria-hidden", distance === 0 ? "false" : "true");
      card.tabIndex = distance === 0 ? 0 : -1;
      card.querySelector(".depth-carousel__tint")?.style.setProperty("opacity", Math.min(.82, distance * .18).toFixed(2));
    });

    dots.forEach((dot, index) => {
      const selected = index === depthActiveIndex;
      dot.classList.toggle("is-active", selected);
      dot.setAttribute("aria-selected", String(selected));
    });
    const current = galleryGrid.querySelector("[data-depth-current]");
    if (current) current.textContent = String(depthActiveIndex + 1).padStart(2, "0");
  };

  const setDepthActive = (index, focus = false) => {
    const count = gallerySets.factory.count;
    depthActiveIndex = (index + count) % count;
    layoutDepthCarousel();
    if (focus) galleryGrid?.querySelector(`.depth-carousel__card[data-gallery-index="${depthActiveIndex}"]`)?.focus({ preventScroll: true });
  };

  const startDepthAutoplay = () => {
    stopDepthAutoplay();
    if (activeCategory !== "factory" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    depthAutoplayTimer = window.setInterval(() => {
      if (!depthHovering && !depthFocused && !depthPointer) setDepthActive(depthActiveIndex + 1);
    }, 3200);
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
    galleryGrid.removeAttribute("tabindex");
    galleryGrid.removeAttribute("aria-roledescription");
    galleryGrid.classList.add(`company-gallery__grid--${set.mode || "standard"}`);
    galleryGrid.setAttribute("aria-label", labelFor(category));
    galleryGrid.setAttribute("role", set.mode === "accordion" ? "list" : set.mode === "depth" ? "group" : "tabpanel");
    stopDepthAutoplay();

    if (set.mode === "depth") {
      galleryGrid.tabIndex = 0;
      galleryGrid.setAttribute("aria-roledescription", "carousel");
      const stage = document.createElement("div");
      stage.className = "depth-carousel__stage";
      for (let index = 0; index < set.count; index += 1) {
        const number = String(index + 1).padStart(2, "0");
        const card = document.createElement("button");
        card.type = "button";
        card.className = "company-gallery__item depth-carousel__card";
        card.dataset.galleryIndex = String(index);
        card.setAttribute("aria-label", `${labelFor(category)} ${number}`);
        card.setAttribute("aria-roledescription", "slide");
        card.innerHTML = `<img class="depth-carousel__img" src="${assetFor(category, index)}" alt="${labelFor(category)} ${number}" loading="${index < 5 ? "eager" : "lazy"}" decoding="async"><span class="depth-carousel__tint" aria-hidden="true"></span><span class="company-gallery__index">${number}</span>`;
        stage.appendChild(card);
      }

      const controls = document.createElement("div");
      controls.className = "depth-carousel__controls";
      controls.innerHTML = `<button type="button" class="depth-carousel__arrow depth-carousel__arrow--prev" aria-label="上一张照片" data-depth-step="-1">←</button><p class="depth-carousel__counter"><strong data-depth-current>${String(depthActiveIndex + 1).padStart(2, "0")}</strong><span>/ ${String(set.count).padStart(2, "0")}</span></p><button type="button" class="depth-carousel__arrow depth-carousel__arrow--next" aria-label="下一张照片" data-depth-step="1">→</button>`;

      const dots = document.createElement("div");
      dots.className = "depth-carousel__dots";
      dots.setAttribute("role", "tablist");
      dots.setAttribute("aria-label", "工厂照片");
      for (let index = 0; index < set.count; index += 1) {
        const dot = document.createElement("button");
        dot.type = "button";
        dot.className = "depth-carousel__dot";
        dot.dataset.depthIndex = String(index);
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", `转到第 ${index + 1} 张照片`);
        dots.appendChild(dot);
      }
      galleryGrid.replaceChildren(stage, controls, dots);
      requestAnimationFrame(() => {
        layoutDepthCarousel();
        startDepthAutoplay();
      });
      return;
    }

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
        button.innerHTML = `<img src="${image}" alt="${labelFor(category)} ${number}" loading="lazy" decoding="async"><span class="company-gallery__index">${number}</span>`;
      }
      fragment.appendChild(button);
    }
    galleryGrid.replaceChildren(fragment);
    if (set.mode === "accordion") setAccordionActive(accordionActiveIndex);
  };

  galleryTabs.forEach((tab) => tab.addEventListener("click", () => renderGallery(tab.dataset.galleryCategory)));
  galleryGrid?.addEventListener("click", (event) => {
    const depthStep = event.target.closest("[data-depth-step]");
    if (depthStep) {
      setDepthActive(depthActiveIndex + Number(depthStep.dataset.depthStep));
      startDepthAutoplay();
      return;
    }
    const depthDot = event.target.closest("[data-depth-index]");
    if (depthDot) {
      setDepthActive(Number(depthDot.dataset.depthIndex));
      startDepthAutoplay();
      return;
    }
    const item = event.target.closest("[data-gallery-index]");
    if (!item) return;
    const index = Number(item.dataset.galleryIndex);
    if (activeCategory === "factory") {
      if (depthSuppressClick) {
        depthSuppressClick = false;
        return;
      }
      if (index !== depthActiveIndex) {
        setDepthActive(index);
        startDepthAutoplay();
        return;
      }
    }
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
    if (activeCategory === "factory") {
      depthFocused = true;
      return;
    }
    if (activeCategory !== "exhibition") return;
    const item = event.target.closest("[data-gallery-index]");
    if (item) setAccordionActive(Number(item.dataset.galleryIndex));
  });
  galleryGrid?.addEventListener("focusout", (event) => {
    if (activeCategory !== "factory" || galleryGrid.contains(event.relatedTarget)) return;
    depthFocused = false;
  });
  galleryGrid?.addEventListener("mouseenter", () => {
    if (activeCategory === "factory") depthHovering = true;
  });
  galleryGrid?.addEventListener("mouseleave", () => {
    depthHovering = false;
  });
  galleryGrid?.addEventListener("keydown", (event) => {
    if (activeCategory === "factory") {
      if (!["ArrowRight", "ArrowLeft", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      if (event.key === "Home") setDepthActive(0, true);
      else if (event.key === "End") setDepthActive(gallerySets.factory.count - 1, true);
      else setDepthActive(depthActiveIndex + (event.key === "ArrowRight" ? 1 : -1), true);
      startDepthAutoplay();
      return;
    }
    if (activeCategory !== "exhibition") return;
    if (!["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"].includes(event.key)) return;
    event.preventDefault();
    const direction = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    setAccordionActive(accordionActiveIndex + direction, true);
  });
  galleryGrid?.addEventListener("wheel", (event) => {
    if (activeCategory !== "factory" || depthWheelLocked) return;
    event.preventDefault();
    const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    if (Math.abs(delta) < 4) return;
    depthWheelLocked = true;
    setDepthActive(depthActiveIndex + (delta > 0 ? 1 : -1));
    startDepthAutoplay();
    window.setTimeout(() => { depthWheelLocked = false; }, 420);
  }, { passive: false });
  galleryGrid?.addEventListener("pointerdown", (event) => {
    if (activeCategory !== "factory" || event.target.closest(".depth-carousel__controls,.depth-carousel__dots")) return;
    depthPointer = { id: event.pointerId, startX: event.clientX, x: event.clientX, moved: false };
  });
  galleryGrid?.addEventListener("pointermove", (event) => {
    if (!depthPointer || depthPointer.id !== event.pointerId) return;
    depthPointer.x = event.clientX;
    if (Math.abs(depthPointer.x - depthPointer.startX) > 8) {
      depthPointer.moved = true;
      galleryGrid.setPointerCapture?.(event.pointerId);
    }
  });
  const finishDepthPointer = (event) => {
    if (!depthPointer || depthPointer.id !== event.pointerId) return;
    const distance = depthPointer.x - depthPointer.startX;
    const moved = depthPointer.moved;
    depthPointer = null;
    if (!moved) return;
    depthSuppressClick = true;
    window.setTimeout(() => { depthSuppressClick = false; }, 120);
    if (Math.abs(distance) > 34) setDepthActive(depthActiveIndex + (distance < 0 ? 1 : -1));
    startDepthAutoplay();
  };
  galleryGrid?.addEventListener("pointerup", finishDepthPointer);
  galleryGrid?.addEventListener("pointercancel", finishDepthPointer);
  window.addEventListener("resize", layoutDepthCarousel, { passive: true });
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
