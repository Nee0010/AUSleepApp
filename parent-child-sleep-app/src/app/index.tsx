import { useState, type ReactNode } from 'react';
import { router } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PlantVisual } from '../components/PlantVisual';
import { ProgressBar } from '../components/ProgressBar';
import { POLICY_COPY, POLICY_VERSIONS } from '../constants/policies';
import { theme } from '../constants/theme';
import type { PolicyAgreements } from '../domain/models';
import { generatePrivateUsername, validatePassword, validatePrivateUsername } from '../services/authService';
import {
  formatProfileAge,
  isValidChildAge,
  isValidParentAge
} from '../services/sleepRecommendationService';
import { useApp } from '../store/AppContext';

type PolicyStep = 'terms' | 'privacy' | 'healthData' | 'research' | null;

type AcceptedTimes = {
  terms?: string;
  privacy?: string;
  healthData?: string;
};

function parseAge(value: string) {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export default function HomeScreen() {
  const {
    isReady,
    hasAccount,
    isSignedIn,
    setup,
    greenhouse,
    createAccount,
    signIn,
    signOut,
    saveProfileAges,
    deleteAccountData
  } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentAge, setParentAge] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [policyStep, setPolicyStep] = useState<PolicyStep>(null);
  const [acceptedTimes, setAcceptedTimes] = useState<AcceptedTimes>({});

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.safeArea, styles.loading]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading your greenhouse...</Text>
      </SafeAreaView>
    );
  }

  if (hasAccount && !isSignedIn) {
    return (
      <AuthShell>
        <Text style={styles.eyebrow}>SLEEP GREENHOUSE</Text>
        <Text style={styles.setupTitle}>Welcome back.</Text>
        <Text style={styles.setupBody}>Sign in to continue growing together.</Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>Private username</Text>
          <TextInput
            value={username}
            onChangeText={(value) => {
              setUsername(value.toLowerCase());
              setError(null);
            }}
            placeholder="quiet_fern42"
            placeholderTextColor="#8A948E"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError(null);
            }}
            placeholder="Password"
            placeholderTextColor="#8A948E"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            disabled={busy || !username.trim() || !password}
            onPress={async () => {
              setBusy(true);
              const result = await signIn(username, password);
              setBusy(false);
              if (!result.ok) setError(result.message ?? 'Could not sign in.');
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              (busy || !username.trim() || !password) && styles.disabledButton,
              pressed && styles.pressed
            ]}
          >
            <Text style={styles.primaryButtonText}>{busy ? 'Signing in...' : 'Sign In'}</Text>
          </Pressable>
        </View>
      </AuthShell>
    );
  }

  if (!setup) {
    const usernameError = username
      ? validatePrivateUsername(username, parentName, childName)
      : 'Create a private username.';
    const passwordError = password ? validatePassword(password) : 'Create a password.';
    const passwordsMatch = password === confirmPassword;
    const parsedParentAge = parseAge(parentAge);
    const parsedChildAge = parseAge(childAge);
    const parentAgeValid = parsedParentAge !== null && isValidParentAge(parsedParentAge);
    const childAgeValid = parsedChildAge !== null && isValidChildAge(parsedChildAge);
    const canContinue =
      !usernameError &&
      !passwordError &&
      passwordsMatch &&
      parentName.trim().length > 0 &&
      parentAgeValid &&
      childName.trim().length > 0 &&
      childAgeValid &&
      !busy;

    const beginAgreements = () => {
      if (!canContinue) return;
      setAcceptedTimes({});
      setPolicyStep('terms');
    };

    const completeAccount = async (researchStatus: 'granted' | 'declined') => {
      const now = new Date().toISOString();
      const agreements: PolicyAgreements = {
        termsVersion: POLICY_VERSIONS.terms,
        termsAcceptedAt: acceptedTimes.terms ?? now,
        privacyVersion: POLICY_VERSIONS.privacy,
        privacyAcceptedAt: acceptedTimes.privacy ?? now,
        healthDataVersion: POLICY_VERSIONS.healthData,
        healthDataAcceptedAt: acceptedTimes.healthData ?? now,
        researchVersion: POLICY_VERSIONS.research,
        researchStatus,
        researchRecordedAt: now
      };

      setPolicyStep(null);
      setBusy(true);
      if (parsedParentAge === null || parsedChildAge === null) return;
      const result = await createAccount({
        username,
        password,
        parentName,
        parentAge: parsedParentAge,
        childName,
        childAge: parsedChildAge,
        agreements
      });
      setBusy(false);
      if (!result.ok) setError(result.message ?? 'Could not create account.');
    };

    return (
      <AuthShell>
        <Text style={styles.eyebrow}>SLEEP GREENHOUSE</Text>
        <Text style={styles.setupTitle}>Create your account.</Text>
        <Text style={styles.setupBody}>
          Build healthier sleep routines together and grow a greenhouse that reflects your family's progress.
        </Text>

        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Choose a private username</Text>
          <Text style={styles.privacyText}>
            Use a made-up username that does not identify you or your child. Avoid names, initials, email addresses, phone numbers, birth years, schools, and locations.
          </Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>Private username</Text>
            <Pressable onPress={() => setUsername(generatePrivateUsername())}>
              <Text style={styles.generate}>Generate one</Text>
            </Pressable>
          </View>
          <TextInput
            value={username}
            onChangeText={(value) => {
              setUsername(value.toLowerCase());
              setError(null);
            }}
            placeholder="quiet_fern42"
            placeholderTextColor="#8A948E"
            style={styles.input}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {username && usernameError ? <Text style={styles.inlineError}>{usernameError}</Text> : null}

          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              setError(null);
            }}
            placeholder="At least 3 characters"
            placeholderTextColor="#8A948E"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />
          {password && passwordError ? <Text style={styles.inlineError}>{passwordError}</Text> : null}

          <Text style={styles.label}>Confirm password</Text>
          <TextInput
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              setError(null);
            }}
            placeholder="Re-enter password"
            placeholderTextColor="#8A948E"
            style={styles.input}
            secureTextEntry
            autoCapitalize="none"
          />
          {confirmPassword && !passwordsMatch ? <Text style={styles.inlineError}>Passwords do not match.</Text> : null}

          <View style={styles.divider} />
          <Text style={styles.profileHeading}>Family profile</Text>
          <Text style={styles.profileHelp}>
            These names personalize the app. Your private username remains separate from your family display names.
          </Text>

          <Text style={styles.label}>Parent display name</Text>
          <TextInput
            value={parentName}
            onChangeText={(value) => {
              setParentName(value);
              setError(null);
            }}
            placeholder="Parent name"
            placeholderTextColor="#8A948E"
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Parent age</Text>
          <TextInput
            value={parentAge}
            onChangeText={(value) => {
              setParentAge(value.replace(/[^0-9]/g, '').slice(0, 2));
              setError(null);
            }}
            placeholder="18-99+"
            placeholderTextColor="#8A948E"
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
          />
          {parentAge && !parentAgeValid ? (
            <Text style={styles.inlineError}>Parent age must be 18-99. Enter 99 for age 99 or older.</Text>
          ) : null}

          <Text style={styles.label}>Child display name</Text>
          <TextInput
            value={childName}
            onChangeText={(value) => {
              setChildName(value);
              setError(null);
            }}
            placeholder="Child name"
            placeholderTextColor="#8A948E"
            style={styles.input}
            autoCapitalize="words"
          />

          <Text style={styles.label}>Child age</Text>
          <TextInput
            value={childAge}
            onChangeText={(value) => {
              setChildAge(value.replace(/[^0-9]/g, '').slice(0, 2));
              setError(null);
            }}
            placeholder="5-17"
            placeholderTextColor="#8A948E"
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
          />
          {childAge && !childAgeValid ? (
            <Text style={styles.inlineError}>Child age must be between 5 and 17.</Text>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canContinue}
            onPress={beginAgreements}
            style={({ pressed }) => [
              styles.primaryButton,
              !canContinue && styles.disabledButton,
              pressed && canContinue && styles.pressed
            ]}
          >
            <Text style={styles.primaryButtonText}>{busy ? 'Creating...' : 'Continue'}</Text>
          </Pressable>

          <Text style={styles.legalHint}>
            Before your account is created, you will review the Terms of Service, Privacy Policy, health data notice, and research participation choice.
          </Text>
        </View>

        <PolicyModal
          visible={policyStep === 'terms'}
          title={POLICY_COPY.terms.title}
          body={POLICY_COPY.terms.body}
          primaryLabel="Agree & Continue"
          secondaryLabel="Cancel"
          onPrimary={() => {
            setAcceptedTimes((current) => ({ ...current, terms: new Date().toISOString() }));
            setPolicyStep('privacy');
          }}
          onSecondary={() => setPolicyStep(null)}
        />

        <PolicyModal
          visible={policyStep === 'privacy'}
          title={POLICY_COPY.privacy.title}
          body={POLICY_COPY.privacy.body}
          primaryLabel="Acknowledge & Continue"
          secondaryLabel="Back"
          onPrimary={() => {
            setAcceptedTimes((current) => ({ ...current, privacy: new Date().toISOString() }));
            setPolicyStep('healthData');
          }}
          onSecondary={() => setPolicyStep('terms')}
        />

        <PolicyModal
          visible={policyStep === 'healthData'}
          title={POLICY_COPY.healthData.title}
          body={POLICY_COPY.healthData.body}
          primaryLabel="Agree & Continue"
          secondaryLabel="Back"
          onPrimary={() => {
            setAcceptedTimes((current) => ({ ...current, healthData: new Date().toISOString() }));
            setPolicyStep('research');
          }}
          onSecondary={() => setPolicyStep('privacy')}
        />

        <PolicyModal
          visible={policyStep === 'research'}
          title={POLICY_COPY.research.title}
          body={POLICY_COPY.research.body}
          primaryLabel="Agree & Create Account"
          secondaryLabel="Not Now"
          onPrimary={() => completeAccount('granted')}
          onSecondary={() => completeAccount('declined')}
        />
      </AuthShell>
    );
  }

  if (setup.parentAge === null || setup.childAge === null) {
    const parsedParentAge = parseAge(parentAge);
    const parsedChildAge = parseAge(childAge);
    const parentAgeValid = parsedParentAge !== null && isValidParentAge(parsedParentAge);
    const childAgeValid = parsedChildAge !== null && isValidChildAge(parsedChildAge);
    const canSaveAges = parentAgeValid && childAgeValid && !busy;

    return (
      <AuthShell>
        <Text style={styles.eyebrow}>SLEEP PROFILE</Text>
        <Text style={styles.setupTitle}>Add ages for sleep goals.</Text>
        <Text style={styles.setupBody}>
          Sleep recommendations change with age. Add both ages so the app can calculate sleep progress automatically.
        </Text>
        <View style={styles.formCard}>
          <Text style={styles.label}>{setup.parentName}'s age</Text>
          <TextInput
            value={parentAge}
            onChangeText={(value) => {
              setParentAge(value.replace(/[^0-9]/g, '').slice(0, 2));
              setError(null);
            }}
            placeholder="18-99+"
            placeholderTextColor="#8A948E"
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
          />
          {parentAge && !parentAgeValid ? (
            <Text style={styles.inlineError}>Parent age must be 18-99. Enter 99 for age 99 or older.</Text>
          ) : null}

          <Text style={styles.label}>{setup.childName}'s age</Text>
          <TextInput
            value={childAge}
            onChangeText={(value) => {
              setChildAge(value.replace(/[^0-9]/g, '').slice(0, 2));
              setError(null);
            }}
            placeholder="5-17"
            placeholderTextColor="#8A948E"
            style={styles.input}
            keyboardType="number-pad"
            maxLength={2}
          />
          {childAge && !childAgeValid ? <Text style={styles.inlineError}>Child age must be between 5 and 17.</Text> : null}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <Pressable
            disabled={!canSaveAges}
            onPress={async () => {
              if (parsedParentAge === null || parsedChildAge === null) return;
              setBusy(true);
              const result = await saveProfileAges(parsedParentAge, parsedChildAge);
              setBusy(false);
              if (!result.ok) setError(result.message ?? 'Could not save ages.');
            }}
            style={({ pressed }) => [
              styles.primaryButton,
              !canSaveAges && styles.disabledButton,
              pressed && canSaveAges && styles.pressed
            ]}
          >
            <Text style={styles.primaryButtonText}>{busy ? 'Saving...' : 'Save Sleep Profile'}</Text>
          </Pressable>
        </View>
      </AuthShell>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.homeContainer}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>SIGNED IN AS {setup.username.toUpperCase()}</Text>
            <Text style={styles.homeTitle}>Welcome, {setup.parentName}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Your greenhouses</Text>

        <Pressable
          onPress={() => router.push('/greenhouse')}
          style={({ pressed }) => [styles.greenhouseCard, pressed && styles.pressed]}
        >
          <View style={styles.cardCopy}>
            <Text style={styles.greenhouseTitle}>{setup.childName}'s Greenhouse</Text>
            <Text style={styles.greenhouseSubtitle}>Current plant: {greenhouse.currentPlantType}</Text>
            <ProgressBar value={greenhouse.growthPercent} />
            <Text style={styles.progressText}>{Math.round(greenhouse.growthPercent)}% complete</Text>
          </View>
          <View style={styles.cardPlant}>
            <PlantVisual plantType={greenhouse.currentPlantType} growthPercent={greenhouse.growthPercent} />
          </View>
        </Pressable>

        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Grow together, one night at a time.</Text>
          <Text style={styles.messageText}>
            Parent sleep progress creates sunlight, child sleep progress creates water, and both help the greenhouse grow. Sleep goals use the saved profile ages ({formatProfileAge(setup.parentAge, 'parent')} and {formatProfileAge(setup.childAge, 'child')}).
          </Text>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={signOut} style={({ pressed }) => [styles.outlineButton, pressed && styles.pressed]}>
            <Text style={styles.outlineButtonText}>Sign Out</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Alert.alert(
                'Delete account?',
                'This permanently deletes the account, family profile, greenhouse, sleep history, and completed plants stored on this device.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete Account', style: 'destructive', onPress: () => deleteAccountData() }
                ]
              );
            }}
            style={({ pressed }) => [styles.dangerButton, pressed && styles.pressed]}
          >
            <Text style={styles.dangerButtonText}>Delete Account</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PolicyModal({
  visible,
  title,
  body,
  primaryLabel,
  secondaryLabel,
  onPrimary,
  onSecondary
}: {
  visible: boolean;
  title: string;
  body: string;
  primaryLabel: string;
  secondaryLabel: string;
  onPrimary: () => void;
  onSecondary: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onSecondary}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalBadge}>
            <Text style={styles.modalBadgeText}>SLEEP GREENHOUSE</Text>
          </View>
          <Text style={styles.modalTitle}>{title}</Text>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
            <Text style={styles.modalBody}>{body}</Text>
          </ScrollView>
          <Pressable onPress={onPrimary} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Text style={styles.primaryButtonText}>{primaryLabel}</Text>
          </Pressable>
          <Pressable onPress={onSecondary} style={({ pressed }) => [styles.modalSecondaryButton, pressed && styles.pressed]}>
            <Text style={styles.modalSecondaryText}>{secondaryLabel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.setupContainer} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  loading: { alignItems: 'center', justifyContent: 'center', gap: 14, padding: 24 },
  loadingText: { color: theme.colors.textMuted, fontSize: 15 },
  setupContainer: { flexGrow: 1, justifyContent: 'center', padding: theme.spacing.lg },
  homeContainer: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.3 },
  setupTitle: { color: theme.colors.text, fontSize: 36, lineHeight: 42, fontWeight: '800', marginTop: 10 },
  setupBody: { color: theme.colors.textMuted, fontSize: 16, lineHeight: 24, marginTop: 14, marginBottom: 20 },
  privacyCard: { padding: 16, borderRadius: theme.radius.medium, backgroundColor: '#FFF3D9', marginBottom: 16 },
  privacyTitle: { color: '#72531D', fontSize: 16, fontWeight: '800', marginBottom: 6 },
  privacyText: { color: '#72531D', lineHeight: 20 },
  formCard: {
    padding: theme.spacing.lg,
    gap: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.large,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { color: theme.colors.text, fontWeight: '700', marginTop: 4 },
  generate: { color: theme.colors.primary, fontWeight: '800', fontSize: 13 },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.small,
    paddingHorizontal: 14,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: '#FBFCFA',
    marginBottom: 4
  },
  inlineError: { color: theme.colors.danger, fontSize: 12, lineHeight: 17, marginBottom: 4 },
  errorText: { color: theme.colors.danger, fontWeight: '700', lineHeight: 20 },
  divider: { height: 1, backgroundColor: theme.colors.border, marginVertical: 8 },
  profileHeading: { color: theme.colors.text, fontSize: 17, fontWeight: '800' },
  profileHelp: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: 4 },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', textAlign: 'center' },
  disabledButton: { opacity: 0.4 },
  pressed: { opacity: 0.82 },
  legalHint: { color: theme.colors.textMuted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 2 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  homeTitle: { color: theme.colors.text, fontSize: 31, fontWeight: '800', marginTop: 6 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  greenhouseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 180,
    padding: 18,
    borderRadius: theme.radius.large,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  cardCopy: { flex: 1, gap: 9 },
  cardPlant: { width: 120, alignItems: 'center', justifyContent: 'center' },
  greenhouseTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  greenhouseSubtitle: { color: theme.colors.textMuted, textTransform: 'capitalize' },
  progressText: { color: theme.colors.primary, fontWeight: '800', fontSize: 13 },
  messageCard: { padding: 18, borderRadius: theme.radius.medium, backgroundColor: theme.colors.surfaceMuted },
  messageTitle: { color: theme.colors.primaryDark, fontSize: 16, fontWeight: '800', marginBottom: 5 },
  messageText: { color: theme.colors.textMuted, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 12 },
  outlineButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    borderColor: theme.colors.primary
  },
  outlineButtonText: { color: theme.colors.primary, fontWeight: '800' },
  dangerButton: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    borderColor: theme.colors.danger
  },
  dangerButtonText: { color: theme.colors.danger, fontWeight: '800' },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 24, 0.55)',
    padding: 22,
    justifyContent: 'center'
  },
  modalCard: {
    maxHeight: '78%',
    padding: 22,
    borderRadius: theme.radius.large,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  modalBadge: { alignSelf: 'flex-start', paddingVertical: 5, paddingHorizontal: 9, borderRadius: 999, backgroundColor: theme.colors.surfaceMuted },
  modalBadgeText: { color: theme.colors.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  modalTitle: { color: theme.colors.text, fontSize: 26, lineHeight: 32, fontWeight: '800', marginTop: 14 },
  modalScroll: { marginVertical: 16 },
  modalScrollContent: { paddingBottom: 6 },
  modalBody: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 23 },
  modalSecondaryButton: { minHeight: 46, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
  modalSecondaryText: { color: theme.colors.primary, fontWeight: '800' }
});
