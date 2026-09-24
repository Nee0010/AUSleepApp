export type MemberRole = 'parent' | 'child';

export type PlantType = 'sunflower' | 'tulip' | 'daisy' | 'lavender';

export type Account = {
  id: string;
  username: string;
  createdAt: string;
};

export type Setup = {
  accountId: string;
  familyId: string;
  parentId: string;
  childId: string;
  greenhouseId: string;
  username: string;
  parentName: string;
  childName: string;
};

export type FamilyMember = {
  id: string;
  familyId: string;
  role: MemberRole;
  displayName: string;
};

export type CompletedPlant = {
  id: string;
  plantType: PlantType;
  completedAt: string;
};

export type GreenhouseState = {
  currentPlantType: PlantType;
  growthPercent: number;
  sunlight: number;
  water: number;
  completedPlants: CompletedPlant[];
};

export type SleepGoalScore = {
  parentScore: number;
  childScore: number;
};

export type SleepRecord = {
  id: string;
  recordedAt: string;
  parentScore: number;
  childScore: number;
  sunlight: number;
  water: number;
  growthIncrement: number;
};

export type PolicyAgreements = {
  termsVersion: string;
  termsAcceptedAt: string;
  privacyVersion: string;
  privacyAcceptedAt: string;
  healthDataVersion: string;
  healthDataAcceptedAt: string;
  researchVersion: string;
  researchStatus: 'granted' | 'declined';
  researchRecordedAt: string;
};

export type CreateAccountInput = {
  username: string;
  password: string;
  parentName: string;
  childName: string;
  agreements: PolicyAgreements;
};

export type AuthResult = {
  ok: boolean;
  message?: string;
};
