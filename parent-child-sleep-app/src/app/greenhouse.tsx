import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompletedPlantVisual, PlantVisual } from '../components/PlantVisual';
import { ProgressBar } from '../components/ProgressBar';
import { ResourceCard } from '../components/ResourceCard';
import { theme } from '../constants/theme';
import { useApp } from '../store/AppContext';

export default function GreenhouseScreen() {
  const { setup, greenhouse, sleepRecords } = useApp();

  if (!setup) {
    router.replace('/');
    return null;
  }

  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View>
          <Text style={styles.eyebrow}>CURRENT GREENHOUSE</Text>
          <Text style={styles.title}>{setup.childName}'s Greenhouse</Text>
          <Text style={styles.subtitle}>Grow the current plant through shared sleep progress.</Text>
        </View>

        <PlantVisual plantType={greenhouse.currentPlantType} growthPercent={greenhouse.growthPercent} />

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Plant growth</Text>
            <Text style={styles.progressPercent}>{Math.round(greenhouse.growthPercent)}%</Text>
          </View>
          <ProgressBar value={greenhouse.growthPercent} />
          <Text style={styles.progressCaption}>Seven fully completed shared days grows approximately one plant.</Text>
        </View>

        <View style={styles.resources}>
          <ResourceCard icon="☀️" label="Sunlight" value={greenhouse.sunlight} subtitle={`${setup.parentName}'s latest contribution`} />
          <ResourceCard icon="💧" label="Water" value={greenhouse.water} subtitle={`${setup.childName}'s latest contribution`} />
        </View>

        <Pressable
          onPress={() => router.push('/sleep-entry')}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
        >
          <Text style={styles.primaryButtonText}>Add Today's Sleep Progress</Text>
        </Pressable>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Recent sleep progress</Text>
          {sleepRecords.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyEmoji}>🌙</Text>
              <Text style={styles.emptyTitle}>No sleep progress yet.</Text>
              <Text style={styles.emptyText}>Add today's progress to begin growing the greenhouse.</Text>
            </View>
          ) : (
            <View style={styles.recordList}>
              {sleepRecords.slice(0, 7).map((record) => (
                <View key={record.id} style={styles.recordCard}>
                  <View>
                    <Text style={styles.recordDate}>{new Date(record.recordedAt).toLocaleString()}</Text>
                    <Text style={styles.recordScores}>Parent {Math.round(record.parentScore)}% · Child {Math.round(record.childScore)}%</Text>
                  </View>
                  <Text style={styles.recordGrowth}>+{record.growthIncrement.toFixed(1)}%</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={styles.historySection}>
          <Text style={styles.sectionTitle}>Completed plants</Text>
          {greenhouse.completedPlants.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyEmoji}>🪴</Text>
              <Text style={styles.emptyTitle}>Your first plant is growing.</Text>
              <Text style={styles.emptyText}>Completed plants will stay here as a visual history of your family's progress.</Text>
            </View>
          ) : (
            <View style={styles.plantGrid}>
              {greenhouse.completedPlants.map((plant) => (
                <View key={plant.id} style={styles.completedCard}>
                  <CompletedPlantVisual plantType={plant.plantType} />
                  <Text style={styles.completedName}>{plant.plantType}</Text>
                  <Text style={styles.completedDate}>{new Date(plant.completedAt).toLocaleDateString()}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.colors.background },
  container: { padding: theme.spacing.lg, gap: theme.spacing.lg },
  eyebrow: { color: theme.colors.primary, fontSize: 12, fontWeight: '800', letterSpacing: 1.4 },
  title: { color: theme.colors.text, fontSize: 30, fontWeight: '800', marginTop: 5 },
  subtitle: { color: theme.colors.textMuted, fontSize: 15, lineHeight: 22, marginTop: 6 },
  progressCard: {
    padding: 18,
    gap: 10,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressTitle: { color: theme.colors.text, fontSize: 18, fontWeight: '800' },
  progressPercent: { color: theme.colors.primary, fontSize: 18, fontWeight: '800' },
  progressCaption: { color: theme.colors.textMuted, fontSize: 13, lineHeight: 18 },
  resources: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  primaryButton: {
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.primary
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  historySection: { gap: 12 },
  sectionTitle: { color: theme.colors.text, fontSize: 20, fontWeight: '800' },
  emptyHistory: {
    alignItems: 'center',
    padding: theme.spacing.lg,
    borderRadius: theme.radius.medium,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface
  },
  emptyEmoji: { fontSize: 38, marginBottom: 8 },
  emptyTitle: { color: theme.colors.text, fontWeight: '800' },
  emptyText: { color: theme.colors.textMuted, textAlign: 'center', lineHeight: 19, marginTop: 4 },
  recordList: { gap: 10 },
  recordCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  recordDate: { color: theme.colors.text, fontWeight: '800', fontSize: 13 },
  recordScores: { color: theme.colors.textMuted, fontSize: 12, marginTop: 4 },
  recordGrowth: { color: theme.colors.primary, fontWeight: '800', fontSize: 16 },
  plantGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  completedCard: {
    width: '47%',
    alignItems: 'center',
    padding: 16,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  completedName: { color: theme.colors.text, textTransform: 'capitalize', fontWeight: '800', marginTop: 6 },
  completedDate: { color: theme.colors.textMuted, fontSize: 12, marginTop: 3 }
});
