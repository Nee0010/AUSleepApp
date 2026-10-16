import React, { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
export function Page({children}:{children:ReactNode}) { return <SafeAreaView edges={['bottom']} style={s.page}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>{children}</ScrollView></SafeAreaView>; }
export function Heading({eyebrow,title,subtitle}:{eyebrow?:string,title:string,subtitle?:string}) { return <View style={s.heading}>{eyebrow && <Text style={s.eyebrow}>{eyebrow.toUpperCase()}</Text>}<Text style={s.title}>{title}</Text>{subtitle && <Text style={s.subtitle}>{subtitle}</Text>}</View>; }
export function Card({children}:{children:ReactNode}) { return <View style={s.card}>{children}</View>; }
export function Button({title,onPress,subtle,danger,disabled}:{title:string,onPress:()=>void,subtle?:boolean,danger?:boolean,disabled?:boolean}) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({pressed})=>[s.button,subtle && s.subtle,danger && s.danger, (pressed || disabled) && {opacity:.6}]}><Text style={[s.buttonText,subtle && s.subtleText]}>{title}</Text></Pressable>;
}
export function Field({label,value,onChangeText,secureTextEntry,keyboardType,placeholder,editable=true,autoCapitalize='sentences'}: {label:string,value:string,onChangeText:(value:string)=>void,secureTextEntry?:boolean,keyboardType?:TextInputProps['keyboardType'],placeholder?:string,editable?:boolean,autoCapitalize?:TextInputProps['autoCapitalize']}) {
  return <View style={{gap:6}}><Text style={s.label}>{label}</Text><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} secureTextEntry={secureTextEntry} keyboardType={keyboardType} placeholder={placeholder} editable={editable} autoCapitalize={autoCapitalize} autoCorrect={false} placeholderTextColor="#87948A" style={[s.input,!editable && {backgroundColor:'#EDF0EA'}]} /></View>;
}
export function Note({children,error}:{children:ReactNode,error?:boolean}) { return <Text style={[s.note,error && {color:theme.colors.danger}]}>{children}</Text>; }
export function SectionTitle({children}:{children:ReactNode}) { return <Text style={s.sectionTitle}>{children}</Text>; }
export function ProgressBar({value}:{value:number}) { return <View style={s.bar}><View style={[s.barFill,{width:`${Math.min(100,Math.max(0,value))}%`}]} /></View>; }
const s=StyleSheet.create({
 page:{flex:1,backgroundColor:theme.colors.background}, content:{padding:22,gap:16,paddingBottom:48,maxWidth:800,width:'100%',alignSelf:'center'},
 heading:{gap:6,marginBottom:5}, eyebrow:{color:theme.colors.primary,fontSize:12,fontWeight:'800',letterSpacing:1.2},
 title:{fontSize:29,fontWeight:'800',color:theme.colors.text}, subtitle:{fontSize:15,lineHeight:22,color:theme.colors.textMuted},
 card:{borderRadius:17,padding:17,borderWidth:1,borderColor:theme.colors.border,backgroundColor:theme.colors.surface,gap:13},
 button:{minHeight:48,backgroundColor:theme.colors.primary,borderRadius:13,alignItems:'center',justifyContent:'center',paddingHorizontal:16,paddingVertical:10},
 subtle:{backgroundColor:theme.colors.surfaceMuted}, danger:{backgroundColor:theme.colors.danger},
 buttonText:{color:'#FFFFFF',fontWeight:'800',textAlign:'center',fontSize:15},subtleText:{color:theme.colors.primaryDark},
 input:{borderRadius:10,borderWidth:1,borderColor:theme.colors.border,minHeight:46,paddingHorizontal:12,backgroundColor:'#FFFFFF',fontSize:16,color:theme.colors.text},
 label:{fontWeight:'700',color:theme.colors.text,fontSize:14},note:{color:theme.colors.textMuted,fontSize:13,lineHeight:19},
 sectionTitle:{color:theme.colors.text,fontSize:19,fontWeight:'800'}, bar:{height:13,backgroundColor:theme.colors.surfaceMuted,borderRadius:50,overflow:'hidden'},barFill:{height:'100%',backgroundColor:theme.colors.primary,borderRadius:50}
});
