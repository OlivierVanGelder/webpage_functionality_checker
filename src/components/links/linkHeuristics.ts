export function isMailto(href?: string | null) {
  return typeof href === "string" && href.toLowerCase().startsWith("mailto:");
}

export function isTel(href?: string | null) {
  return typeof href === "string" && href.toLowerCase().startsWith("tel:");
}

export function isAnchorOnly(href?: string | null) {
  return typeof href === "string" && href.startsWith("#");
}

export function isJavascriptLink(href?: string | null) {
  return typeof href === "string" && href.toLowerCase().startsWith("javascript:");
}

export function isExternalLink(href: string, baseUrl: string) {
  try {
    const linkUrl = new URL(href, baseUrl);
    const base = new URL(baseUrl);
    return linkUrl.origin !== base.origin;
  } catch {
    return false;
  }
}
