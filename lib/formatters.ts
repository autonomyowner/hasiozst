export function formatPrice(price: number): string {
  return `${price.toLocaleString("fr-DZ")} DA`;
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
  return date.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
