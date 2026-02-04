export function normalizeText(input: string) {
  return input
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export const rejectMatchers: RegExp[] = [
  /weigeren/i,
  /alles weigeren/i,
  /alle weigeren/i,
  /alleen noodzak/i,
  /noodzakelijk/i,
  /functioneel(?!\s*testen)/i,
  /reject/i,
  /decline/i,
  /refuse/i,
  /deny/i,
  /disagree/i,
  /only necessary/i,
  /necessary only/i,
  /essential only/i
];

export const preferencesMatchers: RegExp[] = [
  /voorkeur/i,
  /instelling/i,
  /beheer/i,
  /manage/i,
  /preferences/i,
  /settings/i,
  /options/i,
  /customize/i
];

export const acceptMatchers: RegExp[] = [
  /accepteren/i,
  /alles toestaan/i,
  /toestaan/i,
  /accept/i,
  /allow/i,
  /agree/i
];

export function matchesAny(text: string, patterns: RegExp[]) {
  return patterns.some(p => p.test(text));
}
