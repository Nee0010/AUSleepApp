import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../store/AppContext';
import { theme } from '../constants/theme';
export default function RootLayout() { return <AppProvider><StatusBar style="dark"/><Stack screenOptions={{headerStyle:{backgroundColor:theme.colors.background},headerTintColor:theme.colors.text,headerShadowVisible:false,contentStyle:{backgroundColor:theme.colors.background}}}>
  <Stack.Screen name="index" options={{headerShown:false}}/>
  <Stack.Screen name="register" options={{title:'Create Account'}}/>
  <Stack.Screen name="greenhouse" options={{title:'Greenhouse'}}/>
  <Stack.Screen name="sleep-entry" options={{title:'Record Sleep'}}/>
  <Stack.Screen name="history" options={{title:'Sleep History'}}/>
  <Stack.Screen name="settings" options={{title:'Account Settings'}}/>
  <Stack.Screen name="privacy" options={{title:'Privacy and Consent'}}/>
</Stack></AppProvider>; }
