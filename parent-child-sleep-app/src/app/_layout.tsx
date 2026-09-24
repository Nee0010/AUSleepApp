import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '../store/AppContext';
import { theme } from '../constants/theme';

export default function RootLayout() {
  return (
    <AppProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: theme.colors.background },
            headerShadowVisible: false,
            headerTintColor: theme.colors.text,
            contentStyle: { backgroundColor: theme.colors.background }
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="greenhouse" options={{ title: 'Greenhouse' }} />
          <Stack.Screen name="sleep-entry" options={{ title: 'Add Sleep Progress' }} />
        </Stack>
    </AppProvider>
  );
}
