import type { FamilyData, ChildProfile, SleepRecord } from '../domain/models';
import { newGreenhouse } from '../domain/models';
import { localDay, validHours } from '../services/sleepRules';
const KEY = 'sleep-greenhouse-cycle2-v1';
const OLD_KEY = 'sleep-greenhouse-web-v2';

// Web is only a convenience demo, not a secure participant-data environment.
const store = () => typeof window === 'undefined' ? null : window.localStorage;
export async function loadLocalData(): Promise<FamilyData | null> {
  const storage = store(); if (!storage) return null;
  const value = storage.getItem(KEY);
  if (value) return JSON.parse(value) as FamilyData;
  const legacy = storage.getItem(OLD_KEY);
  if (!legacy) return null;
  const old = JSON.parse(legacy);
  if (!old?.account || !old?.setup) return null;
  const setup = old.setup;
  const records: SleepRecord[] = (old.sleepRecords ?? []).map((r: any) => ({
    id: r.id, day: localDay(new Date(r.recordedAt)), recordedAt: r.recordedAt,
    parentHours: r.parentSleepHours ?? 0, childHours: r.childSleepHours ?? 0,
    parentScore: r.parentScore, childScore: r.childScore,
    sunlight: r.sunlight, water: r.water, growthIncrement: r.growthIncrement, source: 'manual' as const
  }));
  const parentSleepByDate: Record<string, number> = {};
  for (const record of records.slice().reverse()) if (validHours(record.parentHours)) parentSleepByDate[record.day] = record.parentHours;
  const child: ChildProfile = {
    id: setup.childId, name: setup.childName, age: setup.childAge ?? null, createdAt: old.account.createdAt,
    greenhouse: { ...newGreenhouse(), ...old.greenhouse, completedPlants: old.greenhouse?.completedPlants ?? [] }, records
  };
  const now = new Date().toISOString();
  const agreements = old.agreements ?? {};
  const migrated: FamilyData = {
    schemaVersion: 2, id: old.account.id, username: old.account.username,
    passwordSalt: old.account.passwordSalt, passwordHash: old.account.passwordHash,
    parentName: setup.parentName, parentAge: setup.parentAge ?? null, children: [child],
    parentSleepByDate, sessionActive: old.activeAccountId === old.account.id,
    createdAt: old.account.createdAt ?? now, updatedAt: now,
    consents: {
      termsVersion: agreements.termsVersion ?? 'legacy', termsAcceptedAt: agreements.termsAcceptedAt ?? now,
      privacyVersion: agreements.privacyVersion ?? 'legacy', privacyAcceptedAt: agreements.privacyAcceptedAt ?? now,
      healthVersion: agreements.healthDataVersion ?? 'legacy', healthAcceptedAt: agreements.healthDataAcceptedAt ?? now,
      researchVersion: agreements.researchVersion ?? 'legacy', researchChoice: agreements.researchStatus === 'granted' ? 'granted' : 'declined',
      researchRecordedAt: agreements.researchRecordedAt ?? now
    }
  };
  await saveLocalData(migrated);
  return migrated;
}
export async function saveLocalData(value: FamilyData) { store()?.setItem(KEY, JSON.stringify(value)); }
export async function deleteLocalData() { store()?.removeItem(KEY); store()?.removeItem(OLD_KEY); }
