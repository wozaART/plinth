const FORMATTERS: Record<string, (amount: number) => string> = {
  ZAR: (amount) => `R ${Math.round(amount).toLocaleString("en-ZA")}`,
};

export function formatCurrency(amount: number, currencyCode: string): string {
  const format = FORMATTERS[currencyCode] ?? FORMATTERS.ZAR;
  return format(amount);
}
