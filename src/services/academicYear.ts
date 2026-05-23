/**
 * Calculates the active academic year based on a calendar date.
 * Italian academic years begin in September.
 * E.g., May 2026 -> Academic Year 2025/2026 (starting year 2025).
 * October 2026 -> Academic Year 2026/2027 (starting year 2026).
 */
export function getAutoAcademicYear(date: Date = new Date()): number {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0 = January, 8 = September
  return month >= 8 ? year : year - 1;
}

/**
 * Returns a rolling list of the last 3 academic years for the dropdown menu.
 * E.g., if autoYear is 2025, returns [2025, 2024, 2023].
 */
export function getAcademicYearOptions(autoYear: number): number[] {
  return [autoYear, autoYear - 1, autoYear - 2];
}
