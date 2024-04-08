const today = new Date();
const mSecPerDay = 86400000;

function getMondayDate() {
  const mondayDate = new Date();
  mondayDate.setTime(today.getTime() - (today.getDay() - 1) * mSecPerDay);
  mondayDate.setHours(0, 0, 0);
  return mondayDate;
}

function getByDaysElapsed(days: number) {
  const targetDate = new Date();
  targetDate.setTime(today.getTime() - days * mSecPerDay);
  targetDate.setHours(0, 0, 0);
  return targetDate;
}

export { getMondayDate, getByDaysElapsed };
