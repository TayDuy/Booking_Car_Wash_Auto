# GitHub Project Board — AutoWash Pro

Columns: Backlog | Todo | In Progress | Review | Done

This document lists GitHub Issues to create for the project board. Each entry contains Title, Description, Acceptance Criteria, Assignee, Labels, Priority, and Story Points.

---

## Todo (Sprint 1 items)

### BE1-001: Initialize Spring Boot project
- Description: Scaffold a Maven Spring Boot 3 project (Java 21) with basic package structure and application entrypoint.
- Acceptance Criteria:
  - Maven project created with groupId/artifactId
  - Application starts locally (mvn spring-boot:run)
  - README includes run instructions
- Assignee: Backend Developer 1
- Labels: backend, infra, setup
- Priority: High
- Story Points: 2

### BE1-002: Configure application.yml and SQL Server profiles
- Description: Add application.yml templates for dev/staging/prod with SQL Server datasource placeholders and Flyway config.
- Acceptance Criteria:
  - application-dev.yml exists with SQL Server settings
  - Flyway configured to use migrations folder
  - Local run picks up dev profile
- Assignee: Backend Developer 1
- Labels: backend, infra
- Priority: High
- Story Points: 1

### BE1-003: Add dependencies (Web, Security, JPA, JWT, Flyway)
- Description: Add necessary Maven dependencies and lock versions.
- Acceptance Criteria:
  - pom.xml includes Spring Web, Spring Security, Spring Data JPA, JWT, Flyway, Lombok, Validation
  - Project builds successfully
- Assignee: Backend Developer 1
- Labels: backend, infra
- Priority: High
- Story Points: 1

### BE1-004: Setup DB connection and Flyway baseline
- Description: Create baseline Flyway migration that creates initial schema and Role table.
- Acceptance Criteria:
  - Flyway migration V1__baseline.sql present
  - Running app applies migration to local SQL Server docker
  - Role table exists
- Assignee: Backend Developer 1
- Labels: backend, db, infra
- Priority: High
- Story Points: 2

### BE1-005: Implement Role entity and repository
- Description: Create Role JPA entity, repository, and simple service to load roles.
- Acceptance Criteria:
  - Role entity mapped with id/name
  - RoleRepository provides findByName
  - Unit tests for repository
- Assignee: Backend Developer 1
- Labels: backend, db
- Priority: High
- Story Points: 1

### BE1-006: Implement User entity and repository
- Description: Create User entity with phone, email, password_hash and role relation.
- Acceptance Criteria:
  - User entity created and mapped
  - UserRepository CRUD operations implemented
  - Flyway migration includes User table
- Assignee: Backend Developer 1
- Labels: backend, db
- Priority: High
- Story Points: 2

### BE1-010: Implement JWT token provider & filters (basic)
- Description: Implement JWT generation and validation, authentication filter and security utilities.
- Acceptance Criteria:
  - JWT tokens can be generated and parsed
  - Simple filter extracts token and sets SecurityContext
  - Unit test for token provider
- Assignee: Backend Developer 1
- Labels: backend, security
- Priority: High
- Story Points: 3

### FE-COM-001: Initialize Vite React project with TypeScript and tooling
- Description: Scaffold frontend with Vite, TypeScript, ESLint, Prettier, Husky hooks.
- Acceptance Criteria:
  - vite project created and starts (npm run dev)
  - ESLint and Prettier configured
  - Husky pre-commit hook runs lint
- Assignee: Frontend Developer 1
- Labels: frontend, infra
- Priority: High
- Story Points: 2

### FE-COM-002: Configure Axios client and auth interceptor
- Description: Create Axios instance with baseURL and interceptor to attach JWT and refresh tokens.
- Acceptance Criteria:
  - axios client exported
  - interceptor refreshes token when 401 returned
  - environment variables for API base URL used
- Assignee: Frontend Developer 1
- Labels: frontend, infra
- Priority: High
- Story Points: 2

### FE-COM-003: Setup React Router and protected routes
- Description: Configure React Router v6 and implement ProtectedRoute component using auth state.
- Acceptance Criteria:
  - Routes protected by role checks
  - Unauthenticated users redirected to login
- Assignee: Frontend Developer 1
- Labels: frontend, infra
- Priority: High
- Story Points: 2

### FE-COM-004: Global state (Auth + React Query)
- Description: Implement global auth state and React Query provider for data fetching.
- Acceptance Criteria:
  - Auth context holds token and user info
  - React Query configured with cache and error handling
- Assignee: Frontend Developer 1
- Labels: frontend
- Priority: High
- Story Points: 3

### FE1-001: Setup customer app shell (header, footer)
- Description: Build responsive layout for customer portal.
- Acceptance Criteria:
  - Header and footer components implemented
  - Mobile and desktop responsive behavior verified
- Assignee: Frontend Developer 1
- Labels: frontend, ui
- Priority: High
- Story Points: 2

### FE1-002: Create Login page and connect to /auth/login
- Description: Implement login UI that calls backend login and stores tokens.
- Acceptance Criteria:
  - Login form validates input
  - Successful login stores tokens and redirects
  - Error displayed on failure
