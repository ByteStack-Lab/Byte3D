/** Integer paisa → "৳450" (or "৳1,250.50" when there are paisa). Format only at display. */
export function formatTaka(paisa: number): string {
  const taka = paisa / 100
  const hasFraction = paisa % 100 !== 0
  return `৳${taka.toLocaleString('en-US', {
    minimumFractionDigits: hasFraction ? 2 : 0,
    maximumFractionDigits: 2,
  })}`
}

/** Sale percentage from compare-at price, or 0 when not on sale. */
export function discountPercent(price: number, compareAt: number | null): number {
  if (!compareAt || compareAt <= price) return 0
  return Math.round(((compareAt - price) / compareAt) * 100)
}

export function useMoney() {
  return { formatTaka, discountPercent }
}
