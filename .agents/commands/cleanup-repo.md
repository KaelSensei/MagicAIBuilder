# Cleanup Repo Command – Repository Organization and Structure Cleanup

When `/cleanup-repo` is invoked, immediately execute the following steps to analyze, organize, and clean up the repository structure when files are scattered and disorganized.

---

## Step 1: Load Project Context

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements
   - `technical-stack.mdc` - React Native/SQLite patterns
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git commit/push workflow
   - `general-principles.mdc` - Project philosophy
3. Read relevant documentation:
   - `README.md`
   - `PROGRESS.md`
   - `.cursor/docs/DOCUMENTATION_STRUCTURE.md` (if exists)
   - Architecture documents
4. Identify the current Git branch and assume it is a **refactor branch**, not `main`

---

## Step 2: Analyze Current Repository Structure

1. **Scan the entire repository** to understand current organization:

   ```bash
   find . -type f -name "*.md" -o -name "*.json" -o -name "*.ps1" -o -name "*.js" | grep -v node_modules | grep -v .git
   ```

2. **Identify scattered files**:
   - Documentation files in root (should be in `docs/` or `.cursor/docs/`)
   - Script files in root (should be in `scripts/` or `tools/`)
   - Configuration files in wrong locations
   - Test data files in root (should be in `test-data/` or `misc/`)
   - Image/assets in wrong locations
   - Duplicate files
   - Unused files

3. **Check for organizational issues**:
   - Multiple documentation files in root vs. organized folders
   - Scripts scattered vs. in a `scripts/` folder
   - Test data mixed with source code
   - Configuration files not in standard locations
   - Build artifacts in wrong places
   - Temporary files that should be deleted

4. **Review recommended structure** (from `.cursor/docs/DOCUMENTATION_STRUCTURE.md` if available):
   - Documentation should be organized in folders
   - Scripts should be in `scripts/` or `tools/`
   - Test data should be in `test-data/` or `misc/`
   - Assets should be in `src/assets/` or appropriate folders

---

## Step 3: Identify Files to Organize

1. **Documentation files** (typically in root, should be organized):
   - `ANDROID_CONFIG.md`, `ANDROID_SETUP.md` → `docs/android/` or `.cursor/docs/android/`
   - `INSTALL_INSTRUCTIONS.md`, `RUN_ON_ANDROID.md` → `docs/installation/` or `.cursor/docs/installation/`
   - `PLAY_STORE_DEPLOYMENT.md` → `docs/deployment/` or `.cursor/docs/deployment/`
   - `TESTING.md`, `TROUBLESHOOTING.md`, `DEBUG.md` → `docs/development/` or `.cursor/docs/development/`
   - `SCRAPING_ISSUES.md` → `docs/troubleshooting/` or `.cursor/docs/troubleshooting/`
   - Architecture docs → `docs/architecture/` or `.cursor/docs/architecture/`
   - Step-by-step plans → `docs/development/` or `.cursor/docs/development/`

2. **Script files** (should be in `scripts/`):
   - `*.ps1` files → `scripts/` or `scripts/setup/`
   - `setup-android.js` → `scripts/setup/`
   - Other utility scripts → `scripts/` or `scripts/utils/`

3. **Test data and misc files**:
   - `misc/*.json` → Keep in `misc/` if test data, or move to `test-data/` if better organized
   - Temporary files → Delete if no longer needed
   - Sample data → `test-data/` or `misc/`

4. **Asset files**:
   - `AppIcons/` → Should be in `src/assets/` or `assets/` if not already
   - Root-level images → Move to `src/assets/images/`

5. **Configuration files**:
   - Ensure standard config files are in root (correct)
   - Check for duplicate configs
   - Verify `.gitignore` is comprehensive

6. **Unused/obsolete files**:
   - Old backup files
   - Temporary files
   - Duplicate files
   - Files that are no longer referenced

---

## Step 4: Plan the Reorganization

1. **Create target directory structure** (if needed):

   ```
   docs/                    # Root-level docs (or .cursor/docs/)
   ├── android/
   ├── installation/
   ├── deployment/
   ├── development/
   ├── troubleshooting/
   └── architecture/

   scripts/                 # All scripts
   ├── setup/
   └── utils/

   test-data/              # Test data and samples
   misc/                   # Keep if needed, or consolidate
   ```

