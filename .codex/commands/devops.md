# DevOps Command – Infrastructure & CI/CD Workflow

When `/devops <task description>` is invoked, immediately execute the following steps to create, configure, or manage DevOps infrastructure, CI/CD pipelines, and deployment configurations.

---

## Step 1: Load Project Context & Follow All Rules

1. Assume the project root as the working directory
2. **Load and strictly follow ALL Cursor rules** from `.cursor/rules/*.mdc`:
   - `security.mdc` - Security requirements (especially for secrets, credentials, and deployment)
   - `technical-stack.mdc` - React Native/Android build patterns
   - `documentation.mdc` - Documentation update requirements
   - `version-management.mdc` - Git commit/push workflow
3. Read relevant documentation:
   - `README.md`
   - `PROGRESS.md`
   - Any existing DevOps documentation (e.g., `PLAY_STORE_DEPLOYMENT.md`)
   - Architecture and deployment documents
4. Identify the current Git branch and assume it is a **feature branch**, not `main`
5. **Check for attachments** (diagrams, existing configs, requirements):
   - Analyze any visual references or existing configurations
   - Extract deployment requirements, environment specifications
   - Use attachments to clarify infrastructure needs
   - If attachments conflict with description, **ask for clarification**

---

## Step 2: Understand the DevOps Task

1. Parse the task description provided after `/devops`
2. **Incorporate context from any attached files or diagrams**:
   - Existing CI/CD configurations
   - Infrastructure diagrams
   - Deployment workflows
   - Environment specifications
3. Clearly define:
   - What DevOps infrastructure needs to be created or modified
   - Which tools/services are involved (GitHub Actions, Kubernetes, Docker, etc.)
   - What the expected deployment workflow is
   - What environments are needed (dev, staging, production)
4. Identify impacted areas:
   - CI/CD pipeline configurations (`.github/workflows/`)
   - Kubernetes manifests (`k8s/` or `kubernetes/`)
   - Docker configurations (`Dockerfile`, `docker-compose.yml`)
   - Build scripts (`package.json`, `scripts/`)
   - Environment configuration files (`.env.example`, `.env.production`)
   - Deployment documentation
5. If requirements or scope are unclear (even with attachments), **stop and ask before proceeding**

---

## Step 3: Security & Credentials Check (Mandatory)

Before creating any DevOps configuration:

1. **Never commit secrets, API keys, or credentials**:
   - Use GitHub Secrets for sensitive values
   - Use environment variables for configuration
   - Create `.env.example` files with placeholder values
   - Add `.env*` to `.gitignore` if not already present
2. Check for:
   - Hardcoded secrets in configuration files
   - Exposed credentials in scripts
   - Unsafe file permissions
   - Missing `.gitignore` entries for sensitive files
3. Validate:
   - All secrets are externalized
   - CI/CD workflows use secrets from secure storage
   - Kubernetes secrets are properly configured
   - No credentials in version control
4. If security implications are unclear, **stop and ask before proceeding**

---

## Step 4: Implement DevOps Configuration

1. Create or modify configuration files based on the task:
   - **GitHub Actions**: Create workflows in `.github/workflows/`
   - **Kubernetes**: Create manifests in `k8s/` or `kubernetes/` directory
   - **Docker**: Create or update `Dockerfile` and related files
   - **CI/CD Scripts**: Add scripts to `scripts/` directory
   - **Environment Configs**: Create `.env.example` files
2. Follow best practices:
   - Use semantic versioning for releases
   - Implement proper error handling in scripts
   - Add comments explaining non-obvious configurations
   - Use consistent naming conventions
   - Follow platform-specific conventions (GitHub Actions, Kubernetes, etc.)
3. Keep configurations:
   - Explicit and readable
   - Well-documented with comments
   - Maintainable and version-controlled
   - Following industry standards

---

## Step 5: Common DevOps Tasks

### GitHub Actions Workflows

When creating GitHub Actions workflows:

- Place files in `.github/workflows/` directory
- Use descriptive workflow names (e.g., `ci.yml`, `deploy-android.yml`)
- Define triggers (push, pull_request, workflow_dispatch)
- Use matrix strategies for multiple environments
- Cache dependencies when possible
- Use secrets for sensitive values
- Add proper error handling and notifications

### Kubernetes Manifests

When creating Kubernetes configurations:

- Create directory structure: `k8s/` or `kubernetes/`
- Separate files by resource type (deployment.yaml, service.yaml, configmap.yaml, secret.yaml)
- Use namespaces appropriately
- Define resource limits and requests
- Use ConfigMaps for non-sensitive configuration
- Use Secrets for sensitive data (never commit actual secrets)
- Add health checks (liveness, readiness probes)

### Docker Configuration

When creating Docker files:

- Use multi-stage builds for smaller images
- Leverage layer caching effectively
- Use specific version tags, not `latest`
- Minimize image size
- Follow security best practices
- Document exposed ports and volumes

