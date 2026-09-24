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
  resetAllLocalData
} from '../data/persistence';
import type {
  AuthResult,
  CreateAccountInput,
  GreenhouseState,
  PlantType,
  Setup,
  SleepGoalScore,
  SleepRecord
} from '../domain/models';
import { validatePassword, validatePrivateUsername } from '../services/authService';
import { calculateDailyGrowth } from '../services/growthService';

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
  applySleepGoalScore: (score: SleepGoalScore) => Promise<void>;
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

  const applySleepGoalScore = async (score: SleepGoalScore) => {
    if (!setup) return;

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
      applySleepGoalScore,
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
