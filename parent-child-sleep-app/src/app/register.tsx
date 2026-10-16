import React, { useState } from 'react';
import { router } from 'expo-router';
import { Modal, Text, Pressable } from 'react-native';
import { Page, Heading, Card, Button, Field, Note, SectionTitle } from '../components/UI';
import { useApp } from '../store/AppContext';
import { randomUsername } from '../services/auth';
import { POLICY_DOCUMENTS } from '../constants/policies';
import { PolicyContent } from '../components/PolicyContent';
import { theme } from '../constants/theme';
const documents = [
  POLICY_DOCUMENTS.terms, POLICY_DOCUMENTS.privacy,
  POLICY_DOCUMENTS.health, POLICY_DOCUMENTS.research
] as const;
type DocumentKey = typeof documents[number]['key'];
export default function Register() {
  const {family,createAccount} = useApp();
  const [username,setUsername]=useState(''),[password,setPassword]=useState(''),[confirm,setConfirm]=useState('');
  const [parentName,setParentName]=useState(''),[parentAge,setParentAge]=useState(''),[childName,setChildName]=useState(''),[childAge,setChildAge]=useState('');
  const [accepted,setAccepted]=useState<Record<string,boolean>>({});
  const [research,setResearch]=useState<'granted'|'declined'>('declined');
  const [open,setOpen]=useState<DocumentKey|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
  if(family) return <Page><Heading title="Account already exists"/><Button title="Home" onPress={()=>router.replace('/')}/></Page>;
  const doc = documents.find(d=>d.key===open);
  const requiredAccepted=accepted.terms && accepted.privacy && accepted.health;
  async function create() {
    if(password !== confirm) {setError('Passwords do not match.');return;}
    if(!requiredAccepted) {setError('Please agree to the Terms and acknowledge both privacy notices.');return;}
    setBusy(true);
    const r=await createAccount({username,password,parentName,parentAge:Number(parentAge),childName,childAge:Number(childAge),researchChoice:research});
    setBusy(false);if(r.ok) router.replace('/');else setError(r.message??'Account could not be created.');
  }
  return <Page><Heading eyebrow="Local account" title="Create your family" subtitle="A parent manages this account. Use a non-identifying username."/>
    <Card><SectionTitle>Login information</SectionTitle><Field label="Private username" value={username} onChangeText={setUsername} autoCapitalize="none"/>
      <Button title="Generate Private Username" subtle onPress={()=>setUsername(randomUsername())}/>
      <Field label="Password (8+ characters)" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"/>
      <Field label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoCapitalize="none"/>
      <Note>Passwords are verified locally in this prototype. Production authentication is scheduled for Cycle 3.</Note>
    </Card>
    <Card><SectionTitle>Parent profile</SectionTitle><Field label="Parent display name" value={parentName} onChangeText={setParentName}/><Field label="Parent age (18–99+)" value={parentAge} onChangeText={setParentAge} keyboardType="number-pad"/></Card>
    <Card><SectionTitle>First child</SectionTitle><Field label="Child display name" value={childName} onChangeText={setChildName}/><Field label="Child age (5–17)" value={childAge} onChangeText={setChildAge} keyboardType="number-pad"/><Note>You can add more children later.</Note></Card>
    <Card><SectionTitle>Terms, privacy, and health information</SectionTitle><Note>Open each document to read its full contents. Your acknowledgement is recorded with your account.</Note>
      {documents.slice(0,3).map(d=><Pressable key={d.key} accessibilityRole="button" onPress={()=>setOpen(d.key)} style={{padding:12,backgroundColor:theme.colors.surfaceMuted,borderRadius:10}}>
        <Text style={{fontWeight:'800',color:theme.colors.text}}>{accepted[d.key]?'☑':'☐'}  {d.key === 'terms' ? 'Review and agree:' : 'Review and acknowledge:'} {d.title}</Text>
      </Pressable>)}
      <Note>You must agree to the Terms of Service and acknowledge the Privacy Statement and Health Data Notice before creating an account.</Note>
    </Card>
    <Card><SectionTitle>Optional research preference</SectionTitle><Button title="Read Research Participation and Parental Permission" subtle onPress={()=>setOpen('research')}/>
      <Note>Your answer is optional and stored on this device. No research data sharing is enabled.</Note>
      <Button title={research==='granted'?'◉ Yes, record my interest':'○ Yes, record my interest'} subtle onPress={()=>setResearch('granted')}/>
      <Button title={research==='declined'?'◉ No, not now':'○ No, not now'} subtle onPress={()=>setResearch('declined')}/>
    </Card>
    {error?<Note error>{error}</Note>:null}<Button title={busy?'Creating...':'Create Account'} disabled={busy || !requiredAccepted} onPress={create}/>
    <Modal visible={Boolean(doc)} animationType="slide" presentationStyle="pageSheet" onRequestClose={()=>setOpen(null)}>
      <Page><Heading eyebrow="Account documents" title={doc?.title??''}/><Card>{doc ? <PolicyContent document={doc} /> : null}</Card>
        {doc?.key==='research' ? <Button title="Close" onPress={()=>setOpen(null)}/> : <Button title={doc?.key==='terms'?'I Agree to the Terms':`I Have Read and Acknowledge ${doc?.title??'This Notice'}`} onPress={()=>{if(doc) setAccepted(v=>({...v,[doc.key]:true}));setOpen(null);}}/>}
        {doc?.key !== 'research' ? <Button title="Back without acknowledging" subtle onPress={()=>setOpen(null)}/> : null}</Page>
    </Modal>
  </Page>;
}
