import { SLEEP_GUIDELINES, SLEEP_GUIDELINE_SOURCES, SLEEP_GUIDELINE_VERSION, hoursLabel, type Participant, type SleepGuideline } from '../constants/sleepGuidelines';
export type SleepGoal = {
  min: number; max: number | null; label: string;
  guidelineId: string; ageLabel: string; includesNaps: boolean;
  source: string; approved: boolean; version: string;
};
export function validAge(age: number, who: Participant) {
  return Number.isInteger(age) && (who === 'parent' ? age >= 18 && age <= 99 : age >= 5 && age <= 17);
}
/** US 4.10: select the guideline bracket that matches the participant's age. */
export function guidelineFor(age: number, who: Participant): SleepGuideline {
  if (!validAge(age, who)) throw new Error(`Invalid ${who} age.`);
  const match = SLEEP_GUIDELINES.find(g => g.who === who && age >= g.minAge && age <= g.maxAge);
  if (!match) throw new Error(`No sleep guideline configured for ${who} age ${age}.`);
  return match;
}
export function goalFor(age: number, who: Participant): SleepGoal {
  const g = guidelineFor(age, who);
  return {
    min: g.minHours, max: g.maxHours, label: hoursLabel(g.minHours, g.maxHours),
    guidelineId: g.id, ageLabel: g.ageLabel, includesNaps: g.includesNaps,
    source: SLEEP_GUIDELINE_SOURCES[g.sourceId].short, approved: g.status === 'approved',
    version: SLEEP_GUIDELINE_VERSION,
  };
}
/** Compact snapshot stored on each sleep record so history keeps the target that was used. */
export function goalSnapshot(age: number, who: Participant) {
  const g = goalFor(age, who);
  return { age, guidelineId: g.guidelineId, minHours: g.min, maxHours: g.max, label: g.label };
}
export function validHours(hours: number) { return Number.isFinite(hours) && hours >= 0 && hours <= 24; }
export function scoreHours(age: number, hours: number, who: Participant) {
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
