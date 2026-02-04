import { Page } from "playwright";
import { Logger } from "../../core/logger.js";
import { LinkCandidate } from "./linkDetector.js";
import {
  isMailto,
  isTel,
  isAnchorOnly,
  isJavascriptLink,
  isExternalLink
} from "./linkHeuristics.js";
import type { DebugFn } from "../../core/debug.js";




export class LinkTester {
  constructor(private logger: Logger) {}

  async testAll(page: Page, links: LinkCandidate[], debug?: DebugFn) {
    let tested = 0;

    for (const link of links) {
      const label = link.text ?? link.href;

      if (
        isAnchorOnly(link.href) ||
        isJavascriptLink(link.href)
      ) {
        this.logger.info("link.skipped_non_nav", `Overgeslagen link (${label})`, {
          url: page.url(),
          meta: { href: link.href }
        });
        continue;
      }

      if (isMailto(link.href) || isTel(link.href)) {
        this.logger.info("link.intent", `Contact intent (${label})`, {
          url: page.url(),
          meta: { href: link.href }
        });
        tested++;
        continue;
      }

      const beforeUrl = page.url();

      try {
        this.logger.info("link.click", `Klik link (${label})`, {
          url: beforeUrl,
          meta: { href: link.href }
        });

        await page.locator(link.selector).click({ timeout: 5000, noWaitAfter: true });

        await page.waitForTimeout(800);

        const afterUrl = page.url();

        if (afterUrl === beforeUrl && !isExternalLink(link.href, beforeUrl)) {
          this.logger.warn("link.no_navigation", "Klik gaf geen navigatie", {
            url: beforeUrl,
            meta: { href: link.href }
          });
        }

        tested++;
      } catch (e) {
        this.logger.error("link.click_failed", `Klik faalde (${label})`, {
          url: page.url(),
          meta: { href: link.href, error: String(e) }
        });
      }
    }

    return tested;
  }
}
