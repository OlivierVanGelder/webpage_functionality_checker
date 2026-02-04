// src/components/links/linkTester.ts
import { Page } from "playwright";
import { Logger } from "../../core/logger.js";
import type { DebugFn } from "../../core/debug.js";
import { handleCookieConsent } from "../../core/safety/cookieConsent/cookieConsentGuard.js";
import type { LinkCandidate } from "./linkDetector.js";
import {
  isMailto,
  isTel,
  isAnchorOnly,
  isJavascriptLink,
  isExternalLink
} from "./linkHeuristics.js";

function sameUrlIgnoringHash(a: string, b: string) {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    ua.hash = "";
    ub.hash = "";
    return ua.toString() === ub.toString();
  } catch {
    return a === b;
  }
}

async function safeCloseExtraPages(page: Page) {
  const ctx = page.context();
  const pages = ctx.pages();
  for (const p of pages) {
    if (p !== page) await p.close().catch(() => null);
  }
}

type LinkStats = {
  totalCandidates: number;
  tested: number;

  skipped_anchor: number;
  skipped_javascript: number;
  intent: number;

  click_failed: number;
  no_navigation: number;

  external_clicked: number;
  external_skipped: number;

  popup_closed: number;
  reset_count: number;
};

export class LinkTester {
  constructor(private logger: Logger) {}

  async testAll(page: Page, links: LinkCandidate[], debug?: DebugFn, initialUrl?: string) {
    const stats: LinkStats = {
      totalCandidates: links.length,
      tested: 0,

      skipped_anchor: 0,
      skipped_javascript: 0,
      intent: 0,

      click_failed: 0,
      no_navigation: 0,

      external_clicked: 0,
      external_skipped: 0,

      popup_closed: 0,
      reset_count: 0
    };

    let index = 0;

    for (const link of links) {
      index++;

      const label = link.text ?? link.href;
      debug?.(`LINK ${index}/${links.length}: start | label="${label}" | href=${link.href} | selector=${link.selector}`);

      if (isAnchorOnly(link.href)) {
        stats.skipped_anchor++;

        debug?.(`link.skipped_anchor | href=${link.href}`);

        this.logger.info("link.skipped_anchor", `Overgeslagen ankerlink (${label})`, {
          url: page.url(),
          meta: { href: link.href }
        });
        continue;
      }

      if (isJavascriptLink(link.href)) {
        stats.skipped_javascript++;

        debug?.(`link.skipped_javascript | href=${link.href}`);

        this.logger.info("link.skipped_javascript", `Overgeslagen javascript link (${label})`, {
          url: page.url(),
          meta: { href: link.href }
        });
        continue;
      }

      if (isMailto(link.href) || isTel(link.href)) {
        stats.intent++;

        debug?.(`link.intent | href=${link.href}`);

        this.logger.info("link.intent", `Contact intent (${label})`, {
          url: page.url(),
          meta: { href: link.href }
        });

        stats.tested++;
        continue;
      }

      const beforeUrl = page.url();
      const external = isExternalLink(link.href, beforeUrl);

      try {
        if (external) {
          stats.external_clicked++;
        }

        debug?.(`link.click | external=${external ? "ja" : "nee"} | before=${beforeUrl} | href=${link.href}`);

        this.logger.info("link.click", `Klik link (${label})`, {
          url: beforeUrl,
          meta: { href: link.href, external }
        });

        const popupPromise = page.waitForEvent("popup", { timeout: 1500 }).catch(() => null);

        await page.locator(link.selector).click({ timeout: 5000, noWaitAfter: true });

        const popup = await popupPromise;
        if (popup) {
          stats.popup_closed++;
          debug?.(`link.popup_closed | href=${link.href}`);
          await popup.close().catch(() => null);
        }

        await page.waitForTimeout(800);

        const afterUrl = page.url();
        debug?.(`LINK ${index}/${links.length}: after click | after=${afterUrl}`);

        const navigated = !sameUrlIgnoringHash(afterUrl, beforeUrl);

        if (!navigated && !external) {
          stats.no_navigation++;

          debug?.(`link.no_navigation | href=${link.href} | url=${beforeUrl}`);

          this.logger.warn("link.no_navigation", "Klik gaf geen navigatie", {
            url: beforeUrl,
            meta: { href: link.href }
          });
        }

        stats.tested++;

        if (initialUrl) {
          const now = page.url();
          if (!sameUrlIgnoringHash(now, initialUrl)) {
            stats.reset_count++;

            debug?.(`LINK ${index}/${links.length}: reset naar startpagina | target=${initialUrl} | current=${now}`);

            await safeCloseExtraPages(page);
            await page.goto(initialUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
            await handleCookieConsent(page, this.logger);

            debug?.(`LINK ${index}/${links.length}: reset klaar | current=${page.url()}`);
          }
        }
      } catch (e) {
        const msg = String(e);

        stats.click_failed++;

        debug?.(`link.click_failed | href=${link.href} | error=${msg}`);

        this.logger.error("link.click_failed", `Klik faalde (${label})`, {
          url: page.url(),
          meta: { href: link.href, error: msg }
        });

        if (initialUrl) {
          const now = page.url();
          if (!sameUrlIgnoringHash(now, initialUrl)) {
            stats.reset_count++;

            debug?.(`LINK ${index}/${links.length}: reset na fout | target=${initialUrl} | current=${now}`);

            await safeCloseExtraPages(page);
            await page.goto(initialUrl, { waitUntil: "domcontentloaded", timeout: 60000 }).catch(() => null);
            await handleCookieConsent(page, this.logger).catch(() => null);

            debug?.(`LINK ${index}/${links.length}: reset klaar | current=${page.url()}`);
          }
        }
      }
    }

    debug?.(`LINKS: klaar | getest=${stats.tested} | totaal=${stats.totalCandidates}`);
    debug?.(
      `LINKS summary | tested=${stats.tested} | skipped_anchor=${stats.skipped_anchor} | skipped_javascript=${stats.skipped_javascript} | intent=${stats.intent} | no_navigation=${stats.no_navigation} | click_failed=${stats.click_failed} | resets=${stats.reset_count}`
    );

    this.logger.info("links.summary", "Samenvatting link tests", {
      url: page.url(),
      meta: {
        totalCandidates: stats.totalCandidates,
        tested: stats.tested,
        skipped_anchor: stats.skipped_anchor,
        skipped_javascript: stats.skipped_javascript,
        intent: stats.intent,
        no_navigation: stats.no_navigation,
        click_failed: stats.click_failed,
        external_clicked: stats.external_clicked,
        external_skipped: stats.external_skipped,
        popup_closed: stats.popup_closed,
        reset_count: stats.reset_count
      }
    });

    return stats.tested;
  }
}
