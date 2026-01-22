import fs from "node:fs";
import path from "node:path";
import { RunResult } from "../core/types.js";

export function writeJsonReport(result: RunResult) {
  fs.mkdirSync("output/reports", { recursive: true });
  const file = path.join("output/reports", "report.json");
  fs.writeFileSync(file, JSON.stringify(result, null, 2), "utf-8");
  return file;
}
