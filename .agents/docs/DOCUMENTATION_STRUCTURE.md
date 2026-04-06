# Recommended Documentation Structure for MagicTheOfflining

This document outlines suggested folders and markdown files to enhance AI comprehension and development efficiency.

## 📁 Suggested Folder Structure

```
.agents/
├── commands/          # ✅ Already exists (start.md, continue.md)
├── rules/            # ✅ Already exists (security, technical-stack, etc.)
└── docs/             # 🆕 NEW: Project-specific documentation
    ├── architecture/
    ├── components/
    ├── data-models/
    ├── patterns/
    ├── decisions/
    └── troubleshooting/
```

## 📄 Recommended Documentation Files

### 1. Architecture & Design (`docs/architecture/`)

#### `database-schema.md`

- **Purpose**: Detailed SQLite schema documentation
- **Contents**:
  - Table structures with all columns
  - Indexes and their purposes
  - Foreign key relationships
  - Migration history
  - Query patterns and performance notes

#### `data-flow.md`

- **Purpose**: How data moves through the app
- **Contents**:
  - Import pipeline (Moxfield → SQLite → UI)
  - Search flow (User input → Query → Results)
  - Image caching flow
  - Offline vs online states

#### `component-hierarchy.md`

- **Purpose**: React component tree and relationships
- **Contents**:
  - Screen components and their children
  - Shared components and where they're used
  - Navigation structure
  - State management patterns

### 2. Components (`docs/components/`)

#### `screens/`

- `DeckListScreen.md` - Props, state, key functions
- `DeckDetailScreen.md` - Board tabs, card display, edit mode
- `CardSearchScreen.md` - Search logic, result display
- `HomeScreen.md` - Welcome screen, quick actions
- `StatsScreen.md` - Statistics calculations
- `SettingsScreen.md` - Theme, data management

#### `shared-components.md`

- Reusable components (buttons, cards, modals)
- Component props and usage examples
- Styling patterns

### 3. Data Models (`docs/data-models/`)

#### `moxfield-api.md`

- **Purpose**: Moxfield API structure and scraping patterns
- **Contents**:
  - API endpoints used
  - Response structures
  - Scraping assumptions
  - Error handling
  - Rate limiting considerations

#### `database-models.md`

- **Purpose**: TypeScript types and database row types
- **Contents**:
  - `DeckRow`, `CardRow`, `DeckCardRow` structures
  - Type relationships
  - Validation rules
  - Default values

#### `scryfall-api.md`

- **Purpose**: Scryfall image API usage
- **Contents**:
  - Image URL patterns
  - Caching strategy
  - Fallback mechanisms
  - Image formats supported

### 4. Patterns & Conventions (`docs/patterns/`)

#### `code-patterns.md`

- **Purpose**: Common code patterns used in the project
- **Contents**:
  - How to add a new screen
  - How to add a new database query
  - How to add theme support
  - Error handling patterns
  - Loading state patterns

#### `naming-conventions.md`

- **Purpose**: File, function, and variable naming
- **Contents**:
  - File naming (PascalCase for components, camelCase for utils)
  - Function naming patterns
  - Database naming (snake_case vs camelCase)
  - Constant naming

#### `testing-patterns.md`

- **Purpose**: How to write tests
- **Contents**:
  - Unit test structure
  - Integration test patterns
  - Mocking strategies
  - Test data setup

### 5. Decisions (`docs/decisions/`)

#### `adr-*.md` (Architecture Decision Records)

- **Purpose**: Document why certain decisions were made
- **Examples**:
  - `adr-001-why-sqlite.md` - Why SQLite over other databases
  - `adr-002-why-react-native.md` - Why React Native
  - `adr-003-why-scraping.md` - Why scraping vs API
  - `adr-004-why-offline-first.md` - Offline-first architecture

### 6. Troubleshooting (`docs/troubleshooting/`)

#### `common-issues.md`

- **Purpose**: Known issues and solutions
- **Contents**:
  - Build errors and fixes
  - Runtime errors
  - Database migration issues
  - Image loading problems

#### `debugging-guide.md`

- **Purpose**: How to debug common problems
- **Contents**:
  - Logging strategies
  - Debug tools
  - How to inspect SQLite database
  - How to check image cache

### 7. Development Workflows (`docs/workflows/`)

#### `feature-development.md`

- **Purpose**: Step-by-step guide for adding features
- **Contents**:
  1. Plan the feature
  2. Update database schema (if needed)
  3. Create/update components
  4. Add tests
  5. Update documentation
  6. Commit and push

#### `bug-fixing.md`

- **Purpose**: How to fix bugs systematically
- **Contents**:
  1. Reproduce the bug
  2. Identify root cause
  3. Write test case
  4. Fix the bug
  5. Verify fix
  6. Update docs if needed

## 📋 Root-Level Documentation (Keep These)

### Already Good:

- ✅ `PROGRESS.md` - Feature tracking
- ✅ `README.md` - Project overview
- ✅ `magic_the_offlining_architecture.md` - High-level architecture
- ✅ `PLAY_STORE_DEPLOYMENT.md` - Deployment guide
- ✅ `TESTING.md` - Testing overview
- ✅ `TROUBLESHOOTING.md` - General troubleshooting

### Could Enhance:

- `CONTRIBUTING.md` - How to contribute (if open source)
- `CHANGELOG.md` - Version history (automated from commits)
- `API.md` - If you expose any APIs
- `PERFORMANCE.md` - Performance considerations and benchmarks

## 🎯 Priority Recommendations

### High Priority (Most Impact):

1. **`docs/data-models/database-models.md`** - Helps understand data structures
2. **`docs/patterns/code-patterns.md`** - Shows how to extend the codebase
3. **`docs/components/screens/*.md`** - Component documentation
4. **`docs/architecture/data-flow.md`** - Understand app flow

### Medium Priority:

5. **`docs/data-models/moxfield-api.md`** - Scraping details
6. **`docs/troubleshooting/common-issues.md`** - Known problems
7. **`docs/workflows/feature-development.md`** - Development process

### Low Priority (Nice to Have):

8. **`docs/decisions/adr-*.md`** - Historical context
9. **`docs/patterns/naming-conventions.md`** - Consistency
10. **`docs/architecture/component-hierarchy.md`** - Visual structure

## 💡 Quick Start Template

For each new component/feature, create a simple markdown file with:

```markdown
# Component/Feature Name

## Purpose

What this does and why it exists.

## Key Files

- `src/path/to/file.tsx` - Main component
- `src/path/to/file.ts` - Utilities

## Props/Parameters

- `propName` (type): Description

## State

- `stateName`: What it tracks

## Key Functions

- `functionName()`: What it does

## Dependencies

- Uses: Other components/utilities
- Used by: Where it's consumed

## Notes

Any important implementation details or gotchas.
```

## 🔄 Maintenance

- Update docs when code changes (per documentation.mdc rule)
- Keep examples current
- Remove outdated information
- Link related docs together

---

**Note**: Start with high-priority docs and add others as needed. Even partial documentation is better than none!
