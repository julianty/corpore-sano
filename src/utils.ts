export function kgToLbs(kg: number) {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number) {
  return Math.round((lbs / 2.20462) * 10) / 10;
}
