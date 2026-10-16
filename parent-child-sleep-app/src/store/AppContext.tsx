import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import * as persistence from '../data/persistence';
import type { ChildProfile, ConsentChoice, CreateAccount, FamilyData, OpResult } from '../domain/models';
import { newGreenhouse } from '../domain/models';
import { normalizeUsername, newSalt, passwordHash, randomId, validatePassword, validateUsername } from '../services/auth';
import { addProgress } from '../services/growth';
import { isDuplicateDay, localDay, scoreHours, validAge, validHours } from '../services/sleepRules';
import { POLICY_VERSIONS } from '../constants/policies';

type Store = {
  ready: boolean; error: string | null; family: FamilyData | null;
  createAccount(input: CreateAccount): Promise<OpResult>;
  signIn(username:string, password:string): Promise<OpResult>;
  signOut(): Promise<OpResult>;
  addChild(name:string, age:number): Promise<OpResult>;
  updateParent(name:string,age:number): Promise<OpResult>;
  updateChild(childId:string,name:string,age:number): Promise<OpResult>;
  removeChild(childId:string): Promise<OpResult>;
  recordSleep(childId:string, childHours:number, parentHours:number, day?:string): Promise<OpResult>;
  setResearchChoice(choice:ConsentChoice): Promise<OpResult>;
  deleteAll(): Promise<OpResult>;
};
const Context = createContext<Store | null>(null);
const bad = (message: string): OpResult => ({ok:false,message});
const success: OpResult = {ok:true};
const validName = (name:string) => name.trim().length >= 1 && name.trim().length <= 40;

