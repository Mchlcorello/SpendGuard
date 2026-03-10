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
