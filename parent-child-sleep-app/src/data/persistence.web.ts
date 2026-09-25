import * as Crypto from 'expo-crypto';
import type {
  CompletedPlant,
  CreateAccountInput,
  GreenhouseState,
  PlantType,
  PolicyAgreements,
  Setup,
  SleepRecord
} from '../domain/models';
import { createPasswordSalt, hashLocalPassword, normalizeUsername } from '../services/authService';

const WEB_STORAGE_KEY = 'sleep-greenhouse-web-v2';

export const initialGreenhouse: GreenhouseState = {
  currentPlantType: 'sunflower',
  growthPercent: 0,
  sunlight: 0,
  water: 0,
  completedPlants: []
};

type WebAccount = {
  id: string;
  username: string;
  passwordSalt: string;
  passwordHash: string;
  createdAt: string;
};

type WebPersistedState = {
  account: WebAccount | null;
  activeAccountId: string | null;
  setup: Setup | null;
  greenhouse: GreenhouseState;
  sleepRecords: SleepRecord[];
  agreements: PolicyAgreements | null;
};

function emptyState(): WebPersistedState {
  return {
    account: null,
    activeAccountId: null,
    setup: null,
    greenhouse: { ...initialGreenhouse, completedPlants: [] },
    sleepRecords: [],
    agreements: null
  };
}

function readState(): WebPersistedState {
  if (typeof window === 'undefined') return emptyState();
  try {
    const raw = window.localStorage.getItem(WEB_STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw) as WebPersistedState;
    return {
      ...emptyState(),
      ...parsed,
      greenhouse: {
        ...initialGreenhouse,
        ...(parsed.greenhouse ?? {}),
        completedPlants: parsed.greenhouse?.completedPlants ?? []
      },
      setup: parsed.setup
        ? {
            ...parsed.setup,
            parentAge: parsed.setup.parentAge ?? null,
            childAge: parsed.setup.childAge ?? null
          }
        : null,
      sleepRecords: (parsed.sleepRecords ?? []).map((record) => ({
        ...record,
        parentSleepHours: record.parentSleepHours ?? null,
        childSleepHours: record.childSleepHours ?? null
      })),
      agreements: parsed.agreements ?? null
    };
  } catch {
    return emptyState();
  }
}

function writeState(state: WebPersistedState) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(WEB_STORAGE_KEY, JSON.stringify(state));
}

export async function initializePersistence() {}

export async function hasLocalAccount() {
  return Boolean(readState().account);
}

export async function createLocalAccount(input: CreateAccountInput) {
  const current = readState();
  if (current.account) {
    throw new Error('An account already exists in this browser.');
  }

  const now = new Date().toISOString();
  const accountId = Crypto.randomUUID();
  const familyId = Crypto.randomUUID();
  const parentId = Crypto.randomUUID();
  const childId = Crypto.randomUUID();
  const greenhouseId = Crypto.randomUUID();
  const username = normalizeUsername(input.username);
  const passwordSalt = createPasswordSalt();
  const passwordHash = await hashLocalPassword(input.password, passwordSalt);

  const setup: Setup = {
    accountId,
    familyId,
    parentId,
    childId,
    greenhouseId,
    username,
    parentName: input.parentName.trim(),
    parentAge: input.parentAge,
    childName: input.childName.trim(),
    childAge: input.childAge
  };

  writeState({
    account: { id: accountId, username, passwordSalt, passwordHash, createdAt: now },
    activeAccountId: accountId,
    setup,
    greenhouse: { ...initialGreenhouse, completedPlants: [] },
    sleepRecords: [],
    agreements: input.agreements
  });

  return accountId;
}

export async function authenticateLocalAccount(username: string, password: string) {
  const state = readState();
  if (!state.account) return null;
  if (normalizeUsername(username) !== state.account.username) return null;

  const candidateHash = await hashLocalPassword(password, state.account.passwordSalt);
  if (candidateHash !== state.account.passwordHash) return null;

  state.activeAccountId = state.account.id;
  writeState(state);
  return state.account.id;
}

export async function clearSession() {
  const state = readState();
  state.activeAccountId = null;
  writeState(state);
}

export async function getActiveAccountId() {
  return readState().activeAccountId;
}

export async function loadSetupAndGreenhouse(accountId: string) {
  const state = readState();
  if (!state.account || !state.setup || state.account.id !== accountId) return null;
  return {
    setup: state.setup,
    greenhouse: state.greenhouse
  };
}

export async function loadSleepRecords(greenhouseId: string, limit = 20) {
  const state = readState();
  if (!state.setup || state.setup.greenhouseId !== greenhouseId) return [];
  return state.sleepRecords.slice(0, limit);
}

export async function updateProfileAges(setup: Setup, parentAge: number, childAge: number) {
  const state = readState();
  if (!state.setup || state.setup.accountId !== setup.accountId) return;
  state.setup = { ...state.setup, parentAge, childAge };
  writeState(state);
}

export async function persistDailyProgress(params: {
  setup: Setup;
  nextPlantType: PlantType;
  nextGrowthPercent: number;
  sunlight: number;
  water: number;
  growthIncrement: number;
  parentSleepHours: number;
  childSleepHours: number;
  parentScore: number;
  childScore: number;
  completedPlant?: CompletedPlant;
}) {
  const state = readState();
  const recordedAt = new Date().toISOString();
  const record: SleepRecord = {
    id: Crypto.randomUUID(),
    recordedAt,
    parentSleepHours: params.parentSleepHours,
    childSleepHours: params.childSleepHours,
    parentScore: params.parentScore,
    childScore: params.childScore,
    sunlight: params.sunlight,
    water: params.water,
    growthIncrement: params.growthIncrement
  };

  state.greenhouse = {
    currentPlantType: params.nextPlantType,
    growthPercent: params.nextGrowthPercent,
    sunlight: params.sunlight,
    water: params.water,
    completedPlants: params.completedPlant
      ? [params.completedPlant, ...state.greenhouse.completedPlants]
      : state.greenhouse.completedPlants
  };
  state.sleepRecords = [record, ...state.sleepRecords].slice(0, 20);
  writeState(state);
  return record;
}

export async function resetAllLocalData() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(WEB_STORAGE_KEY);
  }
}
