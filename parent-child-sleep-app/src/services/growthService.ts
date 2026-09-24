import type { SleepGoalScore } from '../domain/models';

const DAYS_PER_PLANT = 7;
const DAILY_FULL_GROWTH = 100 / DAYS_PER_PLANT;

export type DailyGrowthResult = {
  sunlight: number;
  water: number;
  growthIncrement: number;
};

export function calculateDailyGrowth(score: SleepGoalScore): DailyGrowthResult {
  const parent = clamp(score.parentScore, 0, 100);
  const child = clamp(score.childScore, 0, 100);
  const sharedPerformance = Math.min(parent, child) / 100;

  return {
    sunlight: Math.round(parent),
    water: Math.round(child),
    growthIncrement: DAILY_FULL_GROWTH * sharedPerformance
  };
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}
