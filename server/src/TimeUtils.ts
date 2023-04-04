/**
 * Returns the current 'yyyy-mm'. Used in Redis for bucketing by month. If `monthOffset` is defined,
 * this will be the number of months in the past / future (positive for future, negative for past).
 */
export function getYyyyMm(monthOffset = 0) {
  const now = new Date();
  now.setMonth(now.getMonth() + monthOffset);
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  return `${year}-${month < 10 ? '0' : ''}${month}`;
}

/** Returns the current 'yyyy-mm-dd'. Used in Redis for bucketing by month. */
export function getYyyyMmDd() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  return `${year}-${month < 10 ? '0' : ''}${month}-${day < 10 ? '0' : ''}${day}`;
}
