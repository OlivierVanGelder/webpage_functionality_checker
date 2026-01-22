import { Page } from "playwright";
import { ButtonCandidate } from "../../core/types.js";
import { buttonLikeSelectors } from "./buttonSelectors.js";

export class ButtonDetector {
  async detect(page: Page): Promise<ButtonCandidate[]> {
    const candidates: ButtonCandidate[] = [];

    for (const baseSelector of buttonLikeSelectors) {
      const handles = await page.locator(baseSelector).elementHandles();

      for (let i = 0; i < handles.length; i++) {
        const handle = handles[i];
        const locator = page.locator(baseSelector).nth(i);

        const isVisible = await locator.isVisible().catch(() => false);
        if (!isVisible) continue;

        const isDisabled = await locator.isDisabled().catch(() => false);
        if (isDisabled) continue;

        const text = (await locator.innerText().catch(async () => {
          const v = await locator.getAttribute("value").catch(() => null);
          return v ?? "";
        }))?.trim();

        const ariaLabel = await locator.getAttribute("aria-label").catch(() => null);
        const role = await locator.getAttribute("role").catch(() => null);

        candidates.push({
          selector: `${baseSelector} >> nth=${i}`,
          reason: [baseSelector, "visible", "enabled"],
          text: text || undefined,
          ariaLabel: ariaLabel || undefined,
          role: role || undefined
        });

        await handle.dispose();
      }
    }

    return this.dedupe(candidates);
  }

  private dedupe(items: ButtonCandidate[]) {
    const seen = new Set<string>();
    const out: ButtonCandidate[] = [];
    for (const it of items) {
      const key = `${it.selector}|${it.text ?? ""}|${it.ariaLabel ?? ""}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(it);
    }
    return out;
  }
}
