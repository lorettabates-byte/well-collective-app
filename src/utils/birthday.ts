// Returns the calendar date (YYYY-MM-DD) for a MM-DD birthday in a given year.
// Falls back to Feb 28 for Feb 29 birthdays in non-leap years.
export function birthdayDateForYear(birthday: string, year: number): string {
  const [month, day] = birthday.split("-").map(Number);
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
  const safeDay = month === 2 && day === 29 && !isLeap ? 28 : day;
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

// Returns the next occurrence of a MM-DD birthday on or after today.
export function nextBirthdayDate(birthday: string): string {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const thisYear = birthdayDateForYear(birthday, today.getFullYear());
  return thisYear >= todayStr ? thisYear : birthdayDateForYear(birthday, today.getFullYear() + 1);
}