### Build & Deployment Scripts

When creating build scripts:

- Make scripts idempotent when possible
- Add proper error handling
- Use environment variables for configuration
- Support multiple environments (dev, staging, prod)
- Add logging and progress indicators
- Validate prerequisites before execution

---

## Step 6: Validate Configuration

1. Reason through the deployment workflow end-to-end
2. Ensure:
   - All configurations are syntactically correct
   - No hardcoded secrets or credentials
   - Proper error handling is in place
   - Environment variables are properly externalized
   - Build and deployment steps are correct
   - Security best practices are followed
3. Verify:
   - GitHub Actions workflows follow YAML syntax
   - Kubernetes manifests are valid YAML
   - Dockerfiles follow best practices
   - Scripts are executable and have proper shebangs
4. If applicable, test configurations locally or in a test environment

---

## Step 7: Update Documentation (Required)

Before committing, **automatically** update (as per `documentation.mdc` rule):

1. **README.md**:
   - Add or update deployment instructions
   - Document new CI/CD workflows
   - Add environment setup instructions
   - Document required secrets/environment variables
2. **PROGRESS.md**:
   - Add DevOps infrastructure to completed list with `[x]` checkbox
   - Update "Last updated" timestamp
3. **CHANGELOG.md**:
   - Add entry under "## [Unreleased]" or new version
   - Format: `- Added: <devops feature description>`
4. **Create or update DevOps docs**:
   - Create `DEPLOYMENT.md` if deployment process is complex
   - Document CI/CD workflows
   - Document Kubernetes setup if applicable
   - Document required environment variables and secrets

**Do NOT ask** - update docs automatically. This is mandatory.

---

## Step 8: Commit & Push (Required)

After completing the DevOps configuration:

```bash
git add .
git commit -m "devops: <clear description of the DevOps configuration added>"
git push origin $(git branch --show-current)
```

- Never push directly to `main` or `master`
- Always push to the current feature branch
- Large DevOps setups may be split into multiple incremental commits

---

## Cursor Behavior Rules

- **Security first** - Never commit secrets or credentials
- **Follow best practices** - Use industry-standard patterns for CI/CD and infrastructure
- **Document everything** - All configurations should be clear and well-documented
- **Test configurations** - Validate syntax and structure before committing
- **Externalize configuration** - Use environment variables and secrets
- Every `/devops` must result in at least one commit unless explicitly blocked

---

## Usage

Use `/devops <task description>` to:

- **GitHub Actions**: Create CI/CD workflows for automated testing, building, and deployment
  - Example: `/devops create GitHub Actions workflow for Android build and release`
  - Example: `/devops add GitHub Actions workflow for automated testing on pull requests`

- **Kubernetes**: Create deployment manifests, services, and configurations
  - Example: `/devops create Kubernetes deployment for production environment`
  - Example: `/devops add Kubernetes service and ingress configuration`

- **Docker**: Create or update Docker configurations for containerization
  - Example: `/devops create Dockerfile for React Native Android app`
  - Example: `/devops add docker-compose.yml for local development`

- **Build Scripts**: Create automated build and deployment scripts
  - Example: `/devops create build script for release APK generation`
  - Example: `/devops add deployment script for staging environment`

- **Environment Configuration**: Set up environment-specific configurations
  - Example: `/devops create environment configuration files for dev and prod`
  - Example: `/devops add .env.example with required variables`

- **CI/CD Pipeline**: Set up complete continuous integration and deployment pipelines
  - Example: `/devops create CI/CD pipeline for automated testing and deployment`
  - Example: `/devops add automated release workflow with versioning`

---

## Common DevOps Patterns for React Native

### Android Build & Release

- **GitHub Actions**: Automate Android APK/AAB builds
- **Signing**: Use GitHub Secrets for keystore and passwords
- **Versioning**: Use semantic versioning from package.json
- **Artifacts**: Upload build artifacts for download or deployment

### Testing & Quality

- **Linting**: Run ESLint in CI pipeline
- **Type Checking**: Run TypeScript compiler checks
- **Unit Tests**: Run Jest tests
- **E2E Tests**: Run Playwright tests if applicable

### Deployment

- **Play Store**: Automate AAB upload to Google Play Console
- **Internal Testing**: Deploy to internal testing track
- **Version Management**: Auto-increment version numbers
- **Release Notes**: Generate from commits or CHANGELOG

---

## Examples

### Example 1: GitHub Actions CI Workflow

```
/devops create GitHub Actions workflow that runs lint, type check, and tests on every pull request
```

### Example 2: Kubernetes Deployment

```
/devops create Kubernetes deployment manifest for the React Native app with 3 replicas
```

### Example 3: Docker Configuration

```
/devops create Dockerfile for building and running the Android app in a container
```

### Example 4: Release Pipeline

```
/devops create GitHub Actions workflow for automated Android release builds and Play Store deployment
```
