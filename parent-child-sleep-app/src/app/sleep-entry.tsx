import { useState } from 'react';
import { router } from 'expo-router';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { theme } from '../constants/theme';
import { scoreSleepHours } from '../services/sleepRecommendationService';
import { useApp } from '../store/AppContext';

function parseHours(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 24) return null;
  return parsed;
}

export default function SleepEntryScreen() {
  const { setup, applySleepHours } = useApp();
  const [parentHours, setParentHours] = useState('');
  const [childHours, setChildHours] = useState('');
  const [saving, setSaving] = useState(false);

  if (!setup) {
    router.replace('/');
    return null;
  }

  if (setup.parentAge === null || setup.childAge === null) {
    router.replace('/');
    return null;
  }

  const parsedParent = parseHours(parentHours);
  const parsedChild = parseHours(childHours);
  const parentResult = parsedParent === null ? null : scoreSleepHours(setup.parentAge, parsedParent, 'parent');
  const childResult = parsedChild === null ? null : scoreSleepHours(setup.childAge, parsedChild, 'child');
  const parentRecommendation = scoreSleepHours(setup.parentAge, 0, 'parent').recommendation;
  const childRecommendation = scoreSleepHours(setup.childAge, 0, 'child').recommendation;
  const canSave = parsedParent !== null && parsedChild !== null && !saving;

  const save = async () => {
    if (!canSave || parsedParent === null || parsedChild === null) return;
    setSaving(true);
    try {
      await applySleepHours({
        parentHours: parsedParent,
        childHours: parsedChild
      });
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View>
            <Text style={styles.eyebrow}>TODAY'S SLEEP</Text>
            <Text style={styles.title}>How many hours did everyone sleep?</Text>
            <Text style={styles.subtitle}>
              Enter total sleep during the last 24 hours. The app compares it with the saved age-based sleep goal.
            </Text>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.label}>{setup.parentName}'s sleep</Text>
            <Text style={styles.helper}>Age {setup.parentAge === 99 ? '99+' : setup.parentAge} · Goal: {parentRecommendation.label}</Text>
            <View style={styles.hoursRow}>
              <TextInput
                value={parentHours}
                onChangeText={(value) => setParentHours(value.replace(/[^0-9.]/g, '').slice(0, 5))}
                keyboardType="decimal-pad"
                placeholder="8"
                placeholderTextColor="#8A948E"
                style={styles.input}
              />
              <Text style={styles.hoursLabel}>hours</Text>
            </View>
            {parentResult ? (
              <Text style={[styles.rewardHint, parentResult.isGoodSleep && styles.goodSleep]}>
                {parentResult.isGoodSleep ? 'Good sleep range' : 'Outside sleep range'} · {parentResult.score}/100 points · creates sunlight
              </Text>
            ) : (
              <Text style={styles.rewardHint}>Enter 0-24 hours</Text>
            )}
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.label}>{setup.childName}'s sleep</Text>
            <Text style={styles.helper}>Age {setup.childAge} · Goal: {childRecommendation.label}</Text>
            <View style={styles.hoursRow}>
              <TextInput
                value={childHours}
                onChangeText={(value) => setChildHours(value.replace(/[^0-9.]/g, '').slice(0, 5))}
                keyboardType="decimal-pad"
                placeholder="9"
                placeholderTextColor="#8A948E"
                style={styles.input}
              />
              <Text style={styles.hoursLabel}>hours</Text>
            </View>
            {childResult ? (
              <Text style={[styles.rewardHint, childResult.isGoodSleep && styles.goodSleep]}>
                {childResult.isGoodSleep ? 'Good sleep range' : 'Outside sleep range'} · {childResult.score}/100 points · creates water
              </Text>
            ) : (
              <Text style={styles.rewardHint}>Enter 0-24 hours</Text>
            )}
          </View>

          <View style={styles.explainerCard}>
            <Text style={styles.explainerTitle}>Growing together</Text>
            <Text style={styles.explainerText}>
              Sleep within the recommended range earns 100 points. Sleep outside the range earns partial points based on how close the entered hours are to the recommended range. Parent points create sunlight and child points create water. Seven full shared days grows approximately one plant.
            </Text>
          </View>

          <Pressable
            onPress={save}
            disabled={!canSave}
            style={({ pressed }) => [
              styles.primaryButton,
              !canSave && styles.disabledButton,
              pressed && canSave && styles.pressed
            ]}
          >
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : "Save Today's Sleep"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, gap: theme.spacing.md },
  eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: theme.colors.text, fontSize: 30, lineHeight: 36, fontWeight: '800', marginTop: 5 },
  subtitle: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  inputCard: {
    padding: 18,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  label: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  helper: { color: theme.colors.textMuted, marginTop: 4, marginBottom: 14 },
  hoursRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: {
    width: 110,
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.small,
    paddingHorizontal: 14,
    backgroundColor: '#FBFCFA',
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '800'
  },
  hoursLabel: { color: theme.colors.textMuted, fontSize: 18, fontWeight: '700' },
  rewardHint: { color: theme.colors.textMuted, fontSize: 12, fontWeight: '700', marginTop: 12 },
  goodSleep: { color: theme.colors.primary },
  explainerCard: { padding: 16, borderRadius: theme.radius.medium, backgroundColor: theme.colors.surfaceMuted },
  explainerTitle: { color: theme.colors.primaryDark, fontWeight: '800', marginBottom: 5 },
  explainerText: { color: theme.colors.textMuted, lineHeight: 20 },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.primary,
    marginTop: 4
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  disabledButton: { opacity: 0.4 },
  pressed: { opacity: 0.82 }
});
