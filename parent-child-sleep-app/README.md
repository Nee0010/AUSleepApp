# Sleep Greenhouse • Cycle 2

Parent-only Expo / React Native app. Cycle 2 implementation for local testing and evaluation.

## Run on Windows

1. Install Node.js (recent LTS) if needed.
2. Extract the ZIP and open `parent-child-sleep-app`.
3. Double-click `START-APP.cmd`, or run:
   ```bash
   npm install
   npx expo start -c
   ```
4. Use the QR code with the development environment supported by Expo SDK 57, or use an Android/iOS simulator. For the browser demo, use `START-WEB.cmd`.

`npm test` runs the rules and plant-growth checks. `npm run typecheck` checks TypeScript after installing dependencies.

## Implemented in Cycle 2

- Create/sign in/sign out of a parent-operated **local** test account.
- Add multiple children, edit each child, maintain a separate greenhouse, delete extra child profiles with confirmation.
- Record parent and child sleep hours. One sleep entry per child per local day, with the parent's input shared across children.
- Age-based sleep goals, 0–100 sunlight/water points, seven full days per plant, rotating plants and saved plant collections.
- Show sleep history with 7-day, 30-day and all-time filters.
- Parent and child profile settings, research-choice change, total local data reset.
- Detailed, consistently formatted Terms of Service, Privacy Statement, Health Data Notice, and optional Research Participation and Parental Permission documents, dated October 16, 2026 (version 2.0).
- On account creation, agree to the Terms and acknowledge the Privacy and Health Data notices. Research choice is optional and defaults to **No**.
- Store all app data locally, and migrate older app data where available.

## Privacy and security limits

**Do not use this prototype for live university research or enter real participant health data.**

- Auburn must approve privacy wording, parental permission and any IRB consent process. The in-app legal-style documents describe the current functionality but are not legal sign-off. The exact approval notice appears once on the Privacy and Consent page.
- The app uses development-only local password verification (salted SHA-256 for compatibility with Cycle 1), **not** production-safe password storage. New signup requires 8+ characters; older passwords continue to work after migration.
- Local SQLite data is not separately encrypted by this app. Web demo uses browser localStorage and is not appropriate for sensitive information.
- Cloud sync, independent research export, production account management, wearable integration, and audit/access controls belong to Cycle 3.
- No third-party analytics or cloud data uploads are implemented. No HIPAA compliance claim is made.
- A parent-operated app may have different COPPA obligations than a child-operated service, but institutional review is still needed.

## Data migration

On native devices, this version uses the **same SQLite filename** (`sleep-greenhouse.db`) and imports pre-existing account, family, greenhouse, saved plant and sleep information into a new Cycle 2 snapshot table. The original tables are not deleted during migration. The migrated content is a snapshot: later Cycle 2 changes do not backport to the Cycle 1 tables. **Back up development data before switching versions.** Reset deletes both Cycle 2 and any remaining legacy account rows.

In the browser, a stored `sleep-greenhouse-web-v2` account is migrated into the new `sleep-greenhouse-cycle2-v1` key if present. Some previous saved data may have missing ages; set correct ages in Settings before recording new sleep entries.

## Manual test walkthrough

1. Sign up with a non-identifying username, set parent age 18–99 and child age 5–17. Review and accept required notices, decline or accept optional research separately.
2. Add a second child on Home. Open both greenhouses and verify progress is separate.
3. Record 8 hours parent/9 hours child for Child A. Then record Child B for the same day. Confirm the parent hours are prefilled and locked.
4. Try a second entry for Child A on the same day. It should block the duplicate.
5. Check each child's 7/30/all sleep history. Close and reopen to confirm persistence.
6. Edit ages/names in Settings, change research choice, then sign out and back in.
7. With disposable test data, delete the second child, then Delete All Local Data. Reopening should show a fresh Create Account screen.

## Scope note

This is a Cycle 2 feature implementation for local evaluation, not a validated release for research participants. Real-device acceptance testing and university approvals are still necessary.
