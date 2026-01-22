import { Page } from "playwright";
import { Logger } from "../../core/logger.js";
import { ButtonCandidate } from "../../core/types.js";
import { isRiskyButton } from "./buttonHeuristics.js";
import { safeFilePart, shortHash } from "../../core/utils.js";

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
        this.logger.info("button.click", `Klik: ${label}`, { url: beforeUrl, selector: btn.selector });

        const locator = page.locator(btn.selector);
        await locator.scrollIntoViewIfNeeded().catch(() => null);

        await Promise.race([
          locator.click({ timeout: 5000 }),
          page.waitForTimeout(5000)
        ]);

        await page.waitForTimeout(800);

        const afterUrl = page.url();
        if (afterUrl !== beforeUrl) {
          this.logger.info("nav.changed", `URL wijzigde na klik`, { url: afterUrl, selector: btn.selector });
        }

        tested++;
      } catch (e) {
        this.logger.error("button.click_failed", `Klik faalde: ${label}`, {
          url: page.url(),
          selector: btn.selector,
          meta: { error: String(e) }
        });

        await page.screenshot({ path: `output/screenshots/${actionId}.png`, fullPage: true }).catch(() => null);
      }
    }

    return tested;
  }
}
