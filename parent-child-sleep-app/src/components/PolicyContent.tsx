import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PolicyDocument } from '../constants/policies';
import { theme } from '../constants/theme';

/** Shared formatting keeps registration and Privacy/Consent documents identical. */
export function PolicyContent({ document }: { document: PolicyDocument }) {
  return <View style={styles.content}>
    <View style={styles.meta}>
      <Text style={styles.metaText}>Last updated: {document.lastUpdated}</Text>
      <Text style={styles.metaText}>Version {document.version}</Text>
    </View>
    <Text style={styles.introduction}>{document.introduction}</Text>
    {document.sections.map(section =>
      <View key={section.heading} style={styles.section}>
        <Text style={styles.heading}>{section.heading}</Text>
        {section.paragraphs.map((paragraph, i) =>
          <Text style={styles.body} key={i}>{paragraph}</Text>
        )}
      </View>
    )}
  </View>;
}

const styles = StyleSheet.create({
  content: { gap: 17 },
  meta: { paddingBottom: 10, borderBottomColor: theme.colors.border, borderBottomWidth: 1, gap: 3 },
  metaText: { color: theme.colors.textMuted, fontSize: 12 },
  introduction: { fontSize: 15, lineHeight: 24, fontWeight: '600', color: theme.colors.text },
  section: { gap: 9 },
  heading: { fontSize: 16, fontWeight: '800', lineHeight: 23, color: theme.colors.primaryDark },
  body: { fontSize: 14, lineHeight: 23, color: theme.colors.text }
});
