import { Browser, BrowserContext, Page } from "playwright";
import { isLikelyNoiseRequest } from "./safety/networkNoise.js";
import { Logger } from "./logger.js";

export async function createContext(browser: Browser, logger: Logger): Promise<BrowserContext> {
  const context = await browser.newContext({
    recordVideo: { dir: "output/videos", size: { width: 1280, height: 720 } }
  });

  context.on("page", (page: Page) => {
    page.on("pageerror", err => {
      logger.error("js.pageerror", String(err), { url: page.url() });
    });

    page.on("console", msg => {
      if (msg.type() === "error") {
        logger.error("js.console", msg.text(), { url: page.url() });
      }
    });

    page.on("requestfailed", req => {
      const requestUrl = req.url();

      if (isLikelyNoiseRequest(requestUrl)) {
        logger.warn("net.requestfailed_noise", req.failure()?.errorText ?? "request failed", {
          url: page.url(),
          meta: { requestUrl, method: req.method() }
        });
        return;
      }

      logger.error("net.requestfailed", req.failure()?.errorText ?? "request failed", {
        url: page.url(),
        meta: { requestUrl, method: req.method() }
      });
    });


    page.on("response", res => {
      const status = res.status();
      if (status >= 500) {
        logger.error("net.http5xx", `HTTP ${status}`, { url: page.url(), meta: { responseUrl: res.url() } });
      }
    });
  });

  return context;
}
