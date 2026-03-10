# CI/CD Implementation Plan Prompt

Create a **comprehensive implementation plan** for building a
**production-grade CI/CD workflow and deployment strategy** for a
full-stack application described in the MVP plan document (React/Vite
frontend, ASP.NET Core API, SQL Server, Docker, GitHub Actions,
containerized deployment). The plan should extend the CI/CD section of
the project planning document but adapt deployment to a **self-hosted
Ubuntu Linux server running Portainer** instead of a cloud platform.

The plan must also incorporate **best practices for developing and
deploying Angular-style frontend applications** such as SPA build
optimization, environment configuration, NGINX serving, and CI/CD build
practices typical for Angular deployments.

The output should be written as a **step-by-step architecture and
implementation guide**.

------------------------------------------------------------------------

# Requirements for the Plan

## 1. System Architecture Overview

Explain the full workflow from development to deployment:

Developer → GitHub Repository → GitHub Actions CI → Docker Registry →
Ubuntu Server → Portainer → Running Containers.

Describe how:

-   Backend API
-   Frontend SPA
-   SQL Server database
-   Docker images
-   GitHub Actions
-   Portainer

interact in the deployment pipeline.

Include an architecture diagram description.

------------------------------------------------------------------------

# 2. Repository Structure for CI/CD and Containers

Propose a repository layout that supports scalable CI/CD pipelines.

    /frontend
    /backend
    /docker
       Dockerfile.api
       Dockerfile.frontend
    /docker-compose.yml
    /docker-compose.prod.yml
    /nginx
       nginx.conf
    /.github/workflows
       ci-cd.yml

Explain why this structure works well for CI/CD.

------------------------------------------------------------------------

# 3. Angular (SPA) Development Best Practices

Even though the MVP currently references React, include **Angular-style
SPA best practices** applicable to any modern frontend.

### Project Architecture

-   Feature modules
-   Shared modules
-   Core services
-   Lazy loading
-   Smart vs presentational components

### Code Quality

-   ESLint
-   Prettier
-   strict TypeScript configuration
-   consistent folder structure

### Performance Optimization

-   tree-shaking
-   lazy-loaded routes
-   build optimization
-   bundle size control
-   caching strategies

### Environment Configuration

Explain environment files:

    environment.ts
    environment.dev.ts
    environment.staging.ts
    environment.prod.ts

Show how CI/CD injects environment variables during builds.

------------------------------------------------------------------------

# 4. Frontend Production Build Best Practices

Describe best practices for building SPA applications.

Include:

-   multi-stage Docker builds
-   production builds
-   minimized bundles
-   static asset compression
-   immutable caching headers
-   serving via NGINX

Provide example Dockerfile structure.

------------------------------------------------------------------------

# 5. NGINX Configuration for SPA Deployment

Explain how to configure NGINX to properly serve Angular/SPA apps.

Include:

-   SPA fallback routing
-   gzip compression
-   caching headers
-   static asset optimization

Provide a sample configuration.

------------------------------------------------------------------------

# 6. GitHub Actions CI/CD Workflow Plan

Design a workflow that includes the following stages:

### Trigger

-   push to `main`
-   pull request validation
-   manual deployment option

### Stage 1 --- Install and Build

-   restore backend dependencies
-   build ASP.NET API
-   install frontend dependencies
-   build frontend production bundle

### Stage 2 --- Linting

Run:

-   ESLint for frontend
-   dotnet analyzers or lint tools for backend

Fail pipeline on lint errors.

### Stage 3 --- Testing

Run:

-   backend unit tests (xUnit)
-   frontend tests if available

Generate test reports.

### Stage 4 --- Docker Image Build

Build images for:

    frontend
    api

Use:

-   multi-stage builds
-   deterministic builds
-   cache optimization

### Stage 5 --- Image Tagging

Tag images with:

-   commit SHA
-   semantic version
-   latest

Push to container registry such as:

-   GitHub Container Registry
-   Docker Hub

### Stage 6 --- Deployment

Explain how the pipeline deploys to the **Ubuntu server running
Portainer**.

Describe three approaches:

1.  **SSH Deployment**

```{=html}
<!-- -->
```
    docker compose pull
    docker compose up -d

2.  **Portainer Webhook**

Trigger stack redeploy webhook.

3.  **Portainer API**

Call API to update stack.

Recommend the most robust option.

------------------------------------------------------------------------

# 7. Docker Compose Deployment Strategy

Explain how to deploy services with Compose.

Example stack:

    frontend
    api
    sqlserver

Include environment variables and volume management.

------------------------------------------------------------------------

# 8. Ubuntu Server Setup Guide

Describe how to prepare the host:

Install:

    Docker
    Docker Compose
    Portainer

Configure:

-   container registry authentication
-   firewall
-   persistent volumes
-   reverse proxy if needed

------------------------------------------------------------------------

# 9. Secrets and Security Best Practices

Explain how to securely manage:

-   registry credentials
-   database connection strings
-   API secrets
-   SSH keys

Use:

-   GitHub Secrets
-   `.env` files
-   Docker secrets

------------------------------------------------------------------------

# 10. Deployment Reliability and Production Practices

Include guidance for:

-   health checks
-   rollback strategy
-   immutable container images
-   zero-downtime deployments
-   monitoring and logging
-   container resource limits

------------------------------------------------------------------------

# 11. Local Development Workflow

Explain how developers can run the project locally:

    docker compose up

or run frontend/backend independently for faster development.

------------------------------------------------------------------------

# 12. Deliverables Expected From the Plan

The response should include:

-   architecture explanation
-   CI/CD pipeline explanation
-   GitHub Actions workflow example
-   Dockerfiles
-   docker-compose example
-   NGINX configuration
-   deployment strategy for Portainer
-   security and operational best practices

The final output should read like a **production-ready DevOps
implementation blueprint**.
