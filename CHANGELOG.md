# Changelog

## [2.0.0] - 2024-12-XX

### BREAKING CHANGES
- Updated to Parse SDK 6.1.1 as peer dependency (was not explicitly listed before)
- Updated to MobX 6.13.0+ as peer dependency
- Both MobX and Parse SDK are now peer dependencies requiring manual installation
- Updated TypeScript target to ES2018
- Updated all development dependencies to latest versions

### Added
- Parse SDK 6.1.1 compatibility
- Enhanced TypeScript configuration with better ES2018 support

### Changed
- **BREAKING**: MobX and Parse SDK moved to peer dependencies
- Updated development dependencies (TypeScript 5.7.2, ESLint, Prettier, Jest, etc.)
- Improved type compatibility with Parse SDK 6.1.1
- Enhanced LiveQuery subscription type handling

### Migration Guide
Users upgrading from v1.x must now install the peer dependencies:
```bash
npm install mobx@^6.13.0 parse@^6.1.1
```

