export type CookieConsentResult =
  | { status: "no_banner_detected" }
  | { status: "rejected_via_button"; buttonText: string }
  | { status: "rejected_via_preferences"; buttonText: string }
  | { status: "forced_overlay_removed"; removedCount: number }
  | { status: "failed"; reason: string };

export type CookieConsentOptions = {
  timeoutMs?: number;
  clickTimeoutMs?: number;
  postClickWaitMs?: number;
};
