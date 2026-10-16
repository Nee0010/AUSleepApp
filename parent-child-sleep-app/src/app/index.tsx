import React, { useState } from 'react';
import { router } from 'expo-router';
import { ActivityIndicator, Text, View } from 'react-native';
import { useApp } from '../store/AppContext';
import { Page, Heading, Card, Button, Field, Note, SectionTitle, ProgressBar } from '../components/UI';
import { theme } from '../constants/theme';

function SignIn() {
  const {signIn} = useApp();
  const [username,setUsername] = useState(''),[password,setPassword] = useState(''),[error,setError] = useState(''),[busy,setBusy]=useState(false);
  async function submit() {setBusy(true); const r=await signIn(username,password);if(!r.ok) setError(r.message ?? 'Could not sign in.');setBusy(false);}
  return <Page><Heading eyebrow="Sleep Greenhouse" title="Welcome back" subtitle="Sign in to see your family greenhouses."/><Card>
    <Field label="Username" value={username} onChangeText={setUsername} autoCapitalize="none"/>
    <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none"/>
    {error ? <Note error>{error}</Note> : null}<Button disabled={busy} title={busy?'Signing in...':'Sign In'} onPress={submit}/>
    <Note>No cloud recovery is available in this development build. Keep your login details safe.</Note>
  </Card><Button title="View Privacy Statement" subtle onPress={()=>router.push('/privacy')}/></Page>;
}
function Home() {
  const {family,addChild} = useApp();
  const [adding,setAdding]=useState(false),[name,setName]=useState(''),[age,setAge]=useState(''),[error,setError]=useState('');
  if (!family) return null;
  async function add() {const r=await addChild(name,Number(age));if(!r.ok){setError(r.message??'Could not add child.');return;}setName('');setAge('');setError('');setAdding(false);}
  return <Page><Heading eyebrow="Sleep Greenhouse" title={`Hello, ${family.parentName}!`} subtitle="Your family's sleep grows something good."/>
    <Card><SectionTitle>Your greenhouses</SectionTitle><Note>Each child has their own plant progress. Your parent sleep hours are shared for the same day.</Note></Card>
    {family.children.map(ch => <Card key={ch.id}>
      <Text style={{fontSize:21,color:theme.colors.text,fontWeight:'800'}}>🌱 {ch.name}'s Greenhouse</Text>
      <Text style={{color:theme.colors.textMuted}}>Age {ch.age??'not set'} · {ch.greenhouse.currentPlantType} · {Math.round(ch.greenhouse.growthPercent)}% complete</Text>
      <ProgressBar value={ch.greenhouse.growthPercent}/>
      <View style={{flexDirection:'row',gap:8}}>
        <View style={{flex:1}}><Button title="Open" onPress={()=>router.push({pathname:'/greenhouse',params:{childId:ch.id}})}/></View>
        <View style={{flex:1}}><Button title="Add Sleep" subtle onPress={()=>router.push({pathname:'/sleep-entry',params:{childId:ch.id}})}/></View>
      </View>
    </Card>)}
    {adding ? <Card><SectionTitle>Add a child</SectionTitle>
      <Field label="Child display name" value={name} onChangeText={setName}/><Field label="Child age (5–17)" value={age} onChangeText={setAge} keyboardType="number-pad"/>
      {error?<Note error>{error}</Note>:null}<Button title="Save Child" onPress={add}/><Button title="Cancel" subtle onPress={()=>{setAdding(false);setError('');}}/>
    </Card>:<Button title="+ Add Another Child" onPress={()=>setAdding(true)}/>}
    <Button title="Account Settings" subtle onPress={()=>router.push('/settings')}/><Button title="Privacy and Consent" subtle onPress={()=>router.push('/privacy')}/>
  </Page>;
}
export default function Index() {
  const {ready,error,family} = useApp();
  if(!ready) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><ActivityIndicator size="large"/><Text>Loading Sleep Greenhouse...</Text></View>;
  if(error) return <Page><Heading title="Unable to load data"/><Note error>{error}</Note><Note>No saved data has been removed. Restart the app or check its storage permissions.</Note></Page>;
  if(!family) return <Page><Heading eyebrow="Parent & Child Sleep App" title="Grow healthier sleep habits together" subtitle="Create a local parent account, enter sleep hours, and grow a garden for each child."/>
    <Card><Text style={{fontSize:56,textAlign:'center'}}>🌻 ☀️ 💧</Text><Note>Parents manage every greenhouse from their own phone. This is a local development prototype, not a live study.</Note>
    <Button title="Create an Account" onPress={()=>router.push('/register')}/>
    <Button title="Read Privacy Statement" subtle onPress={()=>router.push('/privacy')}/></Card></Page>;
  return family.sessionActive ? <Home/> : <SignIn/>;
}
