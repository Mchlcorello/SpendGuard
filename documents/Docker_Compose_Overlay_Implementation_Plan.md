# Docker Compose Overlay Implementation Plan for SpendGuard

## 1. Architecture Overview

### Build and Runtime Flow
1. Build the Angular app in a Node.js build stage.
2. Copy the compiled static output into a lean NGINX runtime image.
3. Serve the Angular SPA with NGINX and health endpoint support.
4. Promote the same immutable image across environments, changing only overlay/environment config.

### Multi-Stage Separation
- **Build stage**: `node:20-alpine`, `npm ci`, `ng build`.
- **Runtime stage**: `nginx:alpine` with static assets and runtime env templating.

This keeps runtime images smaller, safer, and consistent across environments.

## 2. Recommended Repository Structure

```text
SpendGuard/
  budget-app/
    src/
      environments/
        environment.ts
        environment.development.ts
        environment.staging.ts
        environment.production.ts
    package.json
    angular.json
  compose/
    docker-compose.yml
    docker-compose.dev.yml
    docker-compose.staging.yml
    docker-compose.prod.yml
    Dockerfile
    .env.dev
    .env.staging
    .env.prod
    nginx/
      default.conf
      env.template.js
      40-envsubst-on-start.sh
```

## 3. Docker Strategy

### Production-Ready Dockerfile

```dockerfile
# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS build
WORKDIR /app

COPY budget-app/package*.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

COPY budget-app/ ./
ARG ANGULAR_CONFIGURATION=production
RUN npm run build -- --configuration=${ANGULAR_CONFIGURATION}

FROM nginx:1.27-alpine AS runtime
RUN apk add --no-cache gettext

COPY compose/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY compose/nginx/env.template.js /usr/share/nginx/html/assets/env.template.js
COPY compose/nginx/40-envsubst-on-start.sh /docker-entrypoint.d/40-envsubst-on-start.sh
RUN chmod +x /docker-entrypoint.d/40-envsubst-on-start.sh

COPY --from=build /app/dist/budget-app/browser /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget -q -O /dev/null http://localhost/health || exit 1
```

### Recommended NGINX Config (Angular SPA + Caching + Compression)

```nginx
server {
  listen 80;
  server_name _;
  root /usr/share/nginx/html;
  index index.html;

  gzip on;
  gzip_types text/plain text/css application/javascript application/json image/svg+xml;
  gzip_min_length 1024;

  add_header X-Frame-Options "SAMEORIGIN" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;

  location = /health {
    access_log off;
    return 200 "ok\n";
  }

  location = /assets/env.js {
    add_header Cache-Control "no-store";
    try_files $uri =404;
  }

  location ~* \.(js|css|png|jpg|jpeg|gif|svg|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public,max-age=31536000,immutable";
    try_files $uri =404;
  }

  location / {
    try_files $uri $uri/ /index.html;
    add_header Cache-Control "no-cache";
  }
}
```

### Runtime env injection (optional, recommended)

`compose/nginx/40-envsubst-on-start.sh`:

```bash
#!/bin/sh
set -eu
envsubst < /usr/share/nginx/html/assets/env.template.js > /usr/share/nginx/html/assets/env.js
```

`compose/nginx/env.template.js`:

```js
window.__env = {
  API_BASE_URL: "${API_BASE_URL}",
  APP_ENV: "${APP_ENV}"
};
```

### Image Tagging Strategy
- Immutable: `sha-<git_sha>`
- Release: `vX.Y.Z`
- Convenience moving tags: `staging-latest`, `prod-latest`
- Prefer digest-pinned deployment for production rollback and auditability.

## 4. Docker Compose Overlay Design

### Base Compose (`compose/docker-compose.yml`)
Common service definition only:

```yaml
services:
  budget-app:
    image: ${IMAGE_REPO}:${IMAGE_TAG}
    container_name: spendguard-budget-app
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    logging:
      driver: json-file
      options:
        max-size: "10m"
        max-file: "3"
    networks:
      - spendguard-network

networks:
  spendguard-network:
    driver: bridge
```

### Dev Overlay (`compose/docker-compose.dev.yml`)
Optimized for local iteration and live reload:

```yaml
services:
  budget-app:
    build:
      context: ..
      dockerfile: compose/Dockerfile
      args:
        ANGULAR_CONFIGURATION: development
    image: spendguard/budget-app:dev-local
    command: sh -c "npm ci && npm run start -- --host 0.0.0.0 --port 4200 --poll 2000"
    working_dir: /app
    ports:
      - "4200:4200"
    volumes:
      - ../budget-app:/app
      - /app/node_modules
    environment:
      APP_ENV: development
      API_BASE_URL: http://localhost:8081
```