- Assignee: Frontend Developer 1
- Labels: frontend, auth
- Priority: High
- Story Points: 3

---

## Backlog (all remaining tasks)
### BE1-007: Implement DTOs and mappers for User (MapStruct)
- Description: Implement task BE1-007 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,code
- Priority: Medium
- Story Points: 1

### BE1-008: Implement password hashing utilities (bcrypt)
- Description: Implement task BE1-008 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,security
- Priority: High
- Story Points: 1

### BE1-009: Create RefreshToken entity and repository
- Description: Implement task BE1-009 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,db
- Priority: High
- Story Points: 1

### BE1-011: Implement AuthController endpoints (register/login/refresh/logout)
- Description: Implement task BE1-011 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,auth
- Priority: High
- Story Points: 3

### BE1-012: Setup OTP send/verify skeleton (SMS provider mock)
- Description: Implement task BE1-012 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,auth
- Priority: Medium
- Story Points: 2

### BE1-013: Implement security configuration (WebSecurityConfigurer)
- Description: Implement task BE1-013 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,security
- Priority: High
- Story Points: 2

### BE1-014: Create global exception handler (ControllerAdvice)
- Description: Implement task BE1-014 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,infra
- Priority: Medium
- Story Points: 1

### BE1-015: Implement UserService: create/update/find/verify
- Description: Implement task BE1-015 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,service
- Priority: High
- Story Points: 2

### BE1-016: Implement admin user management endpoints (CRUD)
- Description: Implement task BE1-016 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,admin
- Priority: Medium
- Story Points: 2

### BE1-017: Unit tests for AuthController and UserService
- Description: Implement task BE1-017 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,test
- Priority: Medium
- Story Points: 2

### BE1-018: Integrate springdoc-openapi and secure Swagger
- Description: Implement task BE1-018 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,docs
- Priority: Low
- Story Points: 1

### BE1-019: Implement logout and refresh token revocation
- Description: Implement task BE1-019 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,auth
- Priority: Medium
- Story Points: 1

### BE1-020: Implement AuditLog entity & service for user actions
- Description: Implement task BE1-020 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,db
- Priority: Medium
- Story Points: 2

### BE1-021: Integrate tests into CI pipeline
- Description: Implement task BE1-021 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 1
- Labels: backend,ci
- Priority: Medium
- Story Points: 1

### BE2-001: Flyway migrations for Branch, Service, LoyaltyTier
- Description: Implement task BE2-001 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: High
- Story Points: 1

### BE2-002: Implement Branch entity, repository, service
- Description: Implement task BE2-002 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: High
- Story Points: 1

### BE2-003: Implement Service entity, repository, service
- Description: Implement task BE2-003 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: High
- Story Points: 1

### BE2-004: Implement CustomerProfile entity & repository
- Description: Implement task BE2-004 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: High
- Story Points: 2

### BE2-005: Implement Vehicle entity & plate normalization util
- Description: Implement task BE2-005 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,domain
- Priority: High
- Story Points: 2

### BE2-006: Vehicle REST endpoints (CRUD) and validation
- Description: Implement task BE2-006 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,api
- Priority: High
- Story Points: 2

### BE2-007: Implement Slot model/service (granularity & capacity)
- Description: Implement task BE2-007 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,domain
- Priority: High
- Story Points: 3

### BE2-008: Implement Booking entity & repository with indexes
- Description: Implement task BE2-008 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: High
- Story Points: 2

### BE2-009: Implement BookingService with transactional checks
- Description: Implement task BE2-009 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,service
- Priority: High
- Story Points: 3

### BE2-010: BookingController endpoints & slot search API
- Description: Implement task BE2-010 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,api
- Priority: High
- Story Points: 2

### BE2-011: Implement Waitlist entity & logic
- Description: Implement task BE2-011 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,service
- Priority: Medium
- Story Points: 2

### BE2-012: Implement LPR webhook endpoint and matching
- Description: Implement task BE2-012 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,integration
- Priority: Medium
- Story Points: 2

### BE2-013: Implement Transaction entity & repository
- Description: Implement task BE2-013 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: High
- Story Points: 1

### BE2-014: Implement LoyaltyPointRecord and Loyalty service
- Description: Implement task BE2-014 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,service
- Priority: High
- Story Points: 3

### BE2-015: Loyalty endpoints: /loyalty/me, /redeem, /history
- Description: Implement task BE2-015 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,api
- Priority: High
- Story Points: 2

### BE2-016: Scheduled jobs: PointsExpiry & TierEvaluation
- Description: Implement task BE2-016 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,ops
- Priority: Medium
- Story Points: 3

### BE2-017: Implement Promotion entity & service
- Description: Implement task BE2-017 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,domain
- Priority: Medium
- Story Points: 2

### BE2-018: Promotion CRUD endpoints & dispatch job
- Description: Implement task BE2-018 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,api
- Priority: Medium
- Story Points: 2

### BE2-019: PromotionUse tracking and limits enforcement
- Description: Implement task BE2-019 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: Medium
- Story Points: 2

