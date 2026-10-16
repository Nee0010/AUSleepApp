import React from 'react';
import { router } from 'expo-router';
import { Page, Heading, Card, Button, SectionTitle, Note } from '../components/UI';
import { PolicyContent } from '../components/PolicyContent';
import { useApp } from '../store/AppContext';
import { POLICY_DOCUMENTS } from '../constants/policies';

export default function PrivacyScreen() {
  const { family } = useApp();
  return <Page>
    <Heading
      eyebrow="Information and choices"
      title="Privacy and Consent"
      subtitle="Development copies only. Auburn must approve final materials before research collection or release."
    />
    {(['privacy', 'terms', 'health', 'research'] as const).map(key =>
      <Card key={key}>
        <SectionTitle>{POLICY_DOCUMENTS[key].title}</SectionTitle>
        <PolicyContent document={POLICY_DOCUMENTS[key]} />
      </Card>
    )}
    {family?.sessionActive ? <Card>
      <SectionTitle>Your saved choices</SectionTitle>
      <Note>Terms accepted: {family.consents.termsAcceptedAt.slice(0, 10)}</Note>
      <Note>Privacy acknowledged: {family.consents.privacyAcceptedAt.slice(0, 10)}</Note>
      <Note>Health data notice acknowledged: {family.consents.healthAcceptedAt.slice(0, 10)}</Note>
      <Note>Optional research: {family.consents.researchChoice === 'granted' ? 'Yes' : 'No'} (recorded {family.consents.researchRecordedAt.slice(0, 10)})</Note>
      <Button title="Change Research Choice in Settings" subtle onPress={() => router.push('/settings')} />
    </Card> : null}
    <Button title="Back to Home" subtle onPress={() => router.replace('/')} />
  </Page>;
}
