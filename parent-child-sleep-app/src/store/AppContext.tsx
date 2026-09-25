import * as Crypto from 'expo-crypto';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  authenticateLocalAccount,
  clearSession,
  createLocalAccount,
  getActiveAccountId,
  hasLocalAccount,
  initialGreenhouse,
  initializePersistence,
  loadSetupAndGreenhouse,
  loadSleepRecords,
  persistDailyProgress,
  resetAllLocalData,
  updateProfileAges
} from '../data/persistence';
import type {
  AuthResult,
  CreateAccountInput,
  GreenhouseState,
  PlantType,
  Setup,
  SleepGoalScore,
  SleepHoursInput,
  SleepRecord
} from '../domain/models';
import { validatePassword, validatePrivateUsername } from '../services/authService';
import { calculateDailyGrowth } from '../services/growthService';
import {
  isValidChildAge,
  isValidParentAge,
  scoreSleepHours
} from '../services/sleepRecommendationService';

const plantRotation: PlantType[] = ['sunflower', 'tulip', 'daisy', 'lavender'];

type AppContextValue = {
  isReady: boolean;
  hasAccount: boolean;
  isSignedIn: boolean;
  setup: Setup | null;
  greenhouse: GreenhouseState;
  sleepRecords: SleepRecord[];
  createAccount: (input: CreateAccountInput) => Promise<AuthResult>;
  signIn: (username: string, password: string) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  saveProfileAges: (parentAge: number, childAge: number) => Promise<AuthResult>;
  applySleepHours: (input: SleepHoursInput) => Promise<void>;
  deleteAccountData: () => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [hasAccount, setHasAccount] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [setup, setSetup] = useState<Setup | null>(null);
  const [greenhouse, setGreenhouse] = useState<GreenhouseState>(initialGreenhouse);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);

  const refresh = useCallback(async () => {
    const accountExists = await hasLocalAccount();
    setHasAccount(accountExists);

    if (!accountExists) {
      setIsSignedIn(false);
      setSetup(null);
      setGreenhouse(initialGreenhouse);
      setSleepRecords([]);
      setIsReady(true);
      return;
    }

    const accountId = await getActiveAccountId();
    if (!accountId) {
      setIsSignedIn(false);
      setSetup(null);
      setGreenhouse(initialGreenhouse);
      setSleepRecords([]);
      setIsReady(true);
      return;
    }

    const loaded = await loadSetupAndGreenhouse(accountId);
    if (!loaded) {
      await clearSession();
      setIsSignedIn(false);
      setSetup(null);
      setGreenhouse(initialGreenhouse);
      setSleepRecords([]);
      setIsReady(true);
      return;
    }

    const records = await loadSleepRecords(loaded.setup.greenhouseId);
    setSetup(loaded.setup);
    setGreenhouse(loaded.greenhouse);
    setSleepRecords(records);
    setIsSignedIn(true);
    setIsReady(true);
  }, []);

  useEffect(() => {
    initializePersistence()
      .then(refresh)
      .catch((error) => {
        console.error('Failed to initialize app data', error);
        setIsReady(true);
      });
  }, [refresh]);

  const createAccount = async (input: CreateAccountInput): Promise<AuthResult> => {
    const usernameError = validatePrivateUsername(input.username, input.parentName, input.childName);
    if (usernameError) return { ok: false, message: usernameError };

    const passwordError = validatePassword(input.password);
    if (passwordError) return { ok: false, message: passwordError };

    if (!input.parentName.trim() || !input.childName.trim()) {
      return { ok: false, message: 'Parent and child display names are required.' };
    }

    if (!isValidParentAge(input.parentAge)) {
      return { ok: false, message: 'Parent age must be between 18 and 99+.' };
    }

    if (!isValidChildAge(input.childAge)) {
      return { ok: false, message: 'Child age must be between 5 and 17.' };
    }

    if (
      !input.agreements.termsAcceptedAt ||
      !input.agreements.privacyAcceptedAt ||
      !input.agreements.healthDataAcceptedAt
    ) {
      return { ok: false, message: 'Required agreements must be accepted before creating an account.' };
    }

    try {
      await createLocalAccount(input);
      await refresh();
      return { ok: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes('unique')) {
        return { ok: false, message: 'That username is already in use.' };
      }
      console.error('Create account failed', error);
      return { ok: false, message: 'Could not create the account.' };
    }
  };

  const signIn = async (username: string, password: string): Promise<AuthResult> => {
    try {
      const accountId = await authenticateLocalAccount(username, password);
      if (!accountId) return { ok: false, message: 'Username or password is incorrect.' };
      await refresh();
      return { ok: true };
    } catch (error) {
      console.error('Sign in failed', error);
      return { ok: false, message: 'Could not sign in.' };
    }
  };

  const signOut = async () => {
    await clearSession();
    setIsSignedIn(false);
    setSetup(null);
    setGreenhouse(initialGreenhouse);
    setSleepRecords([]);
  };

  const saveProfileAges = async (parentAge: number, childAge: number): Promise<AuthResult> => {
    if (!setup) return { ok: false, message: 'No profile is loaded.' };
    if (!isValidParentAge(parentAge)) return { ok: false, message: 'Parent age must be between 18 and 99+.' };
    if (!isValidChildAge(childAge)) return { ok: false, message: 'Child age must be between 5 and 17.' };

    try {
      await updateProfileAges(setup, parentAge, childAge);
      setSetup((current) => current ? { ...current, parentAge, childAge } : current);
      return { ok: true };
    } catch (error) {
      console.error('Save profile ages failed', error);
      return { ok: false, message: 'Could not save profile ages.' };
    }
  };

  const applySleepHours = async (input: SleepHoursInput) => {
    if (!setup || setup.parentAge === null || setup.childAge === null) return;

    const parentSleep = scoreSleepHours(setup.parentAge, input.parentHours, 'parent');
    const childSleep = scoreSleepHours(setup.childAge, input.childHours, 'child');
    const score: SleepGoalScore = {
      parentScore: parentSleep.score,
      childScore: childSleep.score
    };

    const reward = calculateDailyGrowth(score);
    const nextGrowth = greenhouse.growthPercent + reward.growthIncrement;
    const completed = nextGrowth >= 100;
    const completedPlant = completed
      ? {
          id: Crypto.randomUUID(),
          plantType: greenhouse.currentPlantType,
          completedAt: new Date().toISOString()
        }
      : undefined;

    const currentIndex = plantRotation.indexOf(greenhouse.currentPlantType);
    const nextPlantType = completed
      ? plantRotation[(currentIndex + 1) % plantRotation.length] ?? 'sunflower'
      : greenhouse.currentPlantType;
    const nextGrowthPercent = completed ? Math.max(0, nextGrowth - 100) : nextGrowth;

    const record = await persistDailyProgress({
      setup,
      nextPlantType,
      nextGrowthPercent,
      sunlight: reward.sunlight,
      water: reward.water,
      growthIncrement: reward.growthIncrement,
      parentSleepHours: input.parentHours,
      childSleepHours: input.childHours,
      parentScore: score.parentScore,
      childScore: score.childScore,
      completedPlant
    });

    setGreenhouse((current) => ({
      currentPlantType: nextPlantType,
      growthPercent: nextGrowthPercent,
      sunlight: reward.sunlight,
      water: reward.water,
      completedPlants: completedPlant ? [completedPlant, ...current.completedPlants] : current.completedPlants
    }));
    setSleepRecords((records) => [record, ...records].slice(0, 20));
  };

  const deleteAccountData = async () => {
    await resetAllLocalData();
    setHasAccount(false);
    setIsSignedIn(false);
    setSetup(null);
    setGreenhouse(initialGreenhouse);
    setSleepRecords([]);
  };

  const value = useMemo(
    () => ({
      isReady,
      hasAccount,
      isSignedIn,
      setup,
      greenhouse,
      sleepRecords,
      createAccount,
      signIn,
      signOut,
      saveProfileAges,
      applySleepHours,
      deleteAccountData
    }),
    [isReady, hasAccount, isSignedIn, setup, greenhouse, sleepRecords]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return context;
}
