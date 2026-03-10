# Deployment Guide

This guide explains how to deploy the SpendGuard application using the CI/CD pipeline.

## Architecture Overview

```
Developer → GitHub → GitHub Actions → Docker Registry → Ubuntu Server → Portainer → Running Containers
```

### Components

- **Frontend**: Angular SPA served by NGINX
- **Docker Images**: Multi-stage builds pushed to GitHub Container Registry
- **GitHub Actions**: Automated CI/CD pipeline
- **Portainer**: Container management on Ubuntu server
- **Environments**: Development, Staging, Production

## Prerequisites

### GitHub Repository Secrets

Configure the following secrets in your GitHub repository settings:

#### Staging Environment
- `STAGING_HOST`: Staging server hostname/IP
- `STAGING_USER`: SSH username for staging server
- `STAGING_SSH_KEY`: Private SSH key for staging deployment

#### Production Environment
- `PROD_HOST`: Production server hostname/IP
- `PROD_USER`: SSH username for production server
- `PROD_SSH_KEY`: Private SSH key for production deployment
- `PORTAINER_WEBHOOK_URL`: Portainer webhook URL for stack updates

#### Container Registry
- `GITHUB_TOKEN`: Automatically provided by GitHub Actions

## Deployment Workflows

### 1. Automatic Deployments

#### Staging
- **Trigger**: Push to `develop` branch
- **Process**: 
  1. Lint and test frontend
  2. Build production bundle
  3. Build and push Docker image
  4. Security scan with Trivy
  5. Deploy to staging server via SSH
  6. Health check validation

#### Production
- **Trigger**: Push to `main` branch
- **Process**:
  1. Same as staging through security scan
  2. Deploy via Portainer webhook
  3. Fallback to SSH if webhook fails
  4. Health check validation
  5. Automatic rollback on failure

### 2. Manual Deployments

Trigger manual deployment via GitHub Actions UI:

1. Go to **Actions** tab
2. Select **CI/CD Pipeline** workflow
3. Click **Run workflow**
4. Choose environment (staging/production)
5. Click **Run workflow**

## Deployment Methods

### Method 1: Portainer Webhook (Recommended for Production)

**Setup:**
1. In Portainer, go to your stack
2. Enable webhook
3. Copy webhook URL
4. Add to GitHub secrets as `PORTAINER_WEBHOOK_URL`

**Advantages:**
- Zero-downtime deployments
- Managed by Portainer
- Simple and reliable

### Method 2: SSH Deployment

**Setup:**
1. Generate SSH key pair on your local machine
2. Add public key to server's `~/.ssh/authorized_keys`
3. Add private key to GitHub secrets
4. Ensure Docker and Docker Compose are installed on server

**Deployment Process:**
```bash
ssh user@server
cd /opt/spendguard
docker compose -f compose/docker-compose.yml -f compose/docker-compose.prod.yml pull
docker compose -f compose/docker-compose.yml -f compose/docker-compose.prod.yml up -d
```

### Method 3: Portainer API

**Setup:**
1. Generate API token in Portainer
2. Add to GitHub secrets
3. Update workflow to use API calls

**Example API call:**
```bash
curl -X POST \
  -H "X-API-Key: $PORTAINER_API_KEY" \
  https://portainer.example.com/api/stacks/{id}/git/redeploy
```

## Ubuntu Server Setup

### Initial Server Configuration

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Install Portainer
docker volume create portainer_data
docker run -d -p 8000:8000 -p 9443:9443 \
  --name portainer --restart=always \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v portainer_data:/data \
  portainer/portainer-ce:latest

# Create application directory
sudo mkdir -p /opt/spendguard
sudo chown $USER:$USER /opt/spendguard
cd /opt/spendguard

# Clone repository (or copy compose files)
git clone https://github.com/yourusername/SpendGuard.git .
```

### Configure Firewall

```bash
# Allow SSH, HTTP, HTTPS, Portainer
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 9443/tcp
sudo ufw enable
```

### Container Registry Authentication

```bash
# Login to GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin
```

### Create Environment Files

```bash
cd /opt/spendguard/compose

