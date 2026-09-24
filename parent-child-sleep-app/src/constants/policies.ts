export const POLICY_VERSIONS = {
  terms: '1.0',
  privacy: '1.0',
  healthData: '1.0',
  research: '1.0'
} as const;

export const POLICY_COPY = {
  terms: {
    title: 'Terms of Service',
    body:
      'Sleep Greenhouse is designed to support healthy family sleep routines through shared progress and positive rewards. By using the app, you agree to provide information you are authorized to provide, protect your account credentials, use the app only for its intended purpose, and follow any applicable study or university requirements. Sleep Greenhouse is not an emergency service and does not replace professional medical care.'
  },
  privacy: {
    title: 'Privacy Policy',
    body:
      'Sleep Greenhouse may store account information, family profile information, sleep-related entries, greenhouse progress, consent records, and other information needed to provide the app. Sensitive information should be limited to what is necessary. Access to protected information is limited to authorized users, and research use is separated from direct account identifiers whenever feasible.'
  },
  healthData: {
    title: 'Health Data Privacy Notice',
    body:
      'Sleep-related information can be sensitive health information. By continuing, you authorize Sleep Greenhouse to collect and process the sleep information you choose to provide for app functionality. Where HIPAA or another privacy framework applies to the final university deployment, the applicable privacy, security, and access requirements must be followed. This notice does not replace any additional authorization required by an approved study or healthcare provider.'
  },
  research: {
    title: 'Research Participation',
    body:
      'Participation in university research is voluntary. Choosing “Not Now” does not prevent you from using the core Sleep Greenhouse features. If you agree, only data permitted by the applicable study protocol may be used for research, and direct identifiers should be excluded or replaced with coded study identifiers whenever feasible. Research consent may be withdrawn according to the approved study process.'
  }
} as const;
