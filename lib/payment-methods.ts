export const PAYMENT_METHODS_DOCUMENT = { collection: "siteSettings", id: "payments" } as const;

export function normalizePaymentMethods(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim().slice(0, 80))
    .filter(Boolean))].slice(0, 20);
}
