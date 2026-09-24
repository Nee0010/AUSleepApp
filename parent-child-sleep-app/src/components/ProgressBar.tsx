import { StyleSheet, View } from 'react-native';
import { theme } from '../constants/theme';

export function ProgressBar({ value }: { value: number }) {
  const safeValue = Math.min(Math.max(value, 0), 100);

  return (
    <View style={styles.track}>
      <View style={[styles.fill, { width: `${safeValue}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.surfaceMuted,
    overflow: 'hidden'
  },
  fill: {
    height: '100%',
    borderRadius: 999,
    backgroundColor: theme.colors.primary
  }
});
