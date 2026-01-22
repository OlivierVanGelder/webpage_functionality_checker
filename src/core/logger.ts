import { Finding } from "./types.js";

export class Logger {
  private findings: Finding[] = [];

  info(type: string, message: string, extra?: Partial<Finding>) {
    this.findings.push({ severity: "info", type, message, ...extra });
  }

  warn(type: string, message: string, extra?: Partial<Finding>) {
    this.findings.push({ severity: "warn", type, message, ...extra });
  }

  error(type: string, message: string, extra?: Partial<Finding>) {
    this.findings.push({ severity: "error", type, message, ...extra });
  }

  all() {
    return this.findings;
  }

  hasErrors() {
    return this.findings.some(f => f.severity === "error");
  }
}