export function AppProvider({children}:{children:React.ReactNode}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState<FamilyData | null>(null);
  const dataRef = useRef<FamilyData | null>(null);
  const saving = useRef(false);
  useEffect(() => {
    let mounted = true;
    persistence.loadLocalData().then(data => {
      if (!mounted) return;
      dataRef.current = data;
      setFamily(data);
    }).catch(() => {
      if (mounted) setError('Could not open saved data. No data has been deleted.');
    }).finally(() => { if (mounted) setReady(true); });
    return () => { mounted = false; };
  }, []);

  const commit = useCallback(async (mutate:(current:FamilyData|null) => FamilyData|null): Promise<OpResult> => {
    if (saving.current) return bad('Another change is being saved. Try again.');
    saving.current = true;
    const previous = dataRef.current;
    try {
      const next = mutate(previous);
      if (next === null) await persistence.deleteLocalData();
      else await persistence.saveLocalData({ ...next, updatedAt: new Date().toISOString() });
      const stored = next ? {...next,updatedAt:new Date().toISOString()} : null;
      dataRef.current = stored;
      setFamily(stored);
      return success;
    } catch {
      dataRef.current = previous;
      return bad('Could not save the change to local storage.');
    } finally { saving.current = false; }
  }, []);

  const createAccount = useCallback(async (input:CreateAccount):Promise<OpResult> => {
    if (dataRef.current) return bad('An account already exists on this device.');
    if (!validName(input.parentName) || !validName(input.childName)) return bad('Enter parent and child names (1–40 characters).');
    if (!validAge(input.parentAge,'parent') || !validAge(input.childAge,'child')) return bad('Parent age must be 18–99+ and child age 5–17.');
    const usernameError = validateUsername(input.username,input.parentName,input.childName);
    if (usernameError) return bad(usernameError);
    const passwordError = validatePassword(input.password);
    if (passwordError) return bad(passwordError);
    const now = new Date().toISOString();
    const salt = newSalt(), hashed = await passwordHash(input.password,salt);
    const fresh: FamilyData = {
      schemaVersion:2,id:randomId(),username:normalizeUsername(input.username),passwordSalt:salt,passwordHash:hashed,
      parentName:input.parentName.trim(),parentAge:input.parentAge,
      children:[{id:randomId(),name:input.childName.trim(),age:input.childAge,createdAt:now,greenhouse:newGreenhouse(),records:[]}],
      parentSleepByDate:{},sessionActive:true,createdAt:now,updatedAt:now,
      consents:{
        termsVersion:POLICY_VERSIONS.terms,termsAcceptedAt:now,privacyVersion:POLICY_VERSIONS.privacy,privacyAcceptedAt:now,
        healthVersion:POLICY_VERSIONS.health,healthAcceptedAt:now,researchVersion:POLICY_VERSIONS.research,
        researchChoice:input.researchChoice,researchRecordedAt:now
      }
    };
    return commit(current => current ?? fresh);
  },[commit]);

  const signIn = useCallback(async (name:string, password:string):Promise<OpResult> => {
    const current = dataRef.current;
    if (!current || normalizeUsername(name) !== current.username) return bad('Incorrect username or password.');
    const hash = await passwordHash(password,current.passwordSalt);
    if (hash !== current.passwordHash) return bad('Incorrect username or password.');
    return commit(c => c ? {...c,sessionActive:true} : c);
  },[commit]);
  const signOut = useCallback(() => commit(c => c ? {...c,sessionActive:false} : c),[commit]);

  const addChild = useCallback((name:string,age:number):Promise<OpResult> => {
    if (!validName(name) || !validAge(age,'child')) return Promise.resolve(bad('Enter a child name (1–40 characters) and age (5–17).'));
    if (dataRef.current?.children.some(c => c.name.toLowerCase() === name.trim().toLowerCase())) return Promise.resolve(bad('A child with that name is already listed.'));
    const child:ChildProfile = {id:randomId(),name:name.trim(),age,createdAt:new Date().toISOString(),greenhouse:newGreenhouse(),records:[]};
    return commit(c => c ? {...c,children:[...c.children,child]} : c);
  },[commit]);
  const updateParent = useCallback((name:string,age:number):Promise<OpResult> => {
    if (!validName(name) || !validAge(age,'parent')) return Promise.resolve(bad('Parent name must be 1–40 characters and age 18–99+.'));
    return commit(c => c ? {...c,parentName:name.trim(),parentAge:age} : c);
  },[commit]);
  const updateChild = useCallback((id:string,name:string,age:number):Promise<OpResult> => {
    const current = dataRef.current;
    if (!current?.children.some(ch => ch.id === id)) return Promise.resolve(bad('Child not found.'));
    if (!validName(name) || !validAge(age,'child')) return Promise.resolve(bad('Child name must be 1–40 characters and age 5–17.'));
    if (current.children.some(ch => ch.id !== id && ch.name.toLowerCase() === name.trim().toLowerCase())) return Promise.resolve(bad('That child name is already in use.'));
    return commit(c => c ? {...c,children:c.children.map(ch => ch.id === id ? {...ch,name:name.trim(),age} : ch)} : c);
  },[commit]);
  const removeChild = useCallback((id:string):Promise<OpResult> => {
    const current = dataRef.current;
    if (!current?.children.some(ch => ch.id === id)) return Promise.resolve(bad('Child not found.'));
    if (current.children.length <= 1) return Promise.resolve(bad('You must keep at least one child profile. Delete all local data to remove the account.'));
    return commit(c => c ? {...c,children:c.children.filter(ch => ch.id !== id)} : c);
  },[commit]);

  const recordSleep = useCallback((id:string,childHours:number,parentHours:number,day=localDay()):Promise<OpResult> => {
    const current = dataRef.current;
    const child = current?.children.find(ch => ch.id === id);
    if (!current?.sessionActive || !child) return Promise.resolve(bad('Select a child and sign in first.'));
    if (!validAge(current.parentAge ?? NaN,'parent') || !validAge(child.age ?? NaN,'child')) return Promise.resolve(bad('Set valid parent and child ages in Settings first.'));
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || day > localDay()) return Promise.resolve(bad('Invalid sleep date.'));
    if (!validHours(parentHours) || !validHours(childHours)) return Promise.resolve(bad('Sleep hours must be between 0 and 24.'));
    if (isDuplicateDay(child.records, day)) return Promise.resolve(bad('Sleep has already been recorded for this child today.'));
    const previously = current.parentSleepByDate[day];
    if (previously !== undefined && Math.abs(previously-parentHours)>0.001) return Promise.resolve(bad('Parent sleep hours must match the shared entry already saved for this day.'));
    const parentScore = scoreHours(current.parentAge!,parentHours,'parent').score;
    const childScore = scoreHours(child.age!,childHours,'child').score;
    const now = new Date().toISOString();
    const record = {
      id:randomId(), day, recordedAt:now, parentHours, childHours,
      parentScore, childScore, sunlight:parentScore,water:childScore,
      growthIncrement:Math.min(parentScore,childScore)/7,source:'manual' as const
    };
    return commit(c => c ? {
      ...c,parentSleepByDate:{...c.parentSleepByDate,[day]:parentHours},
      children:c.children.map(ch => ch.id === id ? addProgress(ch,record,randomId()) : ch)
    } : c);
  },[commit]);
  const setResearchChoice = useCallback((choice:ConsentChoice) => commit(c => c ? {
    ...c,consents:{...c.consents,researchChoice:choice,researchRecordedAt:new Date().toISOString()}
  } : c),[commit]);
  const deleteAll = useCallback(() => commit(() => null),[commit]);
  return <Context.Provider value={{ready,error,family,createAccount,signIn,signOut,addChild,updateParent,updateChild,removeChild,recordSleep,setResearchChoice,deleteAll}}>{children}</Context.Provider>;
}
export function useApp() { const context=useContext(Context); if(!context) throw new Error('Missing AppProvider'); return context; }
