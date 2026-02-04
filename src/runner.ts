// src/runner.ts
import { createBrowser } from "./core/browser.js";
import { createContext } from "./core/context.js";
import { handleCookieConsent } from "./core/safety/cookieConsent/cookieConsentGuard.js";
import { Logger } from "./core/logger.js";
import { ButtonDetector, ButtonTester } from "./components/buttons/index.js";
import { LinkDetector, LinkTester } from "./components/links/index.js";
import { writeJsonReport } from "./reporters/jsonReporter.js";
import { RunResult } from "./core/types.js";
import { createDebug } from "./core/debug.js";

const TARGET_URL = process.argv[2] ?? "https://www.klgeurope.com/klg-transport-chemie";

const debug = createDebug(true);
const logger = new Logger();

debug(`START run voor URL: ${TARGET_URL}`);

const startedAt = new Date().toISOString();

debug("Stap 1: browser starten");
const browser = await createBrowser();

debug("Stap 2: context maken");
const context = await createContext(browser, logger);

debug("Stap 3: nieuwe pagina openen");
const page = await context.newPage();

/* Realtime debug events */
page.on("console", msg => {
  if (msg.type() === "error") debug(`PAGE console.error: ${msg.text()}`);
});
page.on("pageerror", err => {
  debug(`PAGE pageerror: ${String(err)}`);
});
page.on("requestfailed", req => {
  debug(`NET requestfailed: ${req.method()} ${req.url()} | ${req.failure()?.errorText ?? ""}`);
});

debug("Stap 4: naar startpagina");
await page.goto(TARGET_URL, { waitUntil: "domcontentloaded", timeout: 60000 });

debug("Stap 5: cookie consent afhandelen");
await handleCookieConsent(page, logger);

debug("Stap 6: buttons detecteren");
const buttonDetector = new ButtonDetector();
const buttons = await buttonDetector.detect(page);

logger.info("buttons.detected", `Gevonden buttons: ${buttons.length}`, { url: page.url() });
debug(`Buttons gevonden: ${buttons.length}`);

debug("Stap 7: buttons testen");
const buttonTester = new ButtonTester(logger);
const testedButtons = await buttonTester.testAll(page, buttons, debug);
debug(`Buttons getest: ${testedButtons}`);

debug("Stap 8: links detecteren");
const linkDetector = new LinkDetector();
const links = await linkDetector.detect(page);

logger.info("links.detected", `Gevonden links: ${links.length}`, { url: page.url() });
debug(`Links gevonden: ${links.length}`);

debug("Stap 9: links testen, met reset naar startpagina na navigatie");
const linkTester = new LinkTester(logger);
const testedLinks = await linkTester.testAll(page, links, debug, TARGET_URL);
debug(`Links getest: ${testedLinks}`);

debug("Stap 10: context sluiten");
await context.close();

debug("Stap 11: browser sluiten");
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

debug("RUN KLAAR");
console.log(`Klaar. Buttons getest: ${testedButtons}, links getest: ${testedLinks}.`);
console.log(`Report: ${reportPath}`);
