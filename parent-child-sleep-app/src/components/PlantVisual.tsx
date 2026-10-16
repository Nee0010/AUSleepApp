import React from 'react';
import { View, Text } from 'react-native';
import type { PlantType } from '../domain/models';
import { ProgressBar } from './UI';
import { theme } from '../constants/theme';
const FLOWERS:Record<PlantType,string> = {sunflower:'🌻',tulip:'🌷',daisy:'🌼',lavender:'🪻'};
export function PlantVisual({plantType,progress}:{plantType:PlantType,progress:number}) {
  const emoji= progress<20?'🫘':progress<45?'🌱':progress<75?'🌿':FLOWERS[plantType];
  return <View style={{backgroundColor:'#EAF4E3',padding:24,borderRadius:20,alignItems:'center',gap:12}}>
    <Text style={{fontSize:88}}>{emoji}</Text><Text style={{color:theme.colors.text,fontWeight:'800'}}>{plantType[0].toUpperCase()+plantType.slice(1)} · {Math.round(progress)}% grown</Text>
    <View style={{width:'100%'}}><ProgressBar value={progress}/></View>
  </View>;
}
export function CompletedFlower({type}:{type:PlantType}) { return <Text style={{fontSize:40}}>{FLOWERS[type]}</Text>; }
