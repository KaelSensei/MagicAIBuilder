# Create Command – Generate New Cursor Commands

When `/create-command <command-name> [description]` is invoked, immediately execute the following steps to generate a new Cursor command file.

---

## Step 1: Load Project Context

1. Assume the project root as the working directory
2. Load and respect all Cursor rules from `.cursor/rules/*.mdc`
3. Read existing command files in `.cursor/commands/` to understand the structure
4. Identify the current Git branch and assume it is a **feature branch**, not `main`

---

## Step 2: Parse Command Request

1. Parse the command name provided after `/create-command`
2. Extract optional description if provided
3. Validate the command name:
   - Must be lowercase
   - Can use kebab-case for multi-word commands (e.g., `test-integration`)
   - Must not conflict with existing commands
4. Determine the file path: `.cursor/commands/<command-name>.md`

---

## Step 3: Analyze Existing Commands

1. Read at least 2-3 existing command files (e.g., `feature.md`, `fix.md`, `beautify.md`)
2. Extract the common structure and patterns:
   - Title format
   - Step structure
   - Required sections
   - Git workflow patterns
   - Rule references
3. Note any command-specific variations

---

## Step 4: Generate Command Template

Create the new command file with the following structure:

````markdown
# [Command Name] Command – [Brief Description]

When `/[command] <description>` is invoked, immediately execute the following steps.

---

## Step 1: Load Project Context

1. Assume the project root as the working directory
2. Load and respect all Cursor rules from `.cursor/rules/*.mdc`
3. Read relevant documentation:
   - `README.md`
   - `PROGRESS.md`
   - Architecture or task documents relevant to the command
4. Identify the current Git branch and assume it is a **[type] branch**, not `main`

---

## Step 2: Understand the Task

1. Parse the description provided after `/[command]`
2. Determine:
   - What needs to be done
   - Which files/components are affected
   - What the expected outcome is
3. Locate the exact code paths involved
4. Do **not** assume — verify by reading the code first

---

## Step 3: [Command-Specific Implementation Steps]

[Customize these steps based on the command type. Examples:]

- For testing commands: Run tests, check coverage, update test files
- For deployment commands: Build, validate, deploy, verify
- For analysis commands: Analyze code, generate reports, identify issues

---

## Step 4: Validate

1. Reason through the execution path end-to-end
2. Ensure:
   - The task is completed correctly
   - No regressions were introduced
   - All project rules were followed
3. If applicable, verify outputs or results

---

## Step 5: Update Documentation (If Required)

If the command affects project structure or workflow:

1. Update `PROGRESS.md` if a new feature/workflow was added
2. Update `CHANGELOG.md` if applicable
3. Update `README.md` if usage instructions changed

---

## Step 6: Commit & Push (Required)

After the command file is created:

```bash
git add .cursor/commands/<command-name>.md
git commit -m "docs: add <command-name> command"
git push origin $(git branch --show-current)
```
````

- Never push directly to `main` or `master`
- Always push to the current feature branch

---

## Cursor Behavior Rules

- Follow all project rules from `.cursor/rules/*.mdc`
- Ensure the generated command follows the same structure as existing commands
- Use consistent formatting and terminology
- Every `/create-command` must result in a commit unless explicitly blocked

---

## Usage

Use `/create-command <command-name> [description]` to:

- Generate a new Cursor command file following project patterns
- Create command templates for new workflows
- Ensure consistency across all project commands

**Examples:**

- `/create-command test` - Creates a test command
- `/create-command deploy "Deploy to production"` - Creates a deploy command with description
- `/create-command analyze-code` - Creates an analyze-code command

```

**Important:** Customize Step 3 and other sections based on the specific command type and purpose.

---

## Command Naming Conventions

- **File name**: Use kebab-case (e.g., `test-integration.md`, `code-analyze.md`)
- **Command name**: Use lowercase, single word or kebab-case (e.g., `test`, `deploy`, `test-integration`)
- **Title**: Use Title Case (e.g., "Test Command", "Deploy Command", "Test Integration Command")

---

## Required Sections Checklist

Every generated command must include:

- [ ] Title with command name and brief description
- [ ] Step 1: Load Project Context
- [ ] Step 2: Understand the Task
- [ ] Step 3-N: Command-specific implementation steps
- [ ] Validation step
- [ ] Documentation update step (if applicable)
- [ ] Commit & Push step (mandatory)
- [ ] Cursor Behavior Rules
- [ ] Usage section with examples

---

## Integration with Project Rules

All generated commands must reference:
- `.cursor/rules/security.mdc` - Security requirements
- `.cursor/rules/technical-stack.mdc` - Tech stack patterns
- `.cursor/rules/documentation.mdc` - Documentation updates
- `.cursor/rules/version-management.mdc` - Git workflow
```
