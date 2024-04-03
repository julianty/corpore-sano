export function getMondayDate() {
  const today = new Date();
  const mondayDate = new Date();
  const mSecPerDay = 86400000;
  mondayDate.setTime(today.getTime() - (today.getDay() - 1) * mSecPerDay);
  mondayDate.setHours(0, 0, 0);
  return mondayDate;
}
