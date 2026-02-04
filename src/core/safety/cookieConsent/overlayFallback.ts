import { Page } from "playwright";

export async function removeLikelyCookieOverlays(page: Page): Promise<number> {
  return await page.evaluate(() => {
    const selectors = [
      ".cc_overlay_lock",
      ".cookie-overlay",
      ".cookie-consent-overlay",
      ".cmp-overlay",
      ".ot-pc-overlay",
      ".ot-sdk-container",
      "#onetrust-consent-sdk",
      ".onetrust-pc-dark-filter",
      ".qc-cmp2-container",
      ".qc-cmp2-ui",
      "#CybotCookiebotDialog",
      "#CookiebotWidget",
      ".uc-overlay",
      ".didomi-popup-view",
      ".didomi-popup-overlay"
    ];

    const toRemove: Element[] = [];

    for (const sel of selectors) {
      document.querySelectorAll(sel).forEach(el => toRemove.push(el));
    }

    document.querySelectorAll("body *").forEach(el => {
      const style = window.getComputedStyle(el);
      const isFixedOrAbsolute = style.position === "fixed" || style.position === "absolute";
      const blocksPointer = style.pointerEvents === "auto";
      const z = parseInt(style.zIndex || "0", 10);
      const isHighZ = Number.isFinite(z) && z >= 999;

      if (isFixedOrAbsolute && blocksPointer && isHighZ) {
        const rect = el.getBoundingClientRect();
        const coversScreen = rect.width >= window.innerWidth * 0.8 && rect.height >= window.innerHeight * 0.8;
        if (coversScreen) toRemove.push(el);
      }
    });

    const unique = Array.from(new Set(toRemove));
    unique.forEach(el => el.remove());

    return unique.length;
  });
}
