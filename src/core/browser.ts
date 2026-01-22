import { chromium, Browser } from "playwright";

export async function createBrowser(): Promise<Browser> {
  return chromium.launch({ headless: true });
}
