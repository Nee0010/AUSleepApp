import * as Crypto from 'expo-crypto';
import * as SQLite from 'expo-sqlite';
import type {
  CompletedPlant,
  CreateAccountInput,
  GreenhouseState,
  PlantType,
  Setup,
  SleepRecord
} from '../domain/models';
import { createPasswordSalt, hashLocalPassword, normalizeUsername } from '../services/authService';

export const DATABASE_NAME = 'sleep-greenhouse.db';
const DATABASE_VERSION = 2;
const SESSION_KEY = 'active_account_id';

export const initialGreenhouse: GreenhouseState = {
  currentPlantType: 'sunflower',
  growthPercent: 0,
  sunlight: 0,
  water: 0,
  completedPlants: []
};

type SetupRow = {
  account_id: string;
  username: string;
  family_id: string;
  parent_id: string;
  parent_name: string;
  child_id: string;
  child_name: string;
  greenhouse_id: string;
  current_plant_type: PlantType;
  growth_percent: number;
  sunlight: number;
  water: number;
};

type AccountCredentialRow = {
  id: string;
  username: string;
  password_salt: string;
  password_hash: string;
};

type CompletedPlantRow = {
  id: string;
  plant_type: PlantType;
  completed_at: string;
};

type SleepRecordRow = {
  id: string;
  recorded_at: string;
  parent_score: number;
  child_score: number;
  sunlight: number;
  water: number;
  growth_increment: number;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME);
  }
  return databasePromise;
}

