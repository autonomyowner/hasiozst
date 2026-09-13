/**
 * Saudi Arabia formatting. Prices are Saudi Riyal; Latin digits are used
 * throughout because the UI is still English — switch the locale to `ar-SA`
 * as part of the Arabic/RTL migration, not before.
 */
export function formatPrice(price: number): string {
  return `SAR ${price.toLocaleString("en-US")}`;
}

/** Price with the unit a booking is sold by, e.g. "SAR 2,450 / night". */
export function formatRate(price: number, unit: "night" | "person" | "day" = "night"): string {
  return `${formatPrice(price)} / ${unit}`;
}

export function formatCompactNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

export function formatDate(dateInput: string | number): string {
  const date = typeof dateInput === "number" ? new Date(dateInput) : new Date(dateInput);
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