### BE2-020: Reports endpoints and CSV export
- Description: Implement task BE2-020 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,reporting
- Priority: Medium
- Story Points: 3

### BE2-021: Transactional reconciliation tasks
- Description: Implement task BE2-021 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,ops
- Priority: Low
- Story Points: 2

### BE2-022: Integration tests for booking/loyalty/promotion
- Description: Implement task BE2-022 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,test
- Priority: Medium
- Story Points: 3

### BE2-023: Add optimistic locking & reservation patterns
- Description: Implement task BE2-023 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: Medium
- Story Points: 2

### BE2-024: Expose metrics (Prometheus/OpenTelemetry)
- Description: Implement task BE2-024 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,ops
- Priority: Low
- Story Points: 1

### BE2-025: Create DB seed scripts for staging
- Description: Implement task BE2-025 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Backend Developer 2
- Labels: backend,db
- Priority: Low
- Story Points: 1

### FE1-003: Register & OTP pages and integration
- Description: Implement task FE1-003 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 1
- Labels: frontend,auth
- Priority: High
- Story Points: 2

### FE1-004: Customer Dashboard: upcoming booking, loyalty summary
- Description: Implement task FE1-004 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 1
- Labels: frontend,ui
- Priority: High
- Story Points: 3

### FE1-005: Profile page (edit preferences)
- Description: Implement task FE1-005 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 1
- Labels: frontend,ui
- Priority: Medium
- Story Points: 2

### FE1-006: Vehicle list UI and add-vehicle modal
- Description: Implement task FE1-006 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 1
- Labels: frontend,ui
- Priority: Medium
- Story Points: 1

### FE1-007: Booking confirmation screens and export
- Description: Implement task FE1-007 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 1
- Labels: frontend,ui
- Priority: Medium
- Story Points: 1

### FE1-008: Notification center / in-app notifications UI
- Description: Implement task FE1-008 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 1
- Labels: frontend,ui
- Priority: Low
- Story Points: 1

### FE1-009: Unit & E2E tests for auth and booking happy path
- Description: Implement task FE1-009 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 1
- Labels: frontend,test
- Priority: Medium
- Story Points: 3

### FE2-001: Vehicle Management pages (CRUD)
- Description: Implement task FE2-001 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,ui
- Priority: High
- Story Points: 2

### FE2-002: Booking flow implementation (search->slot->checkout)
- Description: Implement task FE2-002 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,ui
- Priority: High
- Story Points: 5

### FE2-003: SlotPicker component (calendar + time grid)
- Description: Implement task FE2-003 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,ui
- Priority: High
- Story Points: 4

### FE2-004: Redemption UI in checkout
- Description: Implement task FE2-004 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,ui
- Priority: High
- Story Points: 2

### FE2-005: Booking history page with filters
- Description: Implement task FE2-005 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,ui
- Priority: Medium
- Story Points: 2

### FE2-006: Loyalty dashboard page
- Description: Implement task FE2-006 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,ui
- Priority: Medium
- Story Points: 2

### FE2-007: Waitlist UI (position, ETA)
- Description: Implement task FE2-007 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,ui
- Priority: Medium
- Story Points: 1

### FE2-008: LPR check-in UI for customers
- Description: Implement task FE2-008 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,ui
- Priority: Low
- Story Points: 1

### FE2-009: E2E tests for booking/redemption/waitlist
- Description: Implement task FE2-009 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 2
- Labels: frontend,test
- Priority: Medium
- Story Points: 3

### FE3-001: Admin layout and role-based sidebar
- Description: Implement task FE3-001 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,ui
- Priority: High
- Story Points: 1

### FE3-002: User Management table (search, role assign)
- Description: Implement task FE3-002 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,ui
- Priority: High
- Story Points: 2

### FE3-003: Branch & Service management pages
- Description: Implement task FE3-003 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,ui
- Priority: High
- Story Points: 2

### FE3-004: Promotion builder UI with preview
- Description: Implement task FE3-004 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,ui
- Priority: Medium
- Story Points: 3

### FE3-005: Promotion dispatch controls and recipients viewer
- Description: Implement task FE3-005 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,ui
- Priority: Medium
- Story Points: 2

### FE3-006: Reporting dashboards with CSV export
- Description: Implement task FE3-006 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,ui
- Priority: Medium
- Story Points: 3

### FE3-007: Booking management calendar for managers
- Description: Implement task FE3-007 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,ui
- Priority: Medium
- Story Points: 2

### FE3-008: Audit log viewer with filters
- Description: Implement task FE3-008 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,admin
- Priority: Low
- Story Points: 2

### FE3-009: Admin E2E tests for admin flows
- Description: Implement task FE3-009 as specified in development plan.
- Acceptance Criteria:
  - Task implemented per API/DB contract
  - Unit/integration tests added where applicable
  - Code pushed and PR created
- Assignee: Frontend Developer 3
- Labels: frontend,test
- Priority: Low
- Story Points: 3

---

## In Progress

(Empty initially)

---

## Review

(Empty initially)

---

## Done

(Empty initially)

