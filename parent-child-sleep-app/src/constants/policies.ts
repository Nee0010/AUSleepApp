/** Policies displayed during registration and in Privacy and Consent.
 * Document versions are saved with each local acknowledgement.
 * This text describes the actual Cycle 2 implementation, not future features.
 */
export const POLICY_VERSIONS = {
  terms: '2.0',
  privacy: '2.0',
  health: '2.0',
  research: '2.0'
} as const;

export type PolicyKey = keyof typeof POLICY_VERSIONS;
export type PolicySection = { heading: string; paragraphs: readonly string[] };
export type PolicyDocument = {
  key: PolicyKey;
  title: string;
  lastUpdated: string;
  version: string;
  introduction: string;
  sections: readonly PolicySection[];
};

const updated = 'October 16, 2026';

export const POLICY_DOCUMENTS: Record<PolicyKey, PolicyDocument> = {
  terms: {
    key: 'terms', title: 'Terms of Service', lastUpdated: updated, version: POLICY_VERSIONS.terms,
    introduction: 'These Terms of Service describe the rules for using Sleep Greenhouse, a parent-operated application that helps families record sleep hours and follow their greenhouse progress. Please read them before creating an account.',
    sections: [
      { heading: '1. Who may use Sleep Greenhouse', paragraphs: [
        'An account is intended for a parent or legal guardian who is at least 18 years old. Only the adult operates the account. The adult may create profiles for children ages 5 through 17 for whom they are authorized to provide information.',
        'By creating an account, you confirm that the account and information you enter are under your control and that you have authority to enter information for the children you add.'
      ] },
      { heading: '2. Your account and information', paragraphs: [
        'Provide accurate information to the best of your knowledge, keep your login details private, and do not use someone else’s account without permission. Use a username that does not include personal names, birth dates, or other identifying details.',
        'You are responsible for information entered through your account and for keeping your device reasonably secure. You can change profile details in Settings and remove local account information using Delete All Local Data.'
      ] },
      { heading: '3. What the application provides', paragraphs: [
        'Sleep Greenhouse lets a parent manually enter hours of sleep, compare them with age-based ranges, earn sunlight and water points, grow plants, and review a history of entries and completed plants.',
        'Recommendations and rewards are intended for general wellness and engagement. They are not a medical diagnosis, treatment plan, or guarantee that an individual is getting enough sleep.'
      ] },
      { heading: '4. Acceptable use', paragraphs: [
        'Use the application lawfully and only for its intended family sleep-tracking purpose. Do not submit another person’s information without appropriate authority, attempt to gain unauthorized access to data, or interfere with the application.'
      ] },
      { heading: '5. Availability and changes', paragraphs: [
        'Features may change as the application is improved. Some functions, including wearable imports, cloud synchronization, and research exports, are not available in the current version. The application may not always be accessible or error-free.',
        'If these terms change, an updated version can be presented for review before continued use of affected features.'
      ] },
      { heading: '6. Privacy, research, and ending use', paragraphs: [
        'The Privacy Statement explains what information is stored and how it is handled. Research participation is a separate, optional choice and is not required to use the greenhouse features.',
        'You may stop using the application at any time. The Delete All Local Data control removes the local account and family records managed by this version of the application from the current app storage. Device backups and other copies outside the app are not controlled by that action.'
      ] }
    ]
  },
  privacy: {
    key: 'privacy', title: 'Privacy Statement', lastUpdated: updated, version: POLICY_VERSIONS.privacy,
    introduction: 'Sleep Greenhouse is designed for use by a parent or legal guardian. This statement explains the information the application collects, why it is used, where it is kept, and the choices available to the account holder.',
    sections: [
      { heading: '1. Information we collect', paragraphs: [
        'Account information includes the username, a locally stored password salt and password verifier, and account creation and update dates. Family profiles include parent and child display names and ages.',
        'Sleep information includes the date and number of hours entered for the parent and each child, age-based scores, the manual-entry source, and the resulting sunlight, water, and plant progress. The application also keeps completed-plant history and the versions, dates, and choices associated with the notices you review.'
      ] },
      { heading: '2. How information is obtained and used', paragraphs: [
        'Information is entered by the parent or legal guardian. The application uses it to sign in to the local account, manage children and greenhouses, calculate age-based sleep goals and rewards, display history, and remember privacy and research choices.',
        'It does not collect location, contacts, camera content, microphone recordings, or wearable sleep data as part of the current functionality.'
      ] },
      { heading: '3. Storage and security', paragraphs: [
        'On iOS and Android, the current application stores account and family data in an on-device SQLite database. In the browser demonstration, information is stored in that browser’s local storage. This version does not provide a cloud account or cloud synchronization.',
        'Local sign-in uses a salted password verifier. The database is not separately encrypted by the application, and browser local storage is not designed to protect sensitive health information. A person with sufficient access to the device or browser storage may be able to read stored information. Use sample information when evaluating this version.'
      ] },
      { heading: '4. Sharing and research use', paragraphs: [
        'The current application does not implement transmission of sleep records to researchers, cloud storage services, wearable providers, or third-party analytics systems. A research preference recorded in the app remains in local storage and does not itself send information to a study.',
        'Research data collection and any transfer to an authorized research team would require a separate, defined process identifying the information involved, permitted recipients, and applicable permissions. No such transfer is enabled in the current version.'
      ] },
      { heading: '5. Children’s information', paragraphs: [
        'Only the parent or guardian enters or manages a child’s information. Children do not create accounts or interact with a separate child-facing application. Each child has a distinct greenhouse and sleep history within the parent account.'
      ] },
      { heading: '6. Your choices and controls', paragraphs: [
        'You can view your family information, edit parent and child names and ages, add or remove child profiles, review sleep history, and change the optional research preference in Settings. You may decline research and continue using the standard app features.',
        'The current version does not include an individual sleep-entry correction or deletion feature. To erase all locally managed account and sleep information on the device, use Delete All Local Data in Settings.'
      ] },
      { heading: '7. Retention and deletion', paragraphs: [
        'Locally saved information remains in the application until you remove it with the available deletion controls or the app storage is cleared. Deleting a child profile removes that child’s saved greenhouse, plants, and sleep records from the current local data.',
        'Delete All Local Data removes the local account, stored consent choices, and associated records from this app’s data store. Copies in device backups, screenshots, or files stored outside the app may remain and must be managed separately.'
      ] },
      { heading: '8. Updates and questions', paragraphs: [
        'If the application begins offering new data sources, cloud features, or research transfers, the privacy statement and relevant permissions should be updated to describe those features before they are used.',
        'For information about Auburn University’s general privacy program, visit https://www.auburn.edu/administration/oacp/dicp/privacyprogram.php. This university resource is not an in-app support or deletion service.'
      ] }
    ]
  },
  health: {
    key: 'health', title: 'Health Data Notice', lastUpdated: updated, version: POLICY_VERSIONS.health,
    introduction: 'Sleep duration can be sensitive personal information. This notice describes how Sleep Greenhouse handles parent-entered sleep information and how its feedback should be understood.',
    sections: [
      { heading: '1. Sleep information recorded', paragraphs: [
        'The parent enters the total hours slept during a 24-hour period for themselves and for each child. The application stores those entries, the associated date, the selected child, the resulting scores, and the impact on plant growth.',
        'The same parent sleep contribution is used for multiple children on the same date. Each child’s sleep entries and greenhouse progress remain separate.'
      ] },
      { heading: '2. Sleep goals and rewards', paragraphs: [
        'The application compares hours with age-based sleep ranges. Entries within the applicable range earn the full daily points; entries outside the range may earn partial points. Parent sleep contributes sunlight and child sleep contributes water.',
        'These calculations are game rewards and general sleep education, not a clinical evaluation. Needs vary by individual, and a sleep score cannot determine whether someone has a sleep disorder.'
      ] },
      { heading: '3. Manual entry and data sources', paragraphs: [
        'All sleep information in this version is entered manually by the parent or guardian. The application does not currently connect to Apple Health, Health Connect, or other wearables, and it does not retrieve medical records.'
      ] },
      { heading: '4. Privacy and access', paragraphs: [
        'Sleep entries stay in the local app storage described in the Privacy Statement. They are visible to someone who can access the signed-in account and may also be accessible through device or browser storage. Review the Privacy Statement for security limitations, retention, and deletion controls.'
      ] },
      { heading: '5. Health and safety', paragraphs: [
        'Sleep Greenhouse is not a substitute for advice from a licensed healthcare professional. If you have concerns about your sleep or a child’s sleep, seek guidance from an appropriate healthcare provider. Do not use this application to respond to a medical emergency.'
      ] }
    ]
  },
  research: {
    key: 'research', title: 'Research Participation and Parental Permission', lastUpdated: updated, version: POLICY_VERSIONS.research,
    introduction: 'Sleep Greenhouse includes an optional research preference. This page explains the choice available in the application and what it does, including how information involving children is treated.',
    sections: [
      { heading: '1. Participation is your choice', paragraphs: [
        'Choosing Yes or No is voluntary. Declining has no effect on creating an account, entering sleep hours, earning plant rewards, or reviewing your family’s history. The default response is No.'
      ] },
      { heading: '2. What your response means', paragraphs: [
        'The application records your Yes or No preference and the date it was entered. Selecting Yes indicates a preference regarding potential research participation. It does not enroll your family in a particular study, verify your identity, or authorize any immediate sharing of sleep records.',
        'The present application has no active research export or upload. No identifiable or de-identified sleep records are automatically released based on this choice.'
      ] },
      { heading: '3. Additional study information and parental permission', paragraphs: [
        'Before any future study receives data, the responsible research team would need to provide the applicable study details, such as the study purpose, which records would be requested, potential risks and benefits, confidentiality procedures, retention, and whom to contact with questions.',
        'If parental permission, parental verification, or other research consent is required, that process must be completed separately before a transfer takes place. A parent-operated app account alone should not be treated as verified research consent.'
      ] },
      { heading: '4. Data shared with research teams', paragraphs: [
        'There is currently no research data transfer from this version. If a future study adds this feature, the categories of information shared, de-identification or coding procedures, permitted recipients, and withdrawal limitations must be described as part of the study-specific process.'
      ] },
      { heading: '5. Changing your preference', paragraphs: [
        'You can change your recorded preference in Settings at any time. Changing it affects the locally saved response. Because the current application does not transfer research information, there is no previously exported research dataset to retract through this setting.',
        'If your family later joins a separate study, its enrollment materials would explain how to withdraw and what happens to information that has already been collected.'
      ] },
      { heading: '6. Questions and participation rights', paragraphs: [
        'You may use the standard sleep-tracking features without indicating interest in research. A future study’s own participant information must identify the responsible research contacts before enrollment.'
      ] }
    ]
  }
};
