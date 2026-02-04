import { Page } from "playwright";
import { Logger } from "../../core/logger.js";
import { ButtonCandidate } from "../../core/types.js";
import { isRiskyButton } from "./buttonHeuristics.js";
import { safeFilePart, shortHash } from "../../core/utils.js";

function looksLikeMailto(text?: string, aria?: string) {
  const t = (text ?? "").toLowerCase();
  const a = (aria ?? "").toLowerCase();
  return t.includes("mail") || t.includes("e-mail") || t.includes("email") || a.includes("mail") || a.includes("e-mail") || a.includes("email");
}

export class ButtonTester {
  constructor(private logger: Logger) {}

  async testAll(page: Page, buttons: ButtonCandidate[]) {
    let tested = 0;

    for (const btn of buttons) {
      const label = btn.text ?? btn.ariaLabel ?? btn.selector;

      if (isRiskyButton(btn.text) || isRiskyButton(btn.ariaLabel)) {
        this.logger.warn("button.skipped_risky", `Overgeslagen: mogelijk risicovol (${label})`, {
          url: page.url(),
          selector: btn.selector,
          meta: { text: btn.text, ariaLabel: btn.ariaLabel }
        });
        continue;
      }

      const beforeUrl = page.url();
      const actionId = `${safeFilePart(label)}_${shortHash(btn.selector)}`;

      try {
        const locator = page.locator(btn.selector);
        await locator.scrollIntoViewIfNeeded().catch(() => null);

        const href = await locator.evaluate(el => {
          const a = (el as HTMLElement).closest("a");
          return a ? a.getAttribute("href") : null;
        }).catch(() => null);

        const isMailto = typeof href === "string" && href.toLowerCase().startsWith("mailto:");
        const mailIntent = isMailto || looksLikeMailto(btn.text, btn.ariaLabel);

        if (isMailto) {
          this.logger.info("button.mailto_detected", `Mailto gedetecteerd (${label})`, {
            url: beforeUrl,
            selector: btn.selector,
            meta: { href }
          });
        } else if (mailIntent) {
          this.logger.info("button.mail_intent", `Mail intent vermoedelijk aanwezig (${label})`, {
            url: beforeUrl,
            selector: btn.selector
          });
        } else {
          this.logger.info("button.click", `Klik: ${label}`, { url: beforeUrl, selector: btn.selector });
        }

        await locator.click({ timeout: 5000, noWaitAfter: true });

        await page.waitForTimeout(800);

        const afterUrl = page.url();
        if (afterUrl !== beforeUrl) {
          this.logger.info("nav.changed", "URL wijzigde na klik", { url: afterUrl, selector: btn.selector });
        }

        tested++;
      } catch (e) {
        const msg = String(e);

        if (msg.toLowerCase().includes("mailto") || msg.toLowerCase().includes("external")) {
          this.logger.warn("button.mailto_click_behavior", `Klik leidde tot externe mail actie, toegestaan (${label})`, {
            url: page.url(),
            selector: btn.selector,
            meta: { error: msg }
          });
          tested++;
          continue;
        }

        this.logger.error("button.click_failed", `Klik faalde: ${label}`, {
          url: page.url(),
          selector: btn.selector,
          meta: { error: msg }
        });

        await page.screenshot({ path: `output/screenshots/${actionId}.png`, fullPage: true }).catch(() => null);
      }
    }

    return tested;
  }
}
