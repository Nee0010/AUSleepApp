# Cycle 2 Architecture

```text
Expo Router / React Native screens
 ├── Create Account + separate draft notices
 ├── Home / multiple greenhouses
 ├── Record manual sleep / shared parent day
 ├── History, plant collection
 └── Settings / child profiles / consent / deletion
           │
        AppContext (transactional state writes and validations)
           │
    sleepRules / growth / auth services
           │
   platform persistence adapter
      ├── native SQLite cycle2_state + legacy migration
      └── web localStorage demonstration + legacy migration
```

Account -> 1 parent profile -> N child profiles. Each child has one greenhouse with its own completed plants and daily records. Parent hours for a calendar day are shared by all children. Usernames are validated to discourage direct identifiers. Records are stored locally; consent is versioned and can be changed for optional research in Settings.

This architecture keeps repository operations behind a platform adapter so Cycle 3 can replace the development authentication layer with university-approved backend auth and syncing. The current local password scheme is intentionally **not production grade**.
