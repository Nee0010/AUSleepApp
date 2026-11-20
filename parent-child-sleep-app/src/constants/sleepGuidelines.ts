/**
 * User Story 4.10 — Apply Age-Based Sleep Guidelines.
 *
 * Single source of truth for the sleep targets used to score parent (sunlight)
 * and child (water) sleep. Every bracket records where its numbers come from and
 * whether the sponsor has approved it, so the research team can review the table
 * without reading scoring code. Bump SLEEP_GUIDELINE_VERSION whenever a value
 * changes; each saved sleep record stores the version it was scored against.
 */
export type Participant = 'parent' | 'child';
export type GuidelineStatus = 'approved' | 'pending-sponsor-review';
export type SleepGuideline = {
  id: string;
  who: Participant;
  minAge: number;
  maxAge: number;          // Inclusive. Parents 99 means "99+" in the UI.
  ageLabel: string;
  minHours: number;
  maxHours: number | null; // null = open-ended ("7+ hours").
  includesNaps: boolean;
  sourceId: keyof typeof SLEEP_GUIDELINE_SOURCES;
  status: GuidelineStatus;
};

export const SLEEP_GUIDELINE_VERSION = 'sleep-guidelines-2026-11-v1';

export const SLEEP_GUIDELINE_SOURCES = {
  aasmPediatric2016: {
    short: 'AASM (2016)',
    citation: "Paruthi, S., Brooks, L., D'Ambrosio, C., et al. (2016). Recommended Amount of Sleep for Pediatric Populations: A Consensus Statement of the American Academy of Sleep Medicine. Journal of Clinical Sleep Medicine, 12, 785–786.",
    url: 'https://doi.org/10.5664/jcsm.5866',
  },
  aasmSrsAdult2015: {
    short: 'AASM/SRS (2015)',
    citation: 'Watson, N. F., Badr, M. S., Belenky, G., et al. (2015). Recommended Amount of Sleep for a Healthy Adult: A Joint Consensus Statement of the American Academy of Sleep Medicine and Sleep Research Society. Sleep, 38(6), 843–844.',
    url: 'https://doi.org/10.5665/sleep.4716',
  },
  nsfAdult2015: {
    short: 'NSF (2015)',
    citation: "Hirshkowitz, M., Whiton, K., Albert, S. M., et al. (2015). National Sleep Foundation's sleep time duration recommendations. Sleep Health, 1(1), 40–43.",
    url: 'https://doi.org/10.1016/j.sleh.2014.12.010',
  },
} as const;

export const SLEEP_GUIDELINES: readonly SleepGuideline[] = [
  // Children 5–17 (report Chapter 3, AASM pediatric consensus).
  { id: 'child-5', who: 'child', minAge: 5, maxAge: 5, ageLabel: 'Age 5', minHours: 10, maxHours: 13, includesNaps: true, sourceId: 'aasmPediatric2016', status: 'approved' },
  { id: 'child-6-12', who: 'child', minAge: 6, maxAge: 12, ageLabel: 'Ages 6–12', minHours: 9, maxHours: 12, includesNaps: false, sourceId: 'aasmPediatric2016', status: 'approved' },
  { id: 'child-13-17', who: 'child', minAge: 13, maxAge: 17, ageLabel: 'Ages 13–17', minHours: 8, maxHours: 10, includesNaps: false, sourceId: 'aasmPediatric2016', status: 'approved' },
  // Parents 18+. The report lists the adult source as "to be confirmed with the sponsor",
  // so these keep the Cycle 2 values but are flagged for review.
  { id: 'parent-18-60', who: 'parent', minAge: 18, maxAge: 60, ageLabel: 'Ages 18–60', minHours: 7, maxHours: null, includesNaps: false, sourceId: 'aasmSrsAdult2015', status: 'pending-sponsor-review' },
  { id: 'parent-61-64', who: 'parent', minAge: 61, maxAge: 64, ageLabel: 'Ages 61–64', minHours: 7, maxHours: 9, includesNaps: false, sourceId: 'nsfAdult2015', status: 'pending-sponsor-review' },
  { id: 'parent-65-plus', who: 'parent', minAge: 65, maxAge: 99, ageLabel: 'Ages 65+', minHours: 7, maxHours: 8, includesNaps: false, sourceId: 'nsfAdult2015', status: 'pending-sponsor-review' },
];

export function hoursLabel(minHours: number, maxHours: number | null) {
  return maxHours === null ? `${minHours}+ hours` : `${minHours}–${maxHours} hours`;
}
