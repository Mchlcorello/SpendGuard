# Personal Finance & Budget Tracking App -- MVP Plan

## Stack

-   React (Vite + TypeScript)
-   ASP.NET Core Web API
-   SQL Server (Dockerized)
-   JWT Authentication
-   xUnit + Moq
-   Docker
-   GitHub Actions
-   Azure Deployment

------------------------------------------------------------------------

# 🎯 MVP Goal

Deliver a production-style full-stack application demonstrating:

-   Clean architecture
-   Secure API design
-   Strong SQL usage
-   Authentication & authorization
-   Unit testing
-   Containerization
-   CI/CD
-   Cloud deployment

------------------------------------------------------------------------

# Phase 1 --- Backend Foundation (Week 1--2)

## Solution Structure (Clean Architecture Lite)

    BudgetApp.sln
     ├── BudgetApp.API
     ├── BudgetApp.Application
     ├── BudgetApp.Domain
     ├── BudgetApp.Infrastructure
     └── BudgetApp.Tests

### Responsibilities

**Domain** - Entities (User, Budget, Category, Transaction)

**Application** - Services / business logic - DTOs - Interfaces
(repositories)

**Infrastructure** - EF Core - SQL Server configuration - Repository
implementations

**API** - Controllers - Authentication configuration - Dependency
injection setup

------------------------------------------------------------------------

## Database Design (SQL Server)

### Tables

-   Users
-   Budgets
-   Categories
-   Transactions

### Requirements

-   Foreign keys
-   Indexes on:
    -   UserId
    -   BudgetId
    -   TransactionDate
-   At least one stored procedure:
    -   `GetMonthlySummary`

------------------------------------------------------------------------

## Core API Endpoints

### Auth

-   POST /api/auth/register
-   POST /api/auth/login

### Budgets

-   GET /api/budgets
-   POST /api/budgets
-   PUT /api/budgets/{id}
-   DELETE /api/budgets/{id}

### Transactions

-   GET /api/transactions?month=...
-   POST /api/transactions
-   DELETE /api/transactions/{id}

### Dashboard

-   GET /api/dashboard/monthly-summary

------------------------------------------------------------------------

## Authentication

-   JWT access tokens
-   Secure password hashing
-   Role-based authorization
-   Protect all endpoints except login/register

------------------------------------------------------------------------

# Phase 2 --- Business Logic & Background Worker (Week 3)

## Core Logic

-   Recalculate remaining budget when transaction is added
-   Validate budget limits
-   Business rules implemented in Application layer

## Background Worker (Hosted Service)

-   Runs daily
-   Generates monthly summary records
-   Logs summary stats

------------------------------------------------------------------------

# Phase 3 --- React Frontend (Week 4--5)

## Tech

-   Vite + React + TypeScript
-   React Router
-   Axios

## Pages

### Authentication

-   Login page
-   Register page

### Dashboard

-   Monthly summary
-   Chart visualization

### Budgets

-   Create / edit budgets
-   Display remaining amounts

### Transactions

-   Add transaction
-   List transactions
-   Filter by month

## Required Features

-   Protected routes
-   Auth context provider
-   API service wrapper
-   Error and loading handling

------------------------------------------------------------------------

# Phase 4 --- Testing (Week 6)

## Backend Tests (xUnit + Moq)

Test: - Budget creation logic - Transaction validation logic - Monthly
summary calculation - Authentication service logic

Target: - 10--20 meaningful unit tests

------------------------------------------------------------------------

# Phase 5 --- Dockerization (Week 6)

## Dockerfiles

-   API Dockerfile
-   React Dockerfile

## docker-compose.yml Services

-   API
-   SQL Server
-   Frontend

Run locally:

    docker-compose up

------------------------------------------------------------------------

# Phase 6 --- CI/CD with GitHub Actions (Week 7)

Workflow Steps: 1. Build backend 2. Run tests 3. Build frontend 4. Build
Docker images 5. Push to container registry 6. Deploy to Azure

------------------------------------------------------------------------

# Phase 7 --- Azure Deployment (Week 8)

Deploy using: - Azure App Service OR - Azure Container Apps

Use: - Environment variables - Secure connection strings - Production
configuration

------------------------------------------------------------------------

# README Requirements

Include: - Architecture diagram - Database schema diagram - API
documentation - Local Docker setup instructions - CI/CD explanation -
Azure deployment explanation - Design decisions and tradeoffs

------------------------------------------------------------------------

# MVP Required Features Summary

-   JWT Authentication
-   Budgets CRUD
-   Transactions CRUD
-   Monthly summary endpoint
-   SQL Server with indexing and stored procedure
-   Clean layered architecture
-   10+ unit tests
-   Dockerized
-   CI/CD pipeline
-   Azure deployment

------------------------------------------------------------------------

This project demonstrates competency in: C#, ASP.NET Core, REST APIs,
SQL Server, Authentication, Clean Architecture, Testing, Docker, CI/CD,
and Cloud Deployment.