### Staging Overlay (`compose/docker-compose.staging.yml`)

```yaml
services:
  budget-app:
    ports:
      - "8080:80"
    env_file:
      - .env.staging
```

### Prod Overlay (`compose/docker-compose.prod.yml`)

```yaml
services:
  budget-app:
    ports:
      - "80:80"
    env_file:
      - .env.prod
    read_only: true
    tmpfs:
      - /var/cache/nginx
      - /var/run
```

### How Merge Works
- `docker compose -f base -f overlay ...`
- Files are merged left to right.
- Later files override conflicting keys.
- Validate final merged config with:

```bash
docker compose -f compose/docker-compose.yml -f compose/docker-compose.prod.yml config
```

### Environment Commands
- Dev:
  - `docker compose -f compose/docker-compose.yml -f compose/docker-compose.dev.yml up --build`
- Staging:
  - `docker compose --env-file compose/.env.staging -f compose/docker-compose.yml -f compose/docker-compose.staging.yml up -d`
- Prod:
  - `docker compose --env-file compose/.env.prod -f compose/docker-compose.yml -f compose/docker-compose.prod.yml up -d`

## 5. Environment Configuration

### Angular Build Configurations
- Use `development`, `staging`, and `production` configurations in `angular.json`.
- Use `fileReplacements` for compile-time non-secret values.
- Keep secret values out of frontend bundles.

### Compose `.env` and Substitution
- Use `.env.dev`, `.env.staging`, `.env.prod` for:
  - `IMAGE_REPO`
  - `IMAGE_TAG`
  - `APP_ENV`
  - `API_BASE_URL`

### Secrets Management
- Never place secrets in Angular environment files or runtime `env.js`.
- Frontend should only hold public configuration.
- Store secrets in backend and secret managers (Vault / cloud secret services).

## 6. CI/CD Pipeline Integration

### Pipeline Steps
1. Install dependencies, lint, and test Angular app.
2. Build production Angular artifacts inside Docker build stage.
3. Build and tag Docker image (`sha`, `version`, optional moving env tags).
4. Push image to registry.
5. Deploy using environment-specific compose overlays.
6. Run post-deploy health/smoke checks.

### Promotion Workflow
1. **Dev**: automated from PR/main integration.
2. **Staging**: auto deploy from main branch with immutable tag.
3. **Prod**: manual approval promoting the exact same image digest from staging.

This avoids rebuilding between environments and improves traceability.

## 7. Deployment Strategy

### Zero/Low Downtime Options
For Compose-hosted deployments, use blue/green where possible:
1. Deploy new version as alternate stack (`blue` vs `green`).
2. Validate `/health` and smoke tests.
3. Switch reverse proxy/router to new stack.
4. Decommission old stack after soak period.

### Versioning and Rollback
- Keep release metadata: environment, image tag, digest, commit SHA, time.
- Roll back by redeploying previous known-good digest.
- Avoid mutable-only tags (`latest`) for production decisions.

## 8. Local Development Support

### Fast Local Workflow
- Use dev overlay with bind-mounted source and `ng serve`.
- Expose `4200` for local browser.
- Use polling (`--poll`) for reliable watch behavior on Windows/WSL.

### Optional Hybrid Flow
- Run Angular dev server locally.
- Use Compose only for dependent services if needed.

## 9. Best Practices Checklist

### Image Size Optimization
- Multi-stage build.
- Keep runtime image minimal (NGINX + static assets).
- Use `.dockerignore`.
- Avoid unnecessary build artifacts in runtime image.

### Security
- Read-only root filesystem in production where feasible.
- Add security headers in NGINX.
- Scan images (Trivy/Grype) in CI.
- Keep base images updated on a defined cadence.

### Logging and Monitoring
- Enable health endpoints and container healthchecks.
- Use bounded JSON-file logging or centralized log shipping.
- Add synthetic probes and alerting for frontend availability.

### Reproducible Builds
- `npm ci` with lockfile.
- Deterministic Docker build arguments.
- Immutable tags/digests for deployment.

## 10. Suggested Rollout Plan

1. Add overlay files and env files under `compose/`.
2. Refactor Dockerfile and NGINX config to final production form.
3. Implement runtime `env.js` and Angular runtime config loader.
4. Update CI to build once and push immutable tags.
5. Add staging deployment with health gates.
6. Add manual production approval + rollback runbook.