export async function initializePersistence() {
  const db = await getDatabase();
  await db.execAsync('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');

  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= DATABASE_VERSION) return;

  if (currentVersion === 0) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS accounts (
        id TEXT PRIMARY KEY NOT NULL,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_salt TEXT NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS families (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS family_members (
        id TEXT PRIMARY KEY NOT NULL,
        family_id TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('parent', 'child')),
        display_name TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS greenhouses (
        id TEXT PRIMARY KEY NOT NULL,
        child_member_id TEXT NOT NULL UNIQUE,
        current_plant_type TEXT NOT NULL,
        growth_percent REAL NOT NULL DEFAULT 0,
        sunlight REAL NOT NULL DEFAULT 0,
        water REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        FOREIGN KEY (child_member_id) REFERENCES family_members(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS completed_plants (
        id TEXT PRIMARY KEY NOT NULL,
        greenhouse_id TEXT NOT NULL,
        plant_type TEXT NOT NULL,
        completed_at TEXT NOT NULL,
        FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS sleep_records (
        id TEXT PRIMARY KEY NOT NULL,
        parent_member_id TEXT NOT NULL,
        child_member_id TEXT NOT NULL,
        greenhouse_id TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        parent_score REAL NOT NULL,
        child_score REAL NOT NULL,
        sunlight REAL NOT NULL,
        water REAL NOT NULL,
        growth_increment REAL NOT NULL,
        FOREIGN KEY (parent_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (child_member_id) REFERENCES family_members(id) ON DELETE CASCADE,
        FOREIGN KEY (greenhouse_id) REFERENCES greenhouses(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS research_consents (
        id TEXT PRIMARY KEY NOT NULL,
        family_id TEXT NOT NULL,
        status TEXT NOT NULL,
        document_version TEXT NOT NULL,
        recorded_at TEXT NOT NULL,
        FOREIGN KEY (family_id) REFERENCES families(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS policy_acceptances (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        policy_type TEXT NOT NULL,
        document_version TEXT NOT NULL,
        accepted_at TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_family_members_family ON family_members(family_id);
      CREATE INDEX IF NOT EXISTS idx_completed_plants_greenhouse ON completed_plants(greenhouse_id, completed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_sleep_records_greenhouse ON sleep_records(greenhouse_id, recorded_at DESC);
      CREATE INDEX IF NOT EXISTS idx_policy_acceptances_account ON policy_acceptances(account_id, policy_type);
    `);
  }

  if (currentVersion < 2) {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS policy_acceptances (
        id TEXT PRIMARY KEY NOT NULL,
        account_id TEXT NOT NULL,
        policy_type TEXT NOT NULL,
        document_version TEXT NOT NULL,
        accepted_at TEXT NOT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_policy_acceptances_account ON policy_acceptances(account_id, policy_type);
    `);
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

export async function hasLocalAccount() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) AS count FROM accounts');
  return (row?.count ?? 0) > 0;
}

export async function createLocalAccount(input: CreateAccountInput) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const accountId = Crypto.randomUUID();
  const familyId = Crypto.randomUUID();
  const parentId = Crypto.randomUUID();
  const childId = Crypto.randomUUID();
  const greenhouseId = Crypto.randomUUID();
  const username = normalizeUsername(input.username);
  const salt = createPasswordSalt();
  const passwordHash = await hashLocalPassword(input.password, salt);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO accounts (id, username, password_salt, password_hash, created_at) VALUES (?, ?, ?, ?, ?)',
      accountId,
      username,
      salt,
      passwordHash,
      now
    );
    await db.runAsync('INSERT INTO families (id, account_id, created_at) VALUES (?, ?, ?)', familyId, accountId, now);
    await db.runAsync(
      'INSERT INTO family_members (id, family_id, role, display_name, created_at) VALUES (?, ?, ?, ?, ?)',
      parentId,
      familyId,
      'parent',
      input.parentName.trim(),
      now
    );
    await db.runAsync(
      'INSERT INTO family_members (id, family_id, role, display_name, created_at) VALUES (?, ?, ?, ?, ?)',
      childId,
      familyId,
      'child',
      input.childName.trim(),
      now
    );
    await db.runAsync(
      `INSERT INTO greenhouses
        (id, child_member_id, current_plant_type, growth_percent, sunlight, water, created_at, updated_at)
       VALUES (?, ?, ?, 0, 0, 0, ?, ?)`,
      greenhouseId,
      childId,
      initialGreenhouse.currentPlantType,
      now,
      now
    );

    const policyRows = [
      ['terms_of_service', input.agreements.termsVersion, input.agreements.termsAcceptedAt],
      ['privacy_policy', input.agreements.privacyVersion, input.agreements.privacyAcceptedAt],
      ['health_data_notice', input.agreements.healthDataVersion, input.agreements.healthDataAcceptedAt]
    ] as const;

    for (const [policyType, version, acceptedAt] of policyRows) {
      await db.runAsync(
        'INSERT INTO policy_acceptances (id, account_id, policy_type, document_version, accepted_at) VALUES (?, ?, ?, ?, ?)',
        Crypto.randomUUID(),
        accountId,
        policyType,
        version,
        acceptedAt
      );
    }

    await db.runAsync(
      'INSERT INTO research_consents (id, family_id, status, document_version, recorded_at) VALUES (?, ?, ?, ?, ?)',
      Crypto.randomUUID(),
      familyId,
      input.agreements.researchStatus,
      input.agreements.researchVersion,
      input.agreements.researchRecordedAt
    );

    await setSetting(db, SESSION_KEY, accountId);
  });

  return accountId;
}

export async function authenticateLocalAccount(username: string, password: string) {
  const db = await getDatabase();
  const normalized = normalizeUsername(username);
  const row = await db.getFirstAsync<AccountCredentialRow>(
    'SELECT id, username, password_salt, password_hash FROM accounts WHERE username = ? COLLATE NOCASE',
    normalized
  );
  if (!row) return null;

  const candidateHash = await hashLocalPassword(password, row.password_salt);
  if (candidateHash !== row.password_hash) return null;

  await setSetting(db, SESSION_KEY, row.id);
  return row.id;
}

export async function clearSession() {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM app_settings WHERE key = ?', SESSION_KEY);
}

export async function getActiveAccountId() {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM app_settings WHERE key = ?', SESSION_KEY);
  return row?.value ?? null;
}

export async function loadSetupAndGreenhouse(accountId: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<SetupRow>(
    `SELECT
      a.id AS account_id,
      a.username AS username,
      f.id AS family_id,
      p.id AS parent_id,
      p.display_name AS parent_name,
      c.id AS child_id,
      c.display_name AS child_name,
      g.id AS greenhouse_id,
      g.current_plant_type AS current_plant_type,
      g.growth_percent AS growth_percent,
      g.sunlight AS sunlight,
      g.water AS water
    FROM accounts a
    JOIN families f ON f.account_id = a.id
    JOIN family_members p ON p.family_id = f.id AND p.role = 'parent'
    JOIN family_members c ON c.family_id = f.id AND c.role = 'child'
    JOIN greenhouses g ON g.child_member_id = c.id
    WHERE a.id = ?
    LIMIT 1`,
    accountId
  );

  if (!row) return null;

  const completedRows = await db.getAllAsync<CompletedPlantRow>(
    'SELECT id, plant_type, completed_at FROM completed_plants WHERE greenhouse_id = ? ORDER BY completed_at DESC',
    row.greenhouse_id
  );

  const setup: Setup = {
    accountId: row.account_id,
    familyId: row.family_id,
    parentId: row.parent_id,
    childId: row.child_id,
    greenhouseId: row.greenhouse_id,
    username: row.username,
    parentName: row.parent_name,
    childName: row.child_name
  };

  const greenhouse: GreenhouseState = {
    currentPlantType: row.current_plant_type,
    growthPercent: row.growth_percent,
    sunlight: row.sunlight,
    water: row.water,
    completedPlants: completedRows.map(mapCompletedPlant)
  };

  return { setup, greenhouse };
}

export async function loadSleepRecords(greenhouseId: string, limit = 20) {
  const db = await getDatabase();
  const rows = await db.getAllAsync<SleepRecordRow>(
    `SELECT id, recorded_at, parent_score, child_score, sunlight, water, growth_increment
     FROM sleep_records
     WHERE greenhouse_id = ?
     ORDER BY recorded_at DESC
     LIMIT ?`,
    greenhouseId,
    limit
  );
  return rows.map(mapSleepRecord);
}

export async function persistDailyProgress(params: {
  setup: Setup;
  nextPlantType: PlantType;
  nextGrowthPercent: number;
  sunlight: number;
  water: number;
  growthIncrement: number;
  parentScore: number;
  childScore: number;
  completedPlant?: CompletedPlant;
}) {
  const db = await getDatabase();
  const recordedAt = new Date().toISOString();
  const sleepRecordId = Crypto.randomUUID();

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE greenhouses
       SET current_plant_type = ?, growth_percent = ?, sunlight = ?, water = ?, updated_at = ?
       WHERE id = ?`,
      params.nextPlantType,
      params.nextGrowthPercent,
      params.sunlight,
      params.water,
      recordedAt,
      params.setup.greenhouseId
    );

    if (params.completedPlant) {
      await db.runAsync(
        'INSERT INTO completed_plants (id, greenhouse_id, plant_type, completed_at) VALUES (?, ?, ?, ?)',
        params.completedPlant.id,
        params.setup.greenhouseId,
        params.completedPlant.plantType,
        params.completedPlant.completedAt
      );
    }

    await db.runAsync(
      `INSERT INTO sleep_records
        (id, parent_member_id, child_member_id, greenhouse_id, recorded_at, parent_score, child_score, sunlight, water, growth_increment)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      sleepRecordId,
      params.setup.parentId,
      params.setup.childId,
      params.setup.greenhouseId,
      recordedAt,
      params.parentScore,
      params.childScore,
      params.sunlight,
      params.water,
      params.growthIncrement
    );
  });

  return {
    id: sleepRecordId,
    recordedAt,
    parentScore: params.parentScore,
    childScore: params.childScore,
    sunlight: params.sunlight,
    water: params.water,
    growthIncrement: params.growthIncrement
  } satisfies SleepRecord;
}

export async function resetAllLocalData() {
  const db = await getDatabase();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM app_settings');
    await db.runAsync('DELETE FROM policy_acceptances');
    await db.runAsync('DELETE FROM research_consents');
    await db.runAsync('DELETE FROM sleep_records');
    await db.runAsync('DELETE FROM completed_plants');
    await db.runAsync('DELETE FROM greenhouses');
    await db.runAsync('DELETE FROM family_members');
    await db.runAsync('DELETE FROM families');
    await db.runAsync('DELETE FROM accounts');
  });
}

async function setSetting(db: SQLite.SQLiteDatabase, key: string, value: string) {
  await db.runAsync(
    `INSERT INTO app_settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    key,
    value
  );
}

function mapCompletedPlant(row: CompletedPlantRow): CompletedPlant {
  return { id: row.id, plantType: row.plant_type, completedAt: row.completed_at };
}

function mapSleepRecord(row: SleepRecordRow): SleepRecord {
  return {
    id: row.id,
    recordedAt: row.recorded_at,
    parentScore: row.parent_score,
    childScore: row.child_score,
    sunlight: row.sunlight,
    water: row.water,
    growthIncrement: row.growth_increment
  };
}
