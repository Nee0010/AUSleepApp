import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';
import { Page, Heading, Card, Button, Field, Note } from '../components/UI';
import { useApp } from '../store/AppContext';
import { goalFor, localDay, scoreHours, validAge, validHours } from '../services/sleepRules';
import { theme } from '../constants/theme';
export default function SleepEntry() {
  const {childId}=useLocalSearchParams<{childId?:string}>();
  const {family,recordSleep}=useApp();
  const child=family?.children.find(ch=>ch.id===childId);
  const today=localDay();
  const [parentText,setParentText]=useState(''),[childText,setChildText]=useState(''),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  if (!family?.sessionActive || !child) return <Page><Heading title="Choose a greenhouse"/><Button title="Home" onPress={()=>router.replace('/')}/></Page>;
  if (!validAge(family.parentAge??NaN,'parent') || !validAge(child.age??NaN,'child')) return <Page><Heading title="Age information needed" subtitle="Set the parent and child's ages in Settings before recording sleep."/><Button title="Open Settings" onPress={()=>router.push('/settings')}/></Page>;
  const savedParent=family.parentSleepByDate[today];
  const parentHours=savedParent===undefined?Number(parentText):savedParent;
  const childHours=Number(childText);
  const parentValid=(savedParent!==undefined || parentText.trim()!=='') && validHours(parentHours);
  const childValid=childText.trim()!=='' && validHours(childHours);
  const already=child.records.some(r=>r.day===today);
  const parentGoal=goalFor(family.parentAge!,'parent'),childGoal=goalFor(child.age!,'child');
  async function save() {setBusy(true);const result=await recordSleep(child.id,childHours,parentHours,today);setBusy(false);if(result.ok)router.replace({pathname:'/greenhouse',params:{childId:child.id}});else setError(result.message??'Could not record sleep.');}
  return <Page><Heading eyebrow="Manual sleep tracking" title={`Record sleep for ${child.name}`} subtitle={`Date: ${today}. Enter total hours slept in the last 24 hours, including naps.`}/>
    <Card><Text style={{fontWeight:'800',fontSize:17,color:theme.colors.text}}>{family.parentName}'s sleep ☀️</Text>
      <Note>Recommended: {parentGoal.label}. Parent sleep is shared with all children for the same day.</Note>
      {savedParent===undefined ? <Field label="Parent hours" value={parentText} onChangeText={setParentText} placeholder="8" keyboardType="decimal-pad"/>:
        <Field label="Parent hours (already saved today)" value={String(savedParent)} onChangeText={()=>{}} editable={false}/>}
      {parentValid?<Note>Sunlight score: {scoreHours(family.parentAge!,parentHours,'parent').score}/100</Note>:<Note>Enter 0–24 hours.</Note>}
    </Card>
    <Card><Text style={{fontWeight:'800',fontSize:17,color:theme.colors.text}}>{child.name}'s sleep 💧</Text>
      <Note>Recommended: {childGoal.label}</Note><Field label="Child hours" value={childText} onChangeText={setChildText} placeholder="9" keyboardType="decimal-pad"/>
      {childValid?<Note>Water score: {scoreHours(child.age!,childHours,'child').score}/100</Note>:<Note>Enter 0–24 hours.</Note>}
    </Card>
    <Card><Note>Growth uses the lower of the two scores. A full day contributes one-seventh of a plant. Only one entry per child per day is allowed to prevent double counting.</Note>
      <Note>Entry source: manual. Wearable integration is planned for Cycle 3.</Note></Card>
    {already?<Note error>A sleep entry for {child.name} already exists today. See their history.</Note>:null}
    {error?<Note error>{error}</Note>:null}
    <Button title={busy?'Saving...':'Save Sleep Entry'} disabled={busy || already || !parentValid || !childValid} onPress={save}/>
    <Button title="View History" subtle onPress={()=>router.push({pathname:'/history',params:{childId:child.id}})}/>
  </Page>;
}
