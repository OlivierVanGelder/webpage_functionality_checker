export function isLikelyNoiseRequest(url: string) {
  return [
    "google-analytics.com",
    "googletagmanager.com",
    "googlesyndication.com",
    "doubleclick.net",
    "salesfeed.com",
    "cloudfront.net"
  ].some(host => url.includes(host));
}
