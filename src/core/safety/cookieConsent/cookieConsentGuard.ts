import { Page } from "playwright";
import { Logger } from "../../logger.js";
import type { CookieConsentOptions, CookieConsentResult } from "./types.js";
import {
  matchesAny,
  normalizeText,
  rejectMatchers,
  preferencesMatchers
} from "./textmatchers.js";
import { removeLikelyCookieOverlays } from "./overlayFallback.js";

const defaultOptions: Required<CookieConsentOptions> = {
  timeoutMs: 9000,
  clickTimeoutMs: 3500,
  postClickWaitMs: 650
};

type ButtonInfo = {
  index: number;
  text: string;
};

async function getVisibleButtons(page: Page): Promise<ButtonInfo[]> {
  const locator = page.locator("button, [role='button'], input[type='button'], input[type='submit']");
  const count = await locator.count().catch(() => 0);

  const results: ButtonInfo[] = [];
  for (let i = 0; i < count; i++) {
    const btn = locator.nth(i);

    const visible = await btn.isVisible().catch(() => false);
    if (!visible) continue;

    const rawText = await btn.innerText().catch(async () => {
      const v = await btn.getAttribute("value").catch(() => null);
      return v ?? "";
    });

    const text = normalizeText(rawText || "");
    if (!text) continue;

    results.push({ index: i, text });
  }

  return results;
}

async function clickButtonIndex(page: Page, index: number, clickTimeoutMs: number) {
  const locator = page.locator("button, [role='button'], input[type='button'], input[type='submit']").nth(index);
  await locator.scrollIntoViewIfNeeded().catch(() => null);
  await locator.click({ timeout: clickTimeoutMs }).catch(() => null);
}

async function hasLikelyConsentOverlay(page: Page): Promise<boolean> {
  const selectors = [
    ".cc_overlay_lock",
    "#onetrust-consent-sdk",
    ".onetrust-pc-dark-filter",
    ".ot-pc-overlay",
    ".ot-sdk-container",
    "#CybotCookiebotDialog",
    ".qc-cmp2-container",
    ".qc-cmp2-ui",
    ".uc-overlay",
    ".didomi-popup-overlay",
    ".didomi-popup-view",
    ".cookie-overlay",
    ".cookie-consent-overlay",
    ".cmp-overlay"
  ];

  for (const sel of selectors) {
    const c = await page.locator(sel).count().catch(() => 0);
    if (c > 0) return true;
  }

  return false;
}

async function tryRejectDirect(page: Page, logger: Logger, opt: Required<CookieConsentOptions>): Promise<CookieConsentResult | null> {
  const buttons = await getVisibleButtons(page);

  const rejectBtn = buttons.find(b => matchesAny(b.text, rejectMatchers));
  if (!rejectBtn) return null;

  logger.info("cookie.reject_attempt", "Probeer cookie consent te weigeren via zichtbare knop", {
    url: page.url(),
    meta: { buttonText: rejectBtn.text }
  });

  await clickButtonIndex(page, rejectBtn.index, opt.clickTimeoutMs);
  await page.waitForTimeout(opt.postClickWaitMs);

  const stillThere = await hasLikelyConsentOverlay(page);
  if (!stillThere) {
    return { status: "rejected_via_button", buttonText: rejectBtn.text };
  }

  return null;
}

async function tryRejectViaPreferences(page: Page, logger: Logger, opt: Required<CookieConsentOptions>): Promise<CookieConsentResult | null> {
  const buttons = await getVisibleButtons(page);

  const prefBtn = buttons.find(b => matchesAny(b.text, preferencesMatchers));
  if (!prefBtn) return null;

  logger.info("cookie.preferences_attempt", "Probeer voorkeuren te openen om cookies te weigeren", {
    url: page.url(),
    meta: { buttonText: prefBtn.text }
  });

  await clickButtonIndex(page, prefBtn.index, opt.clickTimeoutMs);
  await page.waitForTimeout(opt.postClickWaitMs);

  const buttonsAfter = await getVisibleButtons(page);
  const rejectBtn = buttonsAfter.find(b => matchesAny(b.text, rejectMatchers));
  if (!rejectBtn) return null;

  logger.info("cookie.reject_in_preferences_attempt", "Probeer cookies te weigeren vanuit voorkeuren", {
    url: page.url(),
    meta: { buttonText: rejectBtn.text }
  });

  await clickButtonIndex(page, rejectBtn.index, opt.clickTimeoutMs);
  await page.waitForTimeout(opt.postClickWaitMs);

  const stillThere = await hasLikelyConsentOverlay(page);
  if (!stillThere) {
    return { status: "rejected_via_preferences", buttonText: rejectBtn.text };
  }

  return null;
}

export async function handleCookieConsent(
  page: Page,
  logger: Logger,
  options?: CookieConsentOptions
): Promise<CookieConsentResult> {
  const opt: Required<CookieConsentOptions> = { ...defaultOptions, ...(options ?? {}) };

  const start = Date.now();
  let detectedLogged = false;

  while (Date.now() - start < opt.timeoutMs) {
    const overlayPresent = await hasLikelyConsentOverlay(page).catch(() => false);
    const buttons = await getVisibleButtons(page).catch(() => []);

    const looksLikeConsentUi =
      overlayPresent ||
      buttons.some(b => matchesAny(b.text, rejectMatchers) || matchesAny(b.text, preferencesMatchers));

    if (!looksLikeConsentUi) {
      await page.waitForTimeout(200);
      continue;
    }

    if (!detectedLogged) {
      detectedLogged = true;
      logger.info("cookie.detected", "Cookie popup of overlay gedetecteerd", { url: page.url() });
    }

    const direct = await tryRejectDirect(page, logger, opt);
    if (direct) {
      logger.info("cookie.resolved", "Cookie consent afgehandeld", {
        url: page.url(),
        meta: { status: direct.status, buttonText: (direct as any).buttonText }
      });
      return direct;
    }

    const viaPref = await tryRejectViaPreferences(page, logger, opt);
    if (viaPref) {
      logger.info("cookie.resolved", "Cookie consent afgehandeld", {
        url: page.url(),
        meta: { status: viaPref.status, buttonText: (viaPref as any).buttonText }
      });
      return viaPref;
    }

    await page.waitForTimeout(250);
  }

  const overlayPresent = await hasLikelyConsentOverlay(page).catch(() => false);
  if (!overlayPresent) {
    return { status: "no_banner_detected" };
  }

  logger.warn("cookie.fallback", "Cookie consent niet klikbaar, probeer overlay te verwijderen zodat testen door kan gaan", {
    url: page.url()
  });

  const removedCount = await removeLikelyCookieOverlays(page).catch(() => 0);
  await page.waitForTimeout(200);

  const stillThere = await hasLikelyConsentOverlay(page).catch(() => false);
  if (!stillThere && removedCount > 0) {
    logger.warn("cookie.forced_overlay_removed", "Cookie overlay verwijderd om testen mogelijk te maken", {
      url: page.url(),
      meta: { removedCount }
    });
    return { status: "forced_overlay_removed", removedCount };
  }

  logger.warn("cookie.failed", "Cookie consent kon niet worden afgehandeld", {
    url: page.url(),
    meta: { removedCount }
  });

  return { status: "failed", reason: "Cookie consent kon niet worden afgehandeld of overlay bleef actief" };
}