import { Page } from "playwright";

export type LinkCandidate = {
  selector: string;
  href: string;
  text?: string;
};

export class LinkDetector {
  async detect(page: Page): Promise<LinkCandidate[]> {
    const candidates: LinkCandidate[] = [];
    const links = await page.locator("a[href]").elementHandles();

    for (let i = 0; i < links.length; i++) {
      const locator = page.locator("a[href]").nth(i);

      const isVisible = await locator.isVisible().catch(() => false);
      if (!isVisible) continue;

      const href = await locator.getAttribute("href").catch(() => null);
      if (!href) continue;

      const text = (await locator.innerText().catch(() => "")).trim();

      candidates.push({
        selector: `a[href] >> nth=${i}`,
        href,
        text: text || undefined
      });
    }

    return candidates;
  }
}
