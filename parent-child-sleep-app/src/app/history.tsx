import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Page, Heading, Card, Button, Note, SectionTitle } from '../components/UI';
import { useApp } from '../store/AppContext';
import { theme } from '../constants/theme';
export default function History() {
  const {childId}=useLocalSearchParams<{childId?:string}>();
  const {family}=useApp();
  const [filter,setFilter]=useState<7|30|0>(7);
  const child=family?.children.find(c=>c.id===childId);
  if(!child || !family?.sessionActive) return <Page><Heading title="History unavailable"/><Button title="Home" onPress={()=>router.replace('/')}/></Page>;
  const cutoff=new Date();cutoff.setHours(0,0,0,0);cutoff.setDate(cutoff.getDate()-(filter-1));
  const records=child.records.filter(r=>filter===0 || new Date(`${r.day}T12:00:00`)>=cutoff);
  const average=records.length?records.reduce((sum,r)=>sum+r.childHours,0)/records.length:null;
  return <Page><Heading eyebrow="Saved sleep history" title={`${child.name}'s Sleep History`} subtitle="Review manual sleep entries, age-based points, and plant growth."/>
    <View style={{flexDirection:'row',gap:8}}>
      <View style={{flex:1}}><Button title="7 Days" subtle={filter!==7} onPress={()=>setFilter(7)}/></View>
      <View style={{flex:1}}><Button title="30 Days" subtle={filter!==30} onPress={()=>setFilter(30)}/></View>
      <View style={{flex:1}}><Button title="All" subtle={filter!==0} onPress={()=>setFilter(0)}/></View>
    </View>
    <Card><SectionTitle>{records.length} entries</SectionTitle><Note>Average child sleep: {average===null?'No data':`${average.toFixed(1)} hours`}</Note></Card>
    {records.length===0?<Card><Note>No sleep entries in this range. Record sleep to begin a history.</Note></Card>:
      records.map(r=><Card key={r.id}>
        <Text style={{fontWeight:'800',fontSize:17,color:theme.colors.text}}>{r.day}</Text>
        <Text style={{color:theme.colors.text}}>☀️ Parent: {r.parentHours} h ({Math.round(r.parentScore)} points)</Text>
        <Text style={{color:theme.colors.text}}>💧 {child.name}: {r.childHours} h ({Math.round(r.childScore)} points)</Text>
        <Note>Growth: +{r.growthIncrement.toFixed(1)}% · Source: {r.source}</Note>
      </Card>)}
    <Button title="Back to Greenhouse" subtle onPress={()=>router.replace({pathname:'/greenhouse',params:{childId:child.id}})}/>
  </Page>;
}
