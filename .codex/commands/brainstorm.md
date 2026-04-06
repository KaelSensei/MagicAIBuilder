# Brainstorm Command – AI-Powered Feature Ideation and Planning

When `/brainstorm [topic]` is invoked, immediately execute the following steps to collaboratively brainstorm, enhance, and plan new features for the app through an iterative product management workflow.

---

## Step 1: Load Project Context & Follow All Rules

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements
   - `technical-stack.mdc` - React Native/SQLite patterns
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git commit/push workflow
   - `general-principles.mdc` - Project philosophy (simple, offline-first, personal)
3. Read relevant documentation:
   - `PROGRESS.md` - Current features and completed work
   - `README.md` - App overview and capabilities
   - Architecture documents - Technical constraints
   - `magic_the_offlining_step_by_step_dev_plan.md` - Planned features
4. Check current git status and branch
5. Understand the app's current state and capabilities

---

## Step 2: Understand the Brainstorming Topic

1. **Parse the topic** provided after `/brainstorm`:
   - If topic provided: Focus brainstorming on that area (e.g., "search", "deck management", "offline features")
   - If no topic: Conduct general brainstorming for the entire app

2. **Analyze current app state**:
   - Review `PROGRESS.md` for completed features
   - Identify gaps or areas for improvement
   - Consider user pain points based on code structure
   - Review technical constraints (offline-first, no backend, SQLite only)

3. **Set brainstorming scope**:
   - What area needs enhancement?
   - What problems should we solve?
   - What user workflows could be improved?

---

## Step 3: Initial Feature Analysis

1. **Review current features**:
   - List all major features from `PROGRESS.md`
   - Identify strengths and weaknesses
   - Note any incomplete or partially implemented features

2. **Identify pain points**:
   - Review code for TODO comments or incomplete implementations
   - Look for areas with complex logic that could be simplified
   - Check for missing error handling or edge cases
   - Review user-facing flows for friction points

3. **Consider technical constraints**:
   - Must work offline (no cloud services)
   - SQLite is the single source of truth
   - React Native Android-first
   - No backend server
   - Personal project (not enterprise)

---

## Step 4: Generate Feature Ideas

1. **Brainstorm new features** aligned with project philosophy:
   - Simple solutions over complex ones
   - Offline-first capabilities
   - Personal use focus
   - Fast and functional over beautiful

2. **Enhancement ideas** for existing features:
   - How to improve current workflows
   - What's missing from current implementations
   - How to make features more user-friendly

3. **Consider user workflows**:
   - Import → Browse → Search → Edit → Export?
   - What steps are missing or could be smoother?
   - What would make the app more useful?

4. **Generate 5-10 feature ideas** with:
   - Brief description
   - Why it's valuable
   - How it fits the offline-first philosophy
   - Technical feasibility assessment

---

## Step 5: Prioritize and Evaluate Features

1. **Evaluate each idea** against criteria:
   - **Value**: How much does this improve the user experience?
   - **Feasibility**: Can this be done with current tech stack?
   - **Complexity**: Simple vs. complex implementation
   - **Alignment**: Does it fit the project philosophy?
   - **Dependencies**: Does it require other features first?

2. **Categorize features**:
   - **Quick wins**: Easy to implement, high value
   - **High value**: Significant improvement, moderate effort
   - **Nice to have**: Lower priority, can be done later
   - **Out of scope**: Doesn't fit philosophy or constraints

3. **Rank features** by priority:
   - Consider user impact
   - Consider implementation effort
   - Consider dependencies between features

---

## Step 6: Create Implementation Plans

For top-priority features (top 3-5):

1. **Break down into steps**:
   - What needs to be built?
   - What files/components are affected?
   - What database changes are needed?
   - What UI changes are required?

2. **Estimate complexity**:
   - Simple: < 1 day
   - Medium: 1-3 days
   - Complex: > 3 days

3. **Identify dependencies**:
   - What must be done first?
   - What can be done in parallel?
   - What blocks other features?

4. **Create implementation roadmap**:
   - Step-by-step breakdown
   - Technical approach
   - Files that need modification
   - Database schema changes (if any)

---

## Step 7: Iterative Refinement

1. **Present ideas to user**:
   - List all brainstormed features
   - Show prioritization
   - Present top 3-5 with implementation plans

