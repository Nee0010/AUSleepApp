# Sleep Greenhouse

Milestone 2 prototype for the Parent & Child Sleep App.

## What works now

- Expo / React Native / TypeScript app for iOS and Android
- Local account creation with a private username and password
- Username privacy guidance and a generated anonymous-style username option
- One parent and one child in the Version 1 UI
- Persistent SQLite database on the device
- Restored signed-in session after closing and reopening the app
- Parent and child family records
- Child greenhouse record
- Saved development sleep entries
- Persistent sunlight, water, and plant growth
- Persistent completed-plant history
- Sign out
- Full local development-data reset
- Research-consent table reserved for later university-approved consent work

## Important security note

This is a development prototype, not a production authentication system.

The prototype stores only a salted hash of the local password, not the password itself. The hash is intentionally a temporary local-auth mechanism so the account flow can be developed before the cloud backend exists. Production authentication should be moved to the approved backend identity provider and should use its managed password storage and authentication controls.

A non-identifying username reduces direct-identification risk, but it does not by itself make the app HIPAA compliant. Parent and child display names are still direct identifiers in the local family profile. Future research data should use separate coded study identifiers and approved export rules.

## Run

From the project folder:

```cmd
npm install
npx expo start
```

For an existing copy of the Milestone 1 project, Expo can also install the new native packages directly:

```cmd
npx expo install expo-sqlite expo-crypto
```

Then restart Metro with a clean cache:

```cmd
npx expo start -c
```

## Persistence test

1. Create an account and greenhouse.
2. Add one sleep-progress entry.
3. Confirm it appears under Saved sleep entries.
4. Fully close Expo Go.
5. Reopen Expo Go and the project.
6. The same account, greenhouse progress, and sleep entry should still be present.
7. Tap Sign Out to test local username/password login.
8. Use Reset Data only when you intentionally want to delete all local development data.

## Current database tables

- `accounts`
- `families`
- `family_members`
- `greenhouses`
- `completed_plants`
- `sleep_records`
- `research_consents`
- `app_settings`

## Still intentionally TBD

- Official sleep scoring formula
- Apple Health / Health Connect integration
- Cloud account authentication
- Cloud synchronization
- University research consent language and workflow
- Research export fields
- HIPAA and institutional compliance determination
