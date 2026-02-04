import { createBrowser } from "./core/browser.js";
import { createContext } from "./core/context.js";
import { handleCookieConsent } from "./core/safety/cookieConsent/cookieConsentGuard.js";
import { Logger } from "./core/logger.js";
import { ButtonDetector, ButtonTester } from "./components/buttons/index.js";
import { writeJsonReport } from "./reporters/jsonReporter.js";
import { RunResult } from "./core/types.js";
import { LinkDetector, LinkTester } from "./components/links/index.js";

const TARGET_URL = process.argv[2] ?? "https://www.klgeurope.com/klg-transport-chemie";

const logger = new Logger();

const startedAt = new Date().toISOString();

const browser = await createBrowser();
const context = await createContext(browser, logger);
const page = await context.newPage();

await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });
await handleCookieConsent(page, logger);
const detector = new ButtonDetector();
const buttons = await detector.detect(page);

logger.info("buttons.detected", `Gevonden buttons: ${buttons.length}`, { url: page.url() });

const tester = new ButtonTester(logger);
const testedButtons = await tester.testAll(page, buttons);

const linkDetector = new LinkDetector();
const links = await linkDetector.detect(page);

logger.info("links.detected", `Gevonden links: ${links.length}`, { url: page.url() });

const linkTester = new LinkTester(logger);
const testedLinks = await linkTester.testAll(page, links);

await context.close();
await browser.close();

const finishedAt = new Date().toISOString();

const result: RunResult = {
  url: TARGET_URL,
  startedAt,
  finishedAt,
  findings: logger.all(),
  testedButtons,
  testedLinks
};

const reportPath = writeJsonReport(result);

console.log(`Klaar. Getest: ${testedButtons}. Report: ${reportPath}`);
