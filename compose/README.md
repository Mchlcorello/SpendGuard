# SpendGuard Docker Compose Setup

This directory contains a **multi-environment Docker Compose overlay setup** for the SpendGuard Budget Application with NGINX.

## Architecture

### Build and Runtime Flow
1. Build the Angular app in a Node.js build stage
2. Copy compiled static output into a lean NGINX runtime image
3. Serve the Angular SPA with NGINX and health endpoint support
4. Promote the same immutable image across environments, changing only overlay/environment config

### Key Features
- **Multi-stage Docker build**: Node.js builder + NGINX runtime
- **Overlay pattern**: Base config + environment-specific overlays (dev, staging, prod)
- **Runtime environment injection**: Dynamic config via `env.js` without rebuilding
- **Optimized NGINX**: Gzip compression, caching, security headers
- **Health checks**: Built-in monitoring at `/health` endpoint

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

## File Structure

```
compose/
├── docker-compose.yml           # Base configuration (common settings)
├── docker-compose.dev.yml       # Development overlay
├── docker-compose.staging.yml   # Staging overlay
├── docker-compose.prod.yml      # Production overlay
├── .env.dev                     # Development environment variables
├── .env.staging                 # Staging environment variables
├── .env.prod                    # Production environment variables
├── Dockerfile                   # Multi-stage build
├── .dockerignore               # Build optimization
└── nginx/
    ├── default.conf            # NGINX server configuration
    ├── env.template.js         # Runtime environment template
    └── 40-envsubst-on-start.sh # Startup script for env injection
```

## Environment Commands

### Development (with live reload)

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

Access at: **http://localhost:4200**

Features:
- Live reload with bind-mounted source code
- Angular dev server with polling for Windows/WSL
- Development build configuration

### Staging

```bash
docker compose --env-file .env.staging -f docker-compose.yml -f docker-compose.staging.yml up -d
```

Access at: **http://localhost:8080**

### Production

```bash
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d
```

Access at: **http://localhost:80**

Features:
- Read-only root filesystem
- Optimized production build
- Enhanced security settings

## Common Operations

### View Logs

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs -f budget-app
```

### Stop Services

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml down
```

### Validate Merged Configuration

Before deploying, validate the final merged config:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml config
```

### Build Image Only

```bash
docker build -f Dockerfile -t spendguard/budget-app:v1.0.0 --build-arg ANGULAR_CONFIGURATION=production ..
```

## Environment Variables

Each `.env` file contains:

- **IMAGE_REPO**: Docker image repository
- **IMAGE_TAG**: Image tag (e.g., `dev-local`, `staging-latest`, `v1.0.0`)
- **APP_ENV**: Application environment name
- **API_BASE_URL**: Backend API endpoint

These are injected at runtime via `env.js` without rebuilding the image.

## Runtime Environment Injection

The setup uses NGINX's `envsubst` to inject environment variables at container startup:

1. `env.template.js` contains placeholders: `${API_BASE_URL}`, `${APP_ENV}`
2. `40-envsubst-on-start.sh` runs on container start
3. Creates `/assets/env.js` with actual values
4. Angular app loads `window.__env` at runtime

This allows the **same Docker image** to run in different environments with different configurations.

## NGINX Configuration

`nginx/default.conf` includes:

- **Gzip compression** for text/css/js/json/svg
- **Static asset caching**: 1-year expiration with immutable cache control
- **Security headers**: X-Frame-Options, X-Content-Type-Options, Referrer-Policy
- **Angular SPA routing**: Fallback to index.html for all routes
- **Health endpoint**: `/health` returns 200 OK
- **No-cache for env.js**: Ensures fresh config on reload

## Image Tagging Strategy

- **Immutable**: `sha-<git_sha>` (recommended for production)
- **Release**: `v1.0.0`, `v1.0.1`
- **Environment tags**: `dev-latest`, `staging-latest`, `prod-latest`
- **Best practice**: Use digest-pinned deployments for production rollback

## CI/CD Integration

### Recommended Pipeline

1. Build once with production configuration
2. Tag image with commit SHA and version
3. Push to registry
4. Deploy to staging with staging overlay
5. Run smoke tests
6. Promote same image to production (manual approval)

### Example Build Command

```bash
docker build -f compose/Dockerfile \
  -t spendguard/budget-app:sha-abc123 \
  -t spendguard/budget-app:v1.0.0 \
  --build-arg ANGULAR_CONFIGURATION=production \
  .
```

## Deployment Strategy

### Zero-Downtime Deployment

For production, use blue/green deployment:

1. Deploy new version as alternate stack
2. Validate `/health` endpoint
3. Switch traffic to new stack
4. Decommission old stack after validation

### Rollback

Roll back by redeploying previous known-good image digest:

```bash
# Update .env.prod with previous IMAGE_TAG
docker compose --env-file .env.prod -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## Security Best Practices

- ✅ Read-only root filesystem in production
- ✅ Security headers in NGINX
- ✅ Minimal runtime image (Alpine-based)
- ✅ No secrets in frontend bundles
- ✅ Bounded logging (10MB max, 3 files)
- 🔒 Scan images with Trivy/Grype in CI
- 🔒 Keep base images updated

## Troubleshooting

### Container won't start

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml logs budget-app
```

### Build fails

- Ensure you're in the `compose` directory
- Verify `../budget-app/` exists with `package.json`
- Check Docker BuildKit is enabled

### Port already in use

Change port mapping in the environment-specific overlay file.

### Environment variables not applied

- Verify `.env` file is loaded with `--env-file` flag
- Check `env.js` inside container: `docker exec spendguard-budget-app cat /usr/share/nginx/html/assets/env.js`

## Local Development

For fastest local development without Docker:

```bash
cd ../budget-app
npm install
npm start
```

Access at: **http://localhost:4200**

Use Docker Compose dev overlay only when you need to test the full containerized setup.
