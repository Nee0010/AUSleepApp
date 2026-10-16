export type PlantType = 'sunflower' | 'tulip' | 'daisy' | 'lavender';
export type EntrySource = 'manual'; // Wearable sources reserved for Cycle 3.
export type ConsentChoice = 'granted' | 'declined';
export type CompletedPlant = { id: string; plantType: PlantType; completedAt: string };
export type Greenhouse = {
  currentPlantType: PlantType;
  growthPercent: number;
  sunlight: number;
  water: number;
  completedPlants: CompletedPlant[];
};
export type SleepRecord = {
  id: string;
  day: string; // Local YYYY-MM-DD, one record per child per day.
  recordedAt: string;
  parentHours: number;
  childHours: number;
  parentScore: number;
  childScore: number;
  sunlight: number;
  water: number;
  growthIncrement: number;
  source: EntrySource;
};
export type ChildProfile = {
  id: string;
  name: string;
  age: number | null;
  createdAt: string;
  greenhouse: Greenhouse;
  records: SleepRecord[];
};
export type ConsentState = {
  termsVersion: string;
  termsAcceptedAt: string;
  privacyVersion: string;
  privacyAcceptedAt: string;
  healthVersion: string;
  healthAcceptedAt: string;
  researchVersion: string;
  researchChoice: ConsentChoice;
  researchRecordedAt: string;
};
export type FamilyData = {
  schemaVersion: 2;
  id: string;
  username: string;
  passwordSalt: string;
  passwordHash: string;
  parentName: string;
  parentAge: number | null;
  children: ChildProfile[];
  parentSleepByDate: Record<string, number>;
  consents: ConsentState;
  sessionActive: boolean;
  createdAt: string;
  updatedAt: string;
};
export type CreateAccount = {
  username: string; password: string;
  parentName: string; parentAge: number;
  childName: string; childAge: number;
  researchChoice: ConsentChoice;
};
export type OpResult = { ok: boolean; message?: string };
export const newGreenhouse = (): Greenhouse => ({
  currentPlantType: 'sunflower', growthPercent: 0, sunlight: 0, water: 0, completedPlants: []
});
