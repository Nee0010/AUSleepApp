import React, { useState } from 'react';
import { router } from 'expo-router';
import { Alert, Platform, Text, View } from 'react-native';
import { useApp } from '../store/AppContext';
import type { ChildProfile } from '../domain/models';
import { Page, Heading, Card, Button, Field, Note, SectionTitle } from '../components/UI';
import { theme } from '../constants/theme';

function confirmDestructive(title:string,message:string,action:()=>void) {
  if (Platform.OS === 'web') {if(typeof window !== 'undefined' && window.confirm(message)) action();}
  else Alert.alert(title,message,[{text:'Cancel',style:'cancel'},{text:'Delete',style:'destructive',onPress:action}]);
}
function ChildSettings({child,total}:{child:ChildProfile,total:number}) {
  const {updateChild,removeChild}=useApp();
  const [name,setName]=useState(child.name),[age,setAge]=useState(child.age===null?'':String(child.age)),[message,setMessage]=useState('');
  async function save() {const result=await updateChild(child.id,name,Number(age));setMessage(result.ok?'Child profile saved.':result.message??'Save failed.');}
  function remove() {confirmDestructive('Delete child?',`Permanently delete ${child.name}'s greenhouse, sleep history, and completed plants from this device?`,async()=>{
    const result=await removeChild(child.id);setMessage(result.ok?'Child removed.':result.message??'Could not remove child.');
  });}
  return <Card><SectionTitle>{child.name}'s profile</SectionTitle>
    <Field label="Child name" value={name} onChangeText={setName}/>
    <Field label="Child age (5–17)" value={age} onChangeText={setAge} keyboardType="number-pad"/>
    {message?<Note error={!message.endsWith('saved.')}>{message}</Note>:null}
    <Button title="Save Child Profile" onPress={save}/>
    {total>1?<Button title="Delete Child and Their Records" danger onPress={remove}/>:<Note>You cannot delete the last child from this page. Use Delete All Local Data below to delete the entire account.</Note>}
  </Card>;
}
export default function Settings() {
  const {family,updateParent,signOut,setResearchChoice,deleteAll}=useApp();
  const [parentName,setParentName]=useState(family?.parentName??''),[parentAge,setParentAge]=useState(family?.parentAge===null?'':String(family?.parentAge??''));
  const [message,setMessage]=useState(''),[busy,setBusy]=useState(false);
  if(!family?.sessionActive) return <Page><Heading title="Sign in to view settings"/><Button title="Home" onPress={()=>router.replace('/')}/></Page>;
  async function saveParent() {setBusy(true);const r=await updateParent(parentName,Number(parentAge));setBusy(false);setMessage(r.ok?'Parent profile saved.':r.message??'Could not save.');}
  async function choice(value:'granted'|'declined') {setBusy(true);const r=await setResearchChoice(value);setBusy(false);setMessage(r.ok?'Research preference saved on this device.':r.message??'Could not save.');}
  async function logout() {setBusy(true);const r=await signOut();setBusy(false);if(r.ok)router.replace('/');else setMessage(r.message??'Sign out failed.');}
  function reset() {confirmDestructive('Delete all local data?',
    'This permanently deletes the local account, all child profiles, sleep entries, plants, and consent choices on this device. This cannot be undone.',async()=>{
      setBusy(true);const r=await deleteAll();setBusy(false);if(r.ok)router.replace('/');else setMessage(r.message??'Deletion failed.');
    });}
  return <Page><Heading eyebrow="Account Settings" title="Manage your family" subtitle={`Username: ${family.username}`}/>
    <Card><SectionTitle>Parent profile</SectionTitle>
      <Field label="Parent name" value={parentName} onChangeText={setParentName}/>
      <Field label="Parent age (18–99+)" value={parentAge} onChangeText={setParentAge} keyboardType="number-pad"/>
      <Button title="Save Parent Profile" disabled={busy} onPress={saveParent}/></Card>
    <SectionTitle>Child profiles</SectionTitle>
    {family.children.map(ch=><ChildSettings key={ch.id} child={ch} total={family.children.length}/>)}
    <Card><SectionTitle>Research participation</SectionTitle><Note>Optional. Your choice is saved on this device only. No research upload is active.</Note>
      <Text style={{color:theme.colors.text}}>Current choice: <Text style={{fontWeight:'800'}}>{family.consents.researchChoice==='granted'?'Yes':'No'}</Text></Text>
      <Button title="Record Interest in Research" disabled={busy} subtle={family.consents.researchChoice==='granted'} onPress={()=>choice('granted')}/>
      <Button title="Decline / Withdraw Research Interest" disabled={busy} subtle={family.consents.researchChoice==='declined'} onPress={()=>choice('declined')}/>
      <Note>Withdrawing changes the stored choice. There is no research data transfer in Cycle 2. If a separate study starts, its own withdrawal procedures will be explained during enrollment.</Note>
      <Button title="Read Privacy and Consent Details" subtle onPress={()=>router.push('/privacy')}/>
    </Card>
    <Card><SectionTitle>Storage and wearable settings</SectionTitle>
      <Note>Mode: manual entry. Data: local device only. Cloud sync and Apple Health/Health Connect connection are not available until Cycle 3.</Note>
      <Note>Current device accounts use a development-only password verifier. Use only test data. The app does not yet encrypt the database separately.</Note>
    </Card>
    {message?<Note error={!message.includes('saved')}>{message}</Note>:null}
    <Button title="Sign Out" disabled={busy} onPress={logout}/>
    <Button title="Delete All Local Data" danger disabled={busy} onPress={reset}/>
  </Page>;
}
