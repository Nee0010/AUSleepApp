import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Page, Heading, Card, Button, Note, SectionTitle } from '../components/UI';
import { PlantVisual, CompletedFlower } from '../components/PlantVisual';
import { useApp } from '../store/AppContext';
import { theme } from '../constants/theme';
export default function GreenhouseScreen() {
  const {childId}=useLocalSearchParams<{childId?:string}>();
  const {family}=useApp();
  const child=family?.children.find(c=>c.id===childId);
  if(!child || !family?.sessionActive) return <Page><Heading title="Greenhouse unavailable"/><Button title="Home" onPress={()=>router.replace('/')}/></Page>;
  const gh=child.greenhouse;
  return <Page><Heading eyebrow="Current greenhouse" title={`${child.name}'s Greenhouse`} subtitle="Seven full shared-sleep days can grow one complete plant."/>
    <PlantVisual plantType={gh.currentPlantType} progress={gh.growthPercent}/>
    <View style={{flexDirection:'row',gap:10}}>
      <View style={{flex:1}}><Card><Text style={{fontSize:23}}>☀️</Text><Text style={{fontWeight:'800',color:theme.colors.text}}>{gh.sunlight} points</Text><Note>Parent sunlight</Note></Card></View>
      <View style={{flex:1}}><Card><Text style={{fontSize:23}}>💧</Text><Text style={{fontWeight:'800',color:theme.colors.text}}>{gh.water} points</Text><Note>Child water</Note></Card></View>
    </View>
    <Button title="Record Today's Sleep" onPress={()=>router.push({pathname:'/sleep-entry',params:{childId:child.id}})}/>
    <Button title="View Sleep History" subtle onPress={()=>router.push({pathname:'/history',params:{childId:child.id}})}/>
    <Card><SectionTitle>Completed plants ({gh.completedPlants.length})</SectionTitle>
      {gh.completedPlants.length===0?<Note>Your first plant is still growing.</Note>:<View style={{flexDirection:'row',flexWrap:'wrap',gap:10}}>
        {gh.completedPlants.map(p=><View key={p.id} style={{padding:10,backgroundColor:theme.colors.surfaceMuted,borderRadius:12,minWidth:120,alignItems:'center'}}>
          <CompletedFlower type={p.plantType}/><Text style={{color:theme.colors.text,fontWeight:'700',textTransform:'capitalize'}}>{p.plantType}</Text>
          <Note>{new Date(p.completedAt).toLocaleDateString()}</Note>
        </View>)}
      </View>}
    </Card><Button title="Back to All Greenhouses" subtle onPress={()=>router.replace('/')}/>
  </Page>;
}
