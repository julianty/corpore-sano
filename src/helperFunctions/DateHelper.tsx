const today = new Date();
const mSecPerDay = 86400000;

function getMondayDate() {
  const mondayDate = new Date();
  mondayDate.setTime(today.getTime() - (today.getDay() - 1) * mSecPerDay);
  mondayDate.setHours(0, 0, 0);
  return mondayDate;
}

/**
 * Returns a new Date object representing a date that is `days` days before the current date.
 * The time portion of the returned date is set to 00:00:00.
 *
 * @param days - The number of days to subtract from the current date.
 * @returns A new Date object representing the target date.
 */
function getByDaysElapsed(days: number) {
  const targetDate = new Date();
  targetDate.setTime(today.getTime() - days * mSecPerDay);
  targetDate.setHours(0, 0, 0);
  return targetDate;
}

/**
 * Calculates the number of days between two dates.
 *
 * @param date1 - The first date.
 * @param date2 - The second date.
 * @returns The number of days between the two dates.
 */
function calculateDaysBetweenDates(date1: Date, date2: Date) {
  return Math.round(Math.abs(date1.getTime() - date2.getTime()) / mSecPerDay);
}

export { getMondayDate, getByDaysElapsed, calculateDaysBetweenDates };
