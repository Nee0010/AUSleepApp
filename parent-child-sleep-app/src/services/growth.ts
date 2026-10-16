import type { ChildProfile, CompletedPlant, Greenhouse, SleepRecord, PlantType } from '../domain/models';
const PLANTS: PlantType[] = ['sunflower', 'tulip', 'daisy', 'lavender'];
export function advanceGreenhouse(old: Greenhouse, parentScore: number, childScore: number, id: string, at: string) {
  const sunlight = Math.max(0, Math.min(100, parentScore));
  const water = Math.max(0, Math.min(100, childScore));
  const increment = Math.min(sunlight, water) / 7;
  let total = old.growthPercent + increment;
  let plantType = old.currentPlantType;
  const completedPlants: CompletedPlant[] = [...old.completedPlants];
  if (total >= 100 - 1e-8) {
    completedPlants.unshift({ id, plantType, completedAt: at });
    total = Math.max(0, total - 100);
    plantType = PLANTS[(PLANTS.indexOf(plantType) + 1) % PLANTS.length];
  }
  return {
    greenhouse: { currentPlantType: plantType, growthPercent: total, sunlight, water, completedPlants } as Greenhouse,
    increment
  };
}
export function addProgress(child: ChildProfile, record: SleepRecord, completedId: string): ChildProfile {
  const { greenhouse } = advanceGreenhouse(child.greenhouse, record.parentScore, record.childScore, completedId, record.recordedAt);
  return { ...child, greenhouse, records: [record, ...child.records].sort((a,b) => b.day.localeCompare(a.day)) };
}