2. **Get user feedback**:
   - Which features interest them?
   - What should be prioritized?
   - Any modifications needed?
   - Any new ideas to add?

3. **Refine based on feedback**:
   - Adjust priorities
   - Modify feature scope
   - Add or remove features
   - Update implementation plans

4. **Iterate** until user is satisfied with the plan

---

## Step 8: Document the Brainstorming Session

1. **Update PROGRESS.md**:
   - Add new features to "Future Features" or "Planned" section
   - Mark brainstorming session date
   - Note prioritized features

2. **Create or update feature backlog**:
   - Document all brainstormed features
   - Include priority rankings
   - Include implementation complexity
   - Include dependencies

3. **Update step-by-step dev plan** (if applicable):
   - Add new steps for high-priority features
   - Update existing steps if needed

---

## Step 9: Create Action Items

1. **For immediate implementation** (if user wants to start):
   - Create feature branch using `/create-branch` or `/feature-branch`
   - Begin with highest priority feature
   - Use `/feature` command to implement

2. **For future work**:
   - Document in PROGRESS.md
   - Add to backlog
   - Note dependencies

---

## Cursor Behavior Rules

- **Always respect project philosophy**: Simple, offline-first, personal, fast
- **Never suggest features that violate constraints**: No backend, no cloud, no auth
- **Always consider technical feasibility**: React Native, SQLite, offline-only
- **Prioritize user value**: Focus on what makes the app more useful
- **Be creative but practical**: Ideas should be implementable
- **Iterate based on feedback**: Refine ideas through discussion
- **Document everything**: Update PROGRESS.md and backlog

---

## Usage

Use `/brainstorm [topic]` to:

- Generate new feature ideas for the app
- Enhance existing features through iteration
- Plan product roadmap in a structured way
- Follow product manager workflow for feature planning

**Examples:**

- `/brainstorm` - General brainstorming for entire app
- `/brainstorm search` - Focus on search functionality improvements
- `/brainstorm deck management` - Brainstorm deck-related features
- `/brainstorm offline features` - Focus on offline capabilities

---

## Brainstorming Framework

### Feature Evaluation Criteria

1. **Value to User** (1-5):
   - 5: Essential feature, significantly improves experience
   - 3: Nice improvement
   - 1: Minor enhancement

2. **Implementation Effort** (1-5):
   - 1: Very simple, < 1 day
   - 3: Moderate, 1-3 days
   - 5: Complex, > 3 days

3. **Alignment with Philosophy**:
   - ✅ Fits: Simple, offline, personal, fast
   - ⚠️ Questionable: May be too complex
   - ❌ Doesn't fit: Violates constraints

4. **Priority Score**: Value / Effort ratio
   - Higher score = higher priority

### Feature Categories

- **Core Features**: Essential functionality (import, browse, search)
- **Enhancement Features**: Improve existing workflows
- **Quality of Life**: Small improvements for better UX
- **Advanced Features**: Nice-to-have, can wait

---

## Integration with Project Rules

All brainstormed features must respect:

- `.cursor/rules/general-principles.mdc` - Project philosophy (simple, offline-first)
- `.cursor/rules/technical-stack.mdc` - Tech stack constraints (React Native, SQLite)
- `.cursor/rules/security.mdc` - Security requirements (no unauthorized APIs)
- `.cursor/rules/documentation.mdc` - Documentation update requirements

---

## Example Brainstorming Output

```
## Brainstorming Session - [Date]

### Topic: Search Functionality

### Ideas Generated:

1. **Advanced Search Filters** (Priority: High)
   - Filter by card type, mana cost, color
   - Filter by deck, board type
   - Value: 4/5, Effort: 2/5, Score: 2.0

2. **Search History** (Priority: Medium)
   - Remember recent searches
   - Quick access to frequent searches
   - Value: 3/5, Effort: 1/5, Score: 3.0

3. **Saved Searches** (Priority: Low)
   - Save complex search queries
   - Value: 2/5, Effort: 3/5, Score: 0.67

### Top Priority: Search History (Score: 3.0)
- Quick win, high user value
- Implementation: Add SQLite table for search history
- Files: CardSearchScreen.tsx, db/repositories.ts
```

---

## Notes

- This command is **iterative** - work with the user to refine ideas
- Focus on **practical, implementable** features
- Always consider the **offline-first** constraint
- Prioritize **user value** over technical complexity
- Document everything for future reference
