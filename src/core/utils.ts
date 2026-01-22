import crypto from "node:crypto";

export function safeFilePart(input: string) {
  return input.replace(/[^a-zA-Z0-9._]+/g, "_").slice(0, 120);
}

export function shortHash(input: string) {
  return crypto.createHash("sha1").update(input).digest("hex").slice(0, 10);
}
