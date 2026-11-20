import React from 'react';
import { Text, View } from 'react-native';
import { Card, Note, SectionTitle } from './UI';
import { theme } from '../constants/theme';
import { SLEEP_GUIDELINES, SLEEP_GUIDELINE_SOURCES, hoursLabel, type Participant } from '../constants/sleepGuidelines';
import { goalFor, validAge } from '../services/sleepRules';

type Member = { name: string; age: number | null; who: Participant };

/** One-line target for a family member, or a prompt to set their age. */
export function targetLine(m: Member) {
  if (m.age === null || !validAge(m.age, m.who)) return `${m.name}: set a valid age to get a sleep target`;
  const g = goalFor(m.age, m.who);
  return `${m.name} (age ${m.age}): ${g.label}${g.includesNaps ? ' incl. naps' : ''} · ${g.source}`;
}

/** US 4.10: shows each family member's age-based target plus the full guideline table and its sources. */
export function SleepGuidelinesCard({ members }: { members: Member[] }) {
  const usedSources = Array.from(new Set(SLEEP_GUIDELINES.map(g => g.sourceId)));
  const row = (who: Participant) => SLEEP_GUIDELINES.filter(g => g.who === who).map(g =>
    <View key={g.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: theme.colors.border }}>
      <Text style={{ color: theme.colors.text }}>{g.ageLabel}</Text>
      <Text style={{ color: theme.colors.text, fontWeight: '700' }}>
        {hoursLabel(g.minHours, g.maxHours)}{g.includesNaps ? ' (incl. naps)' : ''}{g.status === 'approved' ? '' : ' *'}
      </Text>
    </View>);
  return <Card>
    <SectionTitle>Age-based sleep guidelines</SectionTitle>
    <Note>Sleep scores compare hours slept with the recommended range for each person's age. Sleep inside the range earns 100 points.</Note>
    {members.map(m => <Text key={`${m.who}-${m.name}`} style={{ color: theme.colors.text }}>{m.who === 'parent' ? '☀️' : '💧'} {targetLine(m)}</Text>)}
    <Text style={{ fontWeight: '800', color: theme.colors.text, marginTop: 8 }}>Children (per 24 hours)</Text>
    {row('child')}
    <Text style={{ fontWeight: '800', color: theme.colors.text, marginTop: 8 }}>Parents (per night)</Text>
    {row('parent')}
    <Note>* Adult targets are awaiting sponsor review and may change before research use.</Note>
    {usedSources.map(id => <Note key={id}>{SLEEP_GUIDELINE_SOURCES[id].short}: {SLEEP_GUIDELINE_SOURCES[id].citation} {SLEEP_GUIDELINE_SOURCES[id].url}</Note>)}
  </Card>;
}
