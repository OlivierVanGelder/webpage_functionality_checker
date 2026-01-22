import { defineConfig } from "playwright";

export default defineConfig({
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    video: "on",
    trace: "on",
    screenshot: "only-on-failure"
  }
});