2. **Map files to new locations**:
   - Create a mapping of current path → new path
   - Group related files together
   - Ensure logical organization

3. **Check for file references**:
   - Search for references to files that will be moved
   - Identify files that reference moved files (README.md, other docs, scripts)
   - Plan to update references after moving

4. **Verify no conflicts**:
   - Check if target directories exist
   - Check if target files already exist (avoid overwriting)
   - Plan merge strategy if needed

---

## Step 5: Security & Safety Check (Mandatory)

Before moving any files:

1. **Verify files are safe to move**:
   - Check if files are referenced in build configs
   - Check if files are referenced in package.json scripts
   - Check if files are referenced in CI/CD configs
   - Verify no hardcoded paths in code

2. **Check for critical files**:
   - Don't move essential config files (package.json, tsconfig.json, etc.)
   - Don't move files that must be in root for tooling
   - Verify `.gitignore` won't be affected

3. **Backup strategy**:
   - Consider creating a backup branch before major reorganization
   - Or use git to track all changes (git will show moves)

---

## Step 6: Execute the Reorganization

1. **Create target directories** (if they don't exist):

   ```bash
   mkdir -p docs/android docs/installation docs/deployment docs/development docs/troubleshooting docs/architecture
   mkdir -p scripts/setup scripts/utils
   mkdir -p test-data
   ```

2. **Move documentation files**:
   - Move files to appropriate `docs/` subdirectories
   - Use `git mv` to preserve history:
     ```bash
     git mv ANDROID_CONFIG.md docs/android/
     git mv ANDROID_SETUP.md docs/android/
     git mv INSTALL_INSTRUCTIONS.md docs/installation/
     # etc.
     ```

3. **Move script files**:

   ```bash
   git mv *.ps1 scripts/setup/
   git mv setup-android.js scripts/setup/
   ```

4. **Organize test data**:
   - Move or consolidate `misc/` files if appropriate
   - Create `test-data/` if needed

5. **Move asset files** (if needed):
   - Move `AppIcons/` to `src/assets/` if appropriate
   - Move root-level images to `src/assets/images/`

6. **Delete unused files**:
   - Remove temporary files
   - Remove duplicate files
   - Remove obsolete backups

---

## Step 7: Update File References

1. **Search for references to moved files**:
   - Search README.md for links to moved docs
   - Search other documentation files
   - Search package.json for script references
   - Search code files for hardcoded paths

2. **Update references**:
   - Update links in README.md
   - Update links in other documentation
   - Update script paths in package.json
   - Update import paths in code (if any)
   - Update .gitignore if paths changed

3. **Verify all references are updated**:
   - Do a comprehensive search for old paths
   - Ensure no broken links remain

---

## Step 8: Update Documentation

1. **Update README.md**:
   - Update documentation links to new paths
   - Update any file references
   - Ensure structure section reflects new organization

2. **Update PROGRESS.md**:
   - Add entry about repository reorganization
   - Update "Last updated" timestamp

3. **Create/update structure documentation**:
   - Update `.cursor/docs/DOCUMENTATION_STRUCTURE.md` if it exists
   - Or create a `docs/STRUCTURE.md` explaining the organization

4. **Update .gitignore** (if needed):
   - Ensure new directories are properly handled
   - Add any new patterns if needed

---

## Step 9: Validate the Reorganization

1. **Check file structure**:
   - Verify all files are in logical locations
   - Verify no files were lost
   - Verify directory structure makes sense

2. **Check for broken references**:
   - Search for old paths that might still be referenced
   - Verify all links work
   - Check that scripts still work

3. **Verify git status**:
   - Check `git status` to see all moves/changes
   - Verify no unintended deletions
   - Verify all changes are staged appropriately

4. **Test critical paths**:
   - Verify build still works
   - Verify scripts still work (if any are critical)
   - Verify documentation links work

---

## Step 10: Commit & Push (Required)

After reorganization is complete:

```bash
git add .
git commit -m "refactor: reorganize repository structure

- Organized documentation into docs/ subdirectories
- Moved scripts to scripts/ directory
- Consolidated test data and misc files
- Updated all file references in documentation
- Improved repository organization and maintainability"
git push origin $(git branch --show-current)
```

- Never push directly to `main` or `master`
- Always push to the current branch
- Use descriptive commit messages explaining the reorganization

---

## Cursor Behavior Rules

- **Be thorough** - Don't just move files, ensure proper organization
- **Preserve history** - Use `git mv` to preserve file history
- **Update references** - Always update links and references after moving files
- **Verify safety** - Check that moves won't break builds or scripts
- **Document changes** - Update documentation to reflect new structure
- **Ask if uncertain** - If unsure about moving a critical file, ask first
- Every `/cleanup-repo` must result in a commit unless explicitly blocked

---

## Usage

Use `/cleanup-repo` when:

- Documentation files are scattered in the root
- Scripts are in the root instead of organized folders
- Test data is mixed with source code
- Files are in illogical locations
- Repository structure is messy and needs organization
- You want to improve maintainability and discoverability

**Examples:**

- `/cleanup-repo` - Analyze and organize the entire repository

---

## Reorganization Checklist

When cleaning up the repo, ensure:

- [ ] All documentation files are in appropriate `docs/` subdirectories
- [ ] All scripts are in `scripts/` directory
- [ ] Test data is in `test-data/` or `misc/` (organized)
- [ ] Assets are in `src/assets/` or appropriate locations
- [ ] Configuration files are in standard locations
- [ ] Unused/temporary files are deleted
- [ ] All file references are updated (README, docs, scripts)
- [ ] Directory structure is logical and maintainable
- [ ] Git history is preserved (using `git mv`)
- [ ] Documentation reflects new structure
- [ ] No broken links or references remain
- [ ] Build and scripts still work after reorganization

---

## Common Reorganization Patterns

### Documentation Organization

```
Root (scattered) → Organized
├── ANDROID_CONFIG.md → docs/android/ANDROID_CONFIG.md
├── INSTALL_INSTRUCTIONS.md → docs/installation/INSTALL_INSTRUCTIONS.md
├── PLAY_STORE_DEPLOYMENT.md → docs/deployment/PLAY_STORE_DEPLOYMENT.md
└── TESTING.md → docs/development/TESTING.md
```

### Script Organization

```
Root (scattered) → Organized
├── setup-android.ps1 → scripts/setup/setup-android.ps1
├── fix-navigation.ps1 → scripts/utils/fix-navigation.ps1
└── setup-android.js → scripts/setup/setup-android.js
```

### Test Data Organization

```
Root/misc (scattered) → Organized
├── misc/*.json → test-data/*.json (if test data)
└── misc/*.json → Keep in misc/ (if project-specific)
```

---

## Integration with Project Rules

All reorganization must respect:

- `.cursor/rules/security.mdc` - Don't move security-critical files
- `.cursor/rules/technical-stack.mdc` - Maintain React Native structure
- `.cursor/rules/documentation.mdc` - Update all documentation
- `.cursor/rules/version-management.mdc` - Use git mv, commit properly

---

## Notes

- **Use `git mv`** instead of regular `mv` to preserve file history
- **Update references immediately** after moving files
- **Test after reorganization** to ensure nothing broke
- **Document the new structure** so future changes follow the pattern
- **Be conservative** - if unsure about a file, ask or leave it

---

## Example: Typical Reorganization

**Before:**

```
MagicTheOfflining/
├── ANDROID_CONFIG.md
├── ANDROID_SETUP.md
├── INSTALL_INSTRUCTIONS.md
├── PLAY_STORE_DEPLOYMENT.md
├── TESTING.md
├── TROUBLESHOOTING.md
├── setup-android.ps1
├── fix-navigation.ps1
├── misc/
│   └── *.json
└── AppIcons/
```

**After:**

```
MagicTheOfflining/
├── docs/
│   ├── android/
│   │   ├── ANDROID_CONFIG.md
│   │   └── ANDROID_SETUP.md
│   ├── installation/
│   │   └── INSTALL_INSTRUCTIONS.md
│   ├── deployment/
│   │   └── PLAY_STORE_DEPLOYMENT.md
│   └── development/
│       ├── TESTING.md
│       └── TROUBLESHOOTING.md
├── scripts/
│   └── setup/
│       ├── setup-android.ps1
│       └── fix-navigation.ps1
├── test-data/
│   └── *.json (from misc/)
└── src/assets/
    └── AppIcons/
```

This is the kind of organization `/cleanup-repo` should achieve.
