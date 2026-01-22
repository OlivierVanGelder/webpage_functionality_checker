const riskyWords = [
  "verwijder",
  "delete",
  "remove",
  "annuleer",
  "cancel",
  "afmelden",
  "unsubscribe",
  "bestel",
  "order",
  "betaal",
  "pay",
  "checkout",
  "koop",
  "buy",
  "bevestig betaling"
];

export function isRiskyButton(text: string | undefined) {
  if (!text) return false;
  const t = text.trim().toLowerCase();
  return riskyWords.some(w => t.includes(w));
}
