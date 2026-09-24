import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../constants/theme';

type Props = {
  icon: string;
  label: string;
  value: number;
  subtitle: string;
};

export function ResourceCard({ icon, label, value, subtitle }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.icon}>{icon}</Text>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.round(value)}%</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 150,
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    borderRadius: theme.radius.medium,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border
  },
  icon: {
    fontSize: 28
  },
  copy: {
    flex: 1
  },
  label: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600'
  },
  value: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: '800',
    marginTop: 2
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: 3
  }
});
