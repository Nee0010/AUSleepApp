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
import { useApp } from '../store/AppContext';

function parseScore(value: string) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.min(Math.max(parsed, 0), 100);
}

export default function SleepEntryScreen() {
  const { setup, applySleepGoalScore } = useApp();
  const [parentScore, setParentScore] = useState('100');
  const [childScore, setChildScore] = useState('100');
  const [saving, setSaving] = useState(false);

  if (!setup) {
    router.replace('/');
    return null;
  }

  const parsedParent = parseScore(parentScore);
  const parsedChild = parseScore(childScore);
  const canSave = parsedParent !== null && parsedChild !== null && !saving;

  const save = async () => {
    if (!canSave || parsedParent === null || parsedChild === null) return;
    setSaving(true);
    try {
      await applySleepGoalScore({
        parentScore: parsedParent,
        childScore: parsedChild
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
            <Text style={styles.eyebrow}>TODAY'S PROGRESS</Text>
            <Text style={styles.title}>How did everyone sleep?</Text>
            <Text style={styles.subtitle}>Enter each person's sleep goal completion for today.</Text>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.label}>{setup.parentName}'s sleep goal</Text>
            <Text style={styles.helper}>Goal completion from 0 to 100%</Text>
            <View style={styles.percentRow}>
              <TextInput
                value={parentScore}
                onChangeText={setParentScore}
                keyboardType="number-pad"
                maxLength={3}
                style={styles.input}
              />
              <Text style={styles.percent}>%</Text>
            </View>
            <Text style={styles.rewardHint}>Creates sunlight for the greenhouse</Text>
          </View>

          <View style={styles.inputCard}>
            <Text style={styles.label}>{setup.childName}'s sleep goal</Text>
            <Text style={styles.helper}>Goal completion from 0 to 100%</Text>
            <View style={styles.percentRow}>
              <TextInput
                value={childScore}
                onChangeText={setChildScore}
                keyboardType="number-pad"
                maxLength={3}
                style={styles.input}
              />
              <Text style={styles.percent}>%</Text>
            </View>
            <Text style={styles.rewardHint}>Creates water for the greenhouse</Text>
          </View>

          <View style={styles.explainerCard}>
            <Text style={styles.explainerTitle}>Growing together</Text>
            <Text style={styles.explainerText}>
              The parent contributes sunlight and the child contributes water. Plant growth reflects shared progress so both participants help the greenhouse thrive. Seven fully completed shared days grows approximately one plant.
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
            <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : "Save Today's Progress"}</Text>
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
  percentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  percent: { color: theme.colors.textMuted, fontSize: 22, fontWeight: '700' },
  rewardHint: { color: theme.colors.primary, fontSize: 12, fontWeight: '700', marginTop: 12 },
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
