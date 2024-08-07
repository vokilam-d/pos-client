export const roundPriceNumber = (sum: number): number => {
  return Math.round(sum * 100) / 100;
}