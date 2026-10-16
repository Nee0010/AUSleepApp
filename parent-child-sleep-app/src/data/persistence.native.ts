import * as SQLite from 'expo-sqlite';
import type { FamilyData, ChildProfile, SleepRecord, PlantType, ConsentState } from '../domain/models';
import { localDay, validHours } from '../services/sleepRules';
import { newGreenhouse } from '../domain/models';

const DB_NAME = 'sleep-greenhouse.db'; // Existing app database name. Keeps legacy data available.
let dbPromise: Promise<SQLite.SQLiteDatabase> | undefined;
async function db() { return dbPromise ??= SQLite.openDatabaseAsync(DB_NAME); }

type OldAccount = { id: string; username: string; password_salt: string; password_hash: string; created_at: string };
type OldChild = { id: string; display_name: string; age_years: number | null; created_at: string; greenhouse_id: string; current_plant_type: PlantType; growth_percent: number; sunlight: number; water: number };
type OldRecord = { id: string; recorded_at: string; parent_sleep_hours: number | null; child_sleep_hours: number | null; parent_score: number; child_score: number; sunlight: number; water: number; growth_increment: number };

export async function loadLocalData(): Promise<FamilyData | null> {
  const database = await db();
  await database.execAsync('CREATE TABLE IF NOT EXISTS cycle2_state (id INTEGER PRIMARY KEY CHECK (id = 1), payload TEXT NOT NULL);');
  const current = await database.getFirstAsync<{payload:string}>('SELECT payload FROM cycle2_state WHERE id = 1');
  if (current) return JSON.parse(current.payload) as FamilyData;

  // One-time non-destructive migration from the original Cycle 1 native SQLite tables.
  const legacyTable = await database.getFirstAsync<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'");
  if (!legacyTable) return null;
  // The original app upgraded its own schema in place. Ensure older devices with a pre-v3
  // database still have columns needed for the non-destructive Cycle 2 import.
  const memberColumns = await database.getAllAsync<{name:string}>('PRAGMA table_info(family_members)');
  if (!memberColumns.some(c => c.name === 'age_years')) {
    await database.execAsync('ALTER TABLE family_members ADD COLUMN age_years INTEGER;');
  }
  const recordColumns = await database.getAllAsync<{name:string}>('PRAGMA table_info(sleep_records)');
  if (!recordColumns.some(c => c.name === 'parent_sleep_hours')) {
    await database.execAsync('ALTER TABLE sleep_records ADD COLUMN parent_sleep_hours REAL;');
  }
  if (!recordColumns.some(c => c.name === 'child_sleep_hours')) {
    await database.execAsync('ALTER TABLE sleep_records ADD COLUMN child_sleep_hours REAL;');
  }
  await database.execAsync(`CREATE TABLE IF NOT EXISTS policy_acceptances (
    id TEXT PRIMARY KEY NOT NULL,
    account_id TEXT NOT NULL,
    policy_type TEXT NOT NULL,
    document_version TEXT NOT NULL,
    accepted_at TEXT NOT NULL
  );`);
  const oldAccount = await database.getFirstAsync<OldAccount>('SELECT * FROM accounts LIMIT 1');
  if (!oldAccount) return null;
  const family = await database.getFirstAsync<{id:string}>('SELECT id FROM families WHERE account_id = ? LIMIT 1', oldAccount.id);
  if (!family) throw new Error('Legacy family record missing. Data has not been deleted.');
  const parent = await database.getFirstAsync<{display_name:string; age_years:number|null}>("SELECT display_name, age_years FROM family_members WHERE family_id = ? AND role = 'parent' LIMIT 1", family.id);
  if (!parent) throw new Error('Legacy parent record missing. Data has not been deleted.');
  const oldChildren = await database.getAllAsync<OldChild>(
    `SELECT m.id, m.display_name, m.age_years, m.created_at, g.id AS greenhouse_id, g.current_plant_type,
     g.growth_percent, g.sunlight, g.water FROM family_members m
     JOIN greenhouses g ON g.child_member_id = m.id WHERE m.family_id = ? AND m.role = 'child' ORDER BY m.created_at`, family.id
  );
  const parentSleepByDate: Record<string, number> = {};
  const children: ChildProfile[] = [];
  for (const ch of oldChildren) {
    const flowers = await database.getAllAsync<{id:string; plant_type:PlantType; completed_at:string}>(
      'SELECT id, plant_type, completed_at FROM completed_plants WHERE greenhouse_id = ? ORDER BY completed_at DESC', ch.greenhouse_id
    );
    const oldRecords = await database.getAllAsync<OldRecord>(
      'SELECT * FROM sleep_records WHERE greenhouse_id = ? ORDER BY recorded_at DESC', ch.greenhouse_id
    );
    const records: SleepRecord[] = oldRecords.map(r => {
      const day = localDay(new Date(r.recorded_at));
      if (r.parent_sleep_hours !== null && validHours(r.parent_sleep_hours) && parentSleepByDate[day] === undefined) parentSleepByDate[day] = r.parent_sleep_hours;
      return {
        id: r.id, day, recordedAt: r.recorded_at,
        parentHours: r.parent_sleep_hours ?? 0, childHours: r.child_sleep_hours ?? 0,
        parentScore: r.parent_score, childScore: r.child_score,
        sunlight: r.sunlight, water: r.water, growthIncrement: r.growth_increment, source: 'manual' as const
      };
    });
    children.push({ id: ch.id, name: ch.display_name, age: ch.age_years, createdAt: ch.created_at,
      greenhouse: { ...newGreenhouse(), currentPlantType: ch.current_plant_type, growthPercent: ch.growth_percent,
        sunlight: ch.sunlight, water: ch.water,
        completedPlants: flowers.map(f => ({id: f.id, plantType: f.plant_type, completedAt: f.completed_at})) },
      records
    });
  }
  const oldConsent = await database.getFirstAsync<{status:string;document_version:string;recorded_at:string}>(
    'SELECT status, document_version, recorded_at FROM research_consents WHERE family_id = ? ORDER BY recorded_at DESC LIMIT 1',family.id);
  const oldPolicies = await database.getAllAsync<{policy_type:string;document_version:string;accepted_at:string}>(
    'SELECT policy_type, document_version, accepted_at FROM policy_acceptances WHERE account_id = ?',oldAccount.id);
  const findPolicy = (kind:string) => oldPolicies.find(p => p.policy_type === kind);
  const terms = findPolicy('terms_of_service'), privacy = findPolicy('privacy_policy'), health = findPolicy('health_data_notice');
  const consents: ConsentState = {
    termsVersion: terms?.document_version ?? 'legacy', termsAcceptedAt: terms?.accepted_at ?? oldAccount.created_at,
    privacyVersion: privacy?.document_version ?? 'legacy', privacyAcceptedAt: privacy?.accepted_at ?? oldAccount.created_at,
    healthVersion: health?.document_version ?? 'legacy', healthAcceptedAt: health?.accepted_at ?? oldAccount.created_at,
    researchVersion: oldConsent?.document_version ?? 'legacy',
    researchChoice: oldConsent?.status === 'granted' ? 'granted' : 'declined',
    researchRecordedAt: oldConsent?.recorded_at ?? oldAccount.created_at
  };
  const active = await database.getFirstAsync<{value:string}>("SELECT value FROM app_settings WHERE key='active_account_id'");
  const migrated: FamilyData = {
    schemaVersion: 2, id: oldAccount.id, username: oldAccount.username,
    passwordSalt: oldAccount.password_salt, passwordHash: oldAccount.password_hash,
    parentName: parent.display_name, parentAge: parent.age_years, children,
    parentSleepByDate, consents, sessionActive: active?.value === oldAccount.id,
    createdAt: oldAccount.created_at, updatedAt: new Date().toISOString()
  };
  await saveLocalData(migrated);
  return migrated;
}

export async function saveLocalData(value: FamilyData) {
  const database = await db();
  await database.runAsync('INSERT INTO cycle2_state (id, payload) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload', JSON.stringify(value));
}

export async function deleteLocalData() {
  const database = await db();
  await database.withTransactionAsync(async () => {
    await database.runAsync('DELETE FROM cycle2_state WHERE id = 1');
    // Remove any original account data too, so a reset cannot restore an old profile.
    const legacy = await database.getFirstAsync<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'");
    if (legacy) {
      for (const table of ['sleep_records','completed_plants','research_consents','policy_acceptances','greenhouses','family_members','families','accounts','app_settings']) {
        const exists = await database.getFirstAsync<{name:string}>("SELECT name FROM sqlite_master WHERE type='table' AND name = ?",table);
        if (exists) await database.runAsync(`DELETE FROM ${table}`);
      }
    }
  });
}
