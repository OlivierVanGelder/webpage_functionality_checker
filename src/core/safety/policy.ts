export type SafetyPolicy = {
  blockPostUrlPatterns: RegExp[];
};

export function defaultSafetyPolicy(): SafetyPolicy {
  return {
    blockPostUrlPatterns: [
      /\/contact\b/i,
      /contact\b/i,
      /\/lead\b/i,
      /lead\b/i,
      /\/form\b/i,
      /form\b/i,
      /\/submit\b/i,
      /submit\b/i
    ]
  };
}

export function shouldBlockPost(url: string, policy: SafetyPolicy) {
  return policy.blockPostUrlPatterns.some(rx => rx.test(url));
}
