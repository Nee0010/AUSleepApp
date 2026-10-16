export type SleepGoal = { min: number; max: number | null; label: string };
export function validAge(age: number, who: 'parent' | 'child') {
  return Number.isInteger(age) && (who === 'parent' ? age >= 18 && age <= 99 : age >= 5 && age <= 17);
}
export function goalFor(age: number, who: 'parent' | 'child'): SleepGoal {
  if (!validAge(age, who)) throw new Error(`Invalid ${who} age.`);
  if (who === 'child') {
    if (age === 5) return { min: 10, max: 13, label: '10–13 hours' };
    if (age <= 12) return { min: 9, max: 12, label: '9–12 hours' };
    return { min: 8, max: 10, label: '8–10 hours' };
  }
  if (age <= 60) return { min: 7, max: null, label: '7+ hours' };
  if (age <= 64) return { min: 7, max: 9, label: '7–9 hours' };
  return { min: 7, max: 8, label: '7–8 hours' };
}
export function validHours(hours: number) { return Number.isFinite(hours) && hours >= 0 && hours <= 24; }
export function scoreHours(age: number, hours: number, who: 'parent' | 'child') {
  if (!validHours(hours)) throw new Error('Hours must be between 0 and 24.');
  const goal = goalFor(age, who);
  const good = hours >= goal.min && (goal.max === null || hours <= goal.max);
  const score = good ? 100 : hours < goal.min
    ? Math.round(hours / goal.min * 100)
    : Math.round((goal.max ?? hours) / hours * 100);
  return { score: Math.max(0, Math.min(100, score)), good, goal };
}
export function localDay(date: Date = new Date()) {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isDuplicateDay(records: Array<{day:string}>, day:string) {
  return records.some(record => record.day === day);
}
