// Brand colors, font, and navigation/footer details for sections added in the editor.

export const brandCss = (chrome) => {
  const classic = chrome.fontStyle === "classic";
  const playful = chrome.fontStyle === "playful";
  const heading = classic
    ? "Georgia, 'Times New Roman', serif"
    : playful
      ? "'Trebuchet MS', cursive"
      : "'Inter', 'Helvetica Neue', sans-serif";
  const body = classic
    ? "Georgia, 'Times New Roman', serif"
    : playful
      ? "'Trebuchet MS', 'Segoe UI', sans-serif"
      : "'Inter', 'Helvetica Neue', sans-serif";
  const primary = chrome.primary || "#111111";
  const secondary = chrome.secondary || "#6c5ce7";
  const background = chrome.background || "#ffffff";
  return `
    :root {
      --sclad-primary: ${primary};
      --sclad-secondary: ${secondary};
      --sclad-bg: ${background};
      --sclad-on-primary: #ffffff;
      --sclad-font: ${body};
      --sclad-heading: ${heading};
      --sclad-text: color-mix(in srgb, ${primary} 78%, #3a342c);
      --sclad-muted: color-mix(in srgb, ${primary} 42%, #6d675f);
      --sclad-line: color-mix(in srgb, ${primary} 16%, ${background});
      --sclad-soft: color-mix(in srgb, ${secondary} 20%, ${background});
      --sclad-surface: color-mix(in srgb, #ffffff 86%, ${background});
    }
    .sclad-nav, .sclad-hero, .sclad-foot { font-family: ${body} !important; }
    .sclad-nav-brand, .sclad-foot-name, .sclad-hero h1 { font-family: ${heading} !important; }
    .sclad-nav-apply, .sclad-hero-apply {
      background: ${primary} !important;
      border-color: ${primary} !important;
      color: #ffffff !important;
    }
    .sclad-hero-kicker, .sclad-foot-label { color: ${secondary} !important; }
    .sclad-nav-pages a:hover, .sclad-foot-pages a:hover { color: ${secondary} !important; }
  `;
};

const pageHref = (slug) => {
  if (!slug || slug === "/") return "./";
  return String(slug).replace(/^\//, "");
};

// Fill brand slots. Page links are written only when the site has more than one page.
export const applySectionChrome = (html, chrome) => {
  if (!html || !chrome) return html;
  try {
    const doc = new DOMParser().parseFromString(html, "text/html");
    const name = chrome.schoolName || "School Name";
    doc.querySelectorAll("[data-sclad-brand]").forEach((el) => {
      el.textContent = name;
    });
    doc.querySelectorAll("[data-sclad-logo]").forEach((el) => {
      while (el.firstChild) el.removeChild(el.firstChild);
      if (!chrome.logoUrl) return;
      const img = doc.createElement("img");
      img.setAttribute("src", chrome.logoUrl);
      img.setAttribute("alt", name);
      el.appendChild(img);
    });
    const pages = Array.isArray(chrome.pages) ? chrome.pages : [];
    doc.querySelectorAll("[data-sclad-pages]").forEach((el) => {
      while (el.firstChild) el.removeChild(el.firstChild);
      if (pages.length <= 1) return;
      pages.forEach((page) => {
        const a = doc.createElement("a");
        a.setAttribute("href", pageHref(page.slug));
        a.textContent = page.title || "Page";
        el.appendChild(a);
      });
    });
    const setHref = (sel, href) => {
      if (!href) return;
      doc.querySelectorAll(sel).forEach((el) => el.setAttribute("href", href));
    };
    setHref("[data-sclad-login]", chrome.loginHref);
    setHref("[data-sclad-apply]", chrome.applyHref);
    const setText = (sel, value) => {
      if (!value) return;
      doc.querySelectorAll(sel).forEach((el) => {
        el.textContent = value;
      });
    };
    setText("[data-sclad-email]", chrome.email);
    setText("[data-sclad-phone]", chrome.phone);
    setText("[data-sclad-address]", chrome.address);
    if (chrome.motto) {
      doc.querySelectorAll(".sclad-foot-blurb").forEach((el) => {
        el.textContent = chrome.motto;
      });
    }
    doc.querySelectorAll(".sclad-foot-bar p").forEach((el) => {
      el.textContent = `© ${name}. All rights reserved.`;
    });
    const styles = Array.from(doc.head.querySelectorAll("style"))
      .map((el) => el.outerHTML)
      .join("");
    return `${styles}${doc.body.innerHTML}`;
  } catch (_) {
    return html;
  }
};

export const isNavigationSection = (html) =>
  /\bsclad-nav\b/.test(html || "") && !/\bsclad-foot\b/.test(html || "");
