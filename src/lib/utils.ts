/**
 * Converts kilograms to pounds, rounding to the nearest plate increment.
 * @param {number} kg - The weight in kilograms.
 * @returns {number} The equivalent weight in pounds, rounded to the nearest plate increment.
 */
export function kgToLbs(kg: number) {
  let remainder = kg;
  let computed = 0;
  const plates = [25, 20, 15, 10, 5, 2.5, 1.25];
  const convertedPlates = [55, 45, 35, 25, 10, 5, 2.5];
  for (let i = 0; i < plates.length; i++) {
    if (remainder < 1.25) return computed;
    if (remainder < plates[i]) continue;
    const numPlates = Math.floor(remainder / plates[i]);
    const totalWtOfPlateWt = numPlates * plates[i];
    remainder -= totalWtOfPlateWt;
    computed += numPlates * convertedPlates[i];
  }
  return computed;
}
/**
 * Converts pounds to kilograms, rounding to the nearest plate increment.
 * @param {number} lbs - The weight in pounds.
 * @returns {number} The equivalent weight in kilograms, rounded to the nearest plate increment.
 */

export function lbsToKg(lbs: number) {
  let remainder = lbs;
  let computed = 0;
  const plates = [55, 45, 35, 25, 10, 5, 2.5];
  const convertedPlates = [25, 20, 15, 10, 5, 2.5, 1.25];
  for (let i = 0; i < plates.length; i++) {
    if (remainder < 1.25) return computed;
    if (remainder < plates[i]) continue;
    const numPlates = Math.floor(remainder / plates[i]);
    const totalWtOfPlateWt = numPlates * plates[i];
    remainder -= totalWtOfPlateWt;
    computed += numPlates * convertedPlates[i];
  }

  return computed;
}
