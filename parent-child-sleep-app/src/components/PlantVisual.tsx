import { StyleSheet, Text, View } from 'react-native';
import type { PlantType } from '../domain/models';
import { theme } from '../constants/theme';

const flowers: Record<PlantType, string> = {
  sunflower: '🌻',
  tulip: '🌷',
  daisy: '🌼',
  lavender: '🪻'
};

function growthEmoji(growthPercent: number, plantType: PlantType) {
  if (growthPercent < 20) return '🫘';
  if (growthPercent < 45) return '🌱';
  if (growthPercent < 75) return '🌿';
  return flowers[plantType];
}

export function PlantVisual({ plantType, growthPercent }: { plantType: PlantType; growthPercent: number }) {
  return (
    <View style={styles.scene}>
      <Text style={styles.plant}>{growthEmoji(growthPercent, plantType)}</Text>
      <View style={styles.soil} />
      <Text style={styles.caption}>{Math.round(growthPercent)}% grown</Text>
    </View>
  );
}

export function CompletedPlantVisual({ plantType }: { plantType: PlantType }) {
  return <Text style={styles.completedPlant}>{flowers[plantType]}</Text>;
}

const styles = StyleSheet.create({
  scene: {
    height: 240,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 20,
    borderRadius: theme.radius.large,
    backgroundColor: '#EAF4E3',
    overflow: 'hidden'
  },
  plant: {
    fontSize: 112,
    marginBottom: -6
  },
  soil: {
    width: '72%',
    height: 20,
    borderRadius: 999,
    backgroundColor: '#9B7653'
  },
  caption: {
    marginTop: 12,
    color: theme.colors.textMuted,
    fontWeight: '700'
  },
  completedPlant: {
    fontSize: 42
  }
});