# Create production environment file
cat > .env.prod << EOF
IMAGE_REPO=ghcr.io/yourusername/spendguard
IMAGE_TAG=latest
APP_ENV=production
API_BASE_URL=https://api.spendguard.example.com
EOF
```

## Image Tagging Strategy

Images are tagged with multiple tags:

- **Branch**: `main`, `develop`
- **SHA**: `main-abc123def`, `develop-xyz789`
- **Semantic Version**: `v1.0.0`, `v1.2.3`
- **Latest**: `latest` (only for main branch)

### Promoting Images

```bash
# Pull specific SHA for production
export IMAGE_TAG=main-abc123def
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Rollback Procedure

### Quick Rollback

```bash
# On the server
cd /opt/spendguard/compose

# Set previous working image tag
export IMAGE_TAG=main-previous-sha

# Pull and deploy
docker compose -f docker-compose.yml -f docker-compose.prod.yml pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Via Portainer

1. Go to Stacks → SpendGuard
2. Click **Editor**
3. Change `IMAGE_TAG` to previous version
4. Click **Update the stack**

## Health Checks and Monitoring

### Manual Health Check

```bash
# Check application health
curl http://your-server/health

# Check container status
docker ps

# View logs
docker compose logs -f budget-app
```

### Automated Monitoring

The CI/CD pipeline includes:
- Health check after deployment
- Automatic rollback on failure
- Security scanning with Trivy
- Dependency review for PRs

## Security Best Practices

### Secrets Management

- ✅ Use GitHub Secrets for sensitive data
- ✅ Never commit secrets to repository
- ✅ Rotate SSH keys regularly
- ✅ Use environment-specific `.env` files
- ✅ Keep `.env` files out of version control

### Image Security

- ✅ Scan images with Trivy before deployment
- ✅ Use minimal base images (Alpine)
- ✅ Run containers as non-root when possible
- ✅ Enable read-only filesystem in production
- ✅ Keep base images updated

### Network Security

- ✅ Use firewall rules
- ✅ Enable HTTPS with SSL certificates
- ✅ Use reverse proxy (Traefik/Caddy) for SSL termination
- ✅ Implement rate limiting
- ✅ Use private networks for container communication

## Troubleshooting

### Deployment Fails

```bash
# Check GitHub Actions logs
# View in GitHub UI under Actions tab

# SSH to server and check
docker compose logs budget-app
docker ps -a
```

### Image Pull Fails

```bash
# Re-authenticate with registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Verify image exists
docker pull ghcr.io/yourusername/spendguard:latest
```

### Container Won't Start

```bash
# Check logs
docker logs spendguard-budget-app

# Verify environment variables
docker exec spendguard-budget-app env

# Check health endpoint
docker exec spendguard-budget-app wget -q -O- http://localhost/health
```

### Portainer Webhook Not Working

```bash
# Test webhook manually
curl -X POST $PORTAINER_WEBHOOK_URL

# Check Portainer logs
docker logs portainer
```

## Local Development

### Run with Docker Compose

```bash
cd compose
docker compose -f docker-compose.yml -f docker-compose.dev.yml up
```

### Run without Docker

```bash
cd budget-app
npm install
npm start
```

Access at: http://localhost:4200

## CI/CD Pipeline Stages

### Stage 1: Lint
- ESLint for TypeScript/JavaScript
- Prettier for code formatting
- Fails pipeline on errors

### Stage 2: Test
- Unit tests with Vitest
- Test coverage reports
- Fails pipeline on test failures

### Stage 3: Build
- Production build with Angular CLI
- Bundle optimization
- Tree shaking and minification

### Stage 4: Docker Build
- Multi-stage Docker build
- Build cache optimization
- Push to GitHub Container Registry

### Stage 5: Security Scan
- Trivy vulnerability scanning
- SARIF report upload to GitHub Security
- Dependency review for PRs

### Stage 6: Deploy
- Environment-specific deployment
- Health check validation
- Automatic rollback on failure

## Performance Optimization

### Build Optimization
- Multi-stage Docker builds
- Layer caching with GitHub Actions cache
- Minimal runtime images

### Runtime Optimization
- NGINX gzip compression
- Static asset caching (1-year)
- Immutable cache headers
- CDN-ready configuration

## Maintenance

### Regular Tasks

**Weekly:**
- Review security scan results
- Check container resource usage
- Review application logs

**Monthly:**
- Update base Docker images
- Rotate SSH keys
- Review and update dependencies
- Test rollback procedures

**Quarterly:**
- Disaster recovery drill
- Review and update documentation
- Performance optimization review

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review server logs: `docker compose logs`
3. Check Portainer dashboard
4. Review this documentation
5. Contact DevOps team
