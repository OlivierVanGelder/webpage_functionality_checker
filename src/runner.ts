import { createBrowser } from "./core/browser.js";
import { createContext } from "./core/context.js";
import { Logger } from "./core/logger.js";
import { ButtonDetector, ButtonTester } from "./components/buttons/index.js";
import { writeJsonReport } from "./reporters/jsonReporter.js";
import { RunResult } from "./core/types.js";

const TARGET_URL = process.argv[2] ?? "https://example.com";

const logger = new Logger();

const startedAt = new Date().toISOString();

const browser = await createBrowser();
const context = await createContext(browser, logger);
const page = await context.newPage();

await page.goto(TARGET_URL, { waitUntil: "domcontentloaded" });

const detector = new ButtonDetector();
const buttons = await detector.detect(page);

logger.info("buttons.detected", `Gevonden buttons: ${buttons.length}`, { url: page.url() });

const tester = new ButtonTester(logger);
const testedButtons = await tester.testAll(page, buttons);

await context.close();
await browser.close();

const finishedAt = new Date().toISOString();

const result: RunResult = {
  url: TARGET_URL,
  startedAt,
  finishedAt,
  findings: logger.all(),
  testedButtons
};

const reportPath = writeJsonReport(result);

console.log(`Klaar. Getest: ${testedButtons}. Report: ${reportPath}`);
