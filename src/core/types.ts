export type Severity = "info" | "warn" | "error";

export type Finding = {
  severity: Severity;
  type: string;
  message: string;
  url?: string;
  action?: string;
  selector?: string;
  meta?: Record<string, unknown>;
};

export type ButtonCandidate = {
  selector: string;
  reason: string[];
  text?: string;
  ariaLabel?: string;
  role?: string;
};

export type RunResult = {
  url: string;
  startedAt: string;
  finishedAt: string;
  findings: Finding[];
  testedButtons: number;
  testedLinks: number;
};
