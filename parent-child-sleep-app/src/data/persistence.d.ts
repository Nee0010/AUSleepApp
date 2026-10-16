import type { FamilyData } from '../domain/models';
export function loadLocalData():Promise<FamilyData|null>;
export function saveLocalData(value:FamilyData):Promise<void>;
export function deleteLocalData():Promise<void>;
