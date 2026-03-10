# GitHub Actions Workflows

This directory contains automated CI/CD workflows for the SpendGuard application.

## Workflows

### 1. CI/CD Pipeline (`ci-cd.yml`)

**Main deployment workflow** that handles the complete build, test, and deployment process.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main`
- Manual workflow dispatch

**Jobs:**
- **lint-frontend**: ESLint and Prettier checks
- **test-frontend**: Run unit tests
- **build-frontend**: Build production bundle
- **build-and-push-image**: Build and push Docker image to GHCR
- **security-scan**: Trivy vulnerability scanning
- **deploy-staging**: Deploy to staging environment (develop branch)
- **deploy-production**: Deploy to production environment (main branch)

**Environment Variables Required:**
- `REGISTRY`: Container registry (default: ghcr.io)
- `IMAGE_NAME`: Image name (auto-set from repository)

**Secrets Required:**
- `STAGING_HOST`: Staging server hostname
- `STAGING_USER`: SSH username for staging
- `STAGING_SSH_KEY`: SSH private key for staging
- `PROD_HOST`: Production server hostname
- `PROD_USER`: SSH username for production
- `PROD_SSH_KEY`: SSH private key for production
- `PORTAINER_WEBHOOK_URL`: Portainer webhook URL

### 2. Pull Request Validation (`pr-validation.yml`)

**Validates pull requests** before merging.

**Triggers:**
- Pull requests to `main` or `develop`

**Checks:**
- Dependency installation
- Linting
- Type checking
- Unit tests
- Production build
- Bundle size analysis
- Automated PR comments with results

### 3. Docker Build and Scan (`docker-build.yml`)

**Weekly security scanning** and multi-configuration testing.

**Triggers:**
- Weekly schedule (Sunday at midnight)
- Manual workflow dispatch

**Jobs:**
- Build images for all configurations (dev, staging, prod)
- Test each image with health checks
- Vulnerability scanning with Trivy
- Dependency review

## Setup Instructions

### 1. Configure Repository Secrets

Go to **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add the following secrets:

#### Staging Environment
```
STAGING_HOST=staging.example.com
STAGING_USER=deploy
STAGING_SSH_KEY=<private-ssh-key>
```

#### Production Environment
```
PROD_HOST=spendguard.example.com
PROD_USER=deploy
PROD_SSH_KEY=<private-ssh-key>
PORTAINER_WEBHOOK_URL=https://portainer.example.com/api/webhooks/xxx
```

### 2. Enable GitHub Container Registry

1. Go to **Settings** → **Actions** → **General**
2. Under **Workflow permissions**, select:
   - ✅ Read and write permissions
   - ✅ Allow GitHub Actions to create and approve pull requests

### 3. Configure Environments

Go to **Settings** → **Environments** → **New environment**

Create two environments:

#### Staging
- **Name**: `staging`
- **Deployment branches**: `develop`
- **Environment URL**: `http://staging.spendguard.example.com`

#### Production
- **Name**: `production`
- **Deployment branches**: `main`
- **Environment URL**: `https://spendguard.example.com`
- **Protection rules**:
  - ✅ Required reviewers (1-2 people)
  - ✅ Wait timer: 5 minutes

## Usage

### Automatic Deployments

**Deploy to Staging:**
```bash
git checkout develop
git commit -m "feat: new feature"
git push origin develop
```

**Deploy to Production:**
```bash
git checkout main
git merge develop
git push origin main
```

### Manual Deployments

1. Go to **Actions** tab
2. Select **CI/CD Pipeline**
3. Click **Run workflow**
4. Select branch and environment
5. Click **Run workflow**

### View Deployment Status

1. Go to **Actions** tab
2. Click on the workflow run
3. View job details and logs
4. Check deployment status in **Environments** tab

## Workflow Customization

### Modify Deployment Strategy

Edit `ci-cd.yml` to change deployment method:

**Option 1: SSH Deployment (Current)**
```yaml
- name: Deploy via SSH
  uses: appleboy/ssh-action@v1.0.0
```

**Option 2: Portainer Webhook**
```yaml
- name: Deploy via Portainer
  run: curl -X POST ${{ secrets.PORTAINER_WEBHOOK_URL }}
```

**Option 3: Portainer API**
```yaml
- name: Deploy via API
  run: |
    curl -X POST \
      -H "X-API-Key: ${{ secrets.PORTAINER_API_KEY }}" \
      https://portainer.example.com/api/stacks/{id}/git/redeploy
```

### Add Additional Checks

Add new jobs to `ci-cd.yml`:

```yaml
code-quality:
  name: Code Quality Analysis
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - name: Run SonarQube
      uses: sonarsource/sonarqube-scan-action@master
```

### Modify Image Tags

Edit the `metadata-action` configuration:

```yaml
- name: Extract metadata
  id: meta
  uses: docker/metadata-action@v5
  with:
    tags: |
      type=ref,event=branch
      type=sha,prefix={{branch}}-
      type=semver,pattern={{version}}
      type=raw,value=latest,enable={{is_default_branch}}
      type=raw,value=stable,enable=${{ github.ref == 'refs/heads/main' }}
```

## Troubleshooting

### Workflow Fails at Build Step

**Check:**
- Node.js version compatibility
- Package.json scripts exist
- Dependencies are correctly specified

**Fix:**
```bash
# Locally test the build
cd budget-app
npm ci
npm run build
```

### Docker Push Fails

**Check:**
- GitHub token permissions
- Container registry authentication
- Image name format

**Fix:**
```yaml
# Ensure correct permissions in workflow
permissions:
  contents: read
  packages: write
```

### Deployment Fails

**Check:**
- SSH key is correct and has proper permissions
- Server is accessible
- Docker is running on server
- Environment variables are set

**Fix:**
```bash
# Test SSH connection
ssh -i ~/.ssh/deploy_key user@server

# Check Docker on server
docker ps
docker compose version
```

### Security Scan Fails

**Check:**
- Trivy can access the image
- Image exists in registry
- Vulnerabilities are within acceptable limits

**Fix:**
```yaml
# Adjust Trivy severity
- name: Run Trivy
  uses: aquasecurity/trivy-action@master
  with:
    severity: 'CRITICAL,HIGH'
    exit-code: '1'
```

## Best Practices

### Branch Strategy

- **main**: Production-ready code
- **develop**: Integration branch for features
- **feature/***: Feature branches
- **hotfix/***: Emergency fixes

### Commit Messages

Follow conventional commits:
```
feat: add new feature
fix: resolve bug
docs: update documentation
chore: update dependencies
ci: modify workflow
```

### Image Tagging

- Use SHA tags for traceability
- Use semantic versions for releases
- Avoid using `latest` in production

### Security

- Rotate SSH keys regularly
- Use environment-specific secrets
- Enable branch protection rules
- Require PR reviews before merging
- Keep dependencies updated

## Monitoring

### View Workflow Runs

```bash
# Using GitHub CLI
gh run list
gh run view <run-id>
gh run watch
```

### Check Deployment Status

```bash
# SSH to server
ssh user@server
cd /opt/spendguard
docker compose ps
docker compose logs -f budget-app
```

### Monitor Image Registry

```bash
# List images
gh api /user/packages/container/spendguard/versions

# View package details
gh api /user/packages/container/spendguard
```

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Deployment Guide](../DEPLOYMENT.md)
- [Server Setup Guide](../SERVER_SETUP.md)
