import type { MemberRole } from '../domain/models';

export type SleepRecommendation = {
  label: string;
  minHours: number;
  maxHours: number | null;
};

export type SleepScoreResult = {
  score: number;
  isGoodSleep: boolean;
  recommendation: SleepRecommendation;
};

export function isValidChildAge(age: number) {
  return Number.isInteger(age) && age >= 5 && age <= 17;
}

export function isValidParentAge(age: number) {
  return Number.isInteger(age) && age >= 18 && age <= 99;
}

export function formatProfileAge(age: number, role: MemberRole) {
  return role === 'parent' && age === 99 ? '99+' : String(age);
}

// Child ranges are the project-provided recommendations. Adult ranges use CDC guidance.
// Age 99 is stored as the 99+ profile category.
export function getSleepRecommendation(age: number, role: MemberRole): SleepRecommendation {
  if (role === 'child') {
    if (!isValidChildAge(age)) {
      throw new Error('Child age must be between 5 and 17.');
    }

    if (age === 5) return { label: '10-13 hours', minHours: 10, maxHours: 13 };
    if (age <= 12) return { label: '9-12 hours', minHours: 9, maxHours: 12 };
    return { label: '8-10 hours', minHours: 8, maxHours: 10 };
  }

  if (!isValidParentAge(age)) {
    throw new Error('Parent age must be between 18 and 99+.');
  }

  if (age <= 60) return { label: '7+ hours', minHours: 7, maxHours: null };
  if (age <= 64) return { label: '7-9 hours', minHours: 7, maxHours: 9 };
  return { label: '7-8 hours', minHours: 7, maxHours: 8 };
}

// This score is a greenhouse reward calculation, not a clinical assessment.
// Meeting the recommendation earns 100 points. Outside the range, points scale
// proportionally to the nearest recommended boundary.
export function scoreSleepHours(age: number, hours: number, role: MemberRole): SleepScoreResult {
  const recommendation = getSleepRecommendation(age, role);
  const safeHours = Math.min(Math.max(hours, 0), 24);
  const withinMinimum = safeHours >= recommendation.minHours;
  const withinMaximum = recommendation.maxHours === null || safeHours <= recommendation.maxHours;
  const isGoodSleep = withinMinimum && withinMaximum;

  if (isGoodSleep) {
    return { score: 100, isGoodSleep: true, recommendation };
  }

  const score = safeHours < recommendation.minHours
    ? Math.round((safeHours / recommendation.minHours) * 100)
    : Math.round(((recommendation.maxHours ?? safeHours) / safeHours) * 100);

  return {
    score: Math.min(Math.max(score, 0), 100),
    isGoodSleep: false,
    recommendation
  };
}
