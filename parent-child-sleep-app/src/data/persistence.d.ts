import type {
  CompletedPlant,
  CreateAccountInput,
  GreenhouseState,
  PlantType,
  Setup,
  SleepRecord
} from '../domain/models';

export const initialGreenhouse: GreenhouseState;
export function initializePersistence(): Promise<void>;
export function hasLocalAccount(): Promise<boolean>;
export function createLocalAccount(input: CreateAccountInput): Promise<string>;
export function authenticateLocalAccount(username: string, password: string): Promise<string | null>;
export function clearSession(): Promise<void>;
export function getActiveAccountId(): Promise<string | null>;
export function loadSetupAndGreenhouse(accountId: string): Promise<{ setup: Setup; greenhouse: GreenhouseState } | null>;
export function loadSleepRecords(greenhouseId: string, limit?: number): Promise<SleepRecord[]>;
export function persistDailyProgress(params: {
  setup: Setup;
  nextPlantType: PlantType;
  nextGrowthPercent: number;
  sunlight: number;
  water: number;
  growthIncrement: number;
  parentScore: number;
  childScore: number;
  completedPlant?: CompletedPlant;
}): Promise<SleepRecord>;
export function resetAllLocalData(): Promise<void>;
