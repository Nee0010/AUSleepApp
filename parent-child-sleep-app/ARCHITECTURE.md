# Architecture

## Milestone 2

```text
Expo / React Native UI
        |
        v
AppContext application state
        |
        +--> authService
        |      - private username policy
        |      - development password verifier
        |
        +--> growthService
        |      - development-only growth calculation
        |
        v
SQLite repository layer
        |
        v
sleep-greenhouse.db on device
```

## Local relational model

```text
accounts
   |
   v
families
   |
   +--> family_members (parent)
   |
   +--> family_members (child)
             |
             v
         greenhouses
             |
             +--> completed_plants
             |
             +--> sleep_records

families --> research_consents
```

Version 1 exposes one parent and one child, but the family/member tables do not hardcode those roles into the family entity itself.

## Privacy boundary

The username is intended to be a non-identifying account handle. Parent and child display names are kept in family-member records because the product experience uses them. Research consent and future research identifiers remain separate concerns. Production research export must not reuse the account username or family display names as the study identifier.

## Next milestone

Cloud accounts and synchronization should add an approved backend while keeping SQLite as the device-side cache. The UI should call services/repositories instead of depending directly on a specific cloud provider.
