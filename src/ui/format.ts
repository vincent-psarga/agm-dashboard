export function formatAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(amount);
}

export function formatSignedAmount(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
    signDisplay: 'exceptZero',
  }).format(amount);
}

export function formatPercent(ratio: number, locale: string): string {
  return new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 1 }).format(
    ratio,
  );
}

/** Dates are stored at midnight UTC, so they are formatted in UTC as well. */
export function formatDate(date: Date, locale: string, style: 'long' | 'short' = 'long'): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: 'UTC' }).format(date);
}
