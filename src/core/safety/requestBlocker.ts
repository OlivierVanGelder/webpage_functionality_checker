import type { BrowserContext, Request } from "playwright";
import { Logger } from "../logger.js";
import { SafetyPolicy, shouldBlockPost } from "./policy.js";

export function createBlockedRequestTracker() {
  const blocked = new Set<string>();

  return {
    mark(url: string) {
      blocked.add(url);
    },
    has(url: string) {
      return blocked.has(url);
    }
  };
}

export async function installRequestBlocker(
  context: BrowserContext,
  logger: Logger,
  policy: SafetyPolicy,
  tracker: ReturnType<typeof createBlockedRequestTracker>
) {
  await context.route("**/*", async route => {
    const req: Request = route.request();

    if (req.method() === "POST" && shouldBlockPost(req.url(), policy)) {
      tracker.mark(req.url());

      logger.warn("net.post_blocked", "POST request geblokkeerd om echte verzending te voorkomen", {
        meta: { requestUrl: req.url(), method: req.method() }
      });

      return route.abort("blockedbyclient");
    }

    return route.continue();
  });
}
