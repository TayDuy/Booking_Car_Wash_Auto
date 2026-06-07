<<<<<<< Updated upstream
# AutoWash Pro — Requirements Specification

## Project Overview

AutoWash Pro is a cloud-ready, enterprise-grade Smart Automated Car & Motorbike Wash Management System designed to enable advanced booking, prioritized queueing, multi-tier loyalty programs, targeted promotions, and operator administration tools. It aims to increase customer retention and lifetime value while improving operational efficiency across branch locations. The system will provide a responsive single-page web application (React + Vite) for customers and staff and a RESTful backend service (Spring Boot 3, Java 21) backed by SQL Server for transactional data. Security is enforced with JWT-based authentication and role-based access control (RBAC). The platform is designed for deployment on managed cloud infrastructure (Azure or AWS) and is extensible to integrate with License Plate Recognition (LPR) systems and third-party notification providers (SMS/Email).

The initial release targets three primary roles: Customer, Manager, and Admin. A Staff role is planned for future versions and the architecture anticipates easy role extension with least-privilege design.

## Actors

| Actor | Description | Primary Permissions |
|---|---|---|
| Customer | End-user who owns vehicles and requests wash services | Register, authenticate, manage profile, add/manage vehicles, search branches & slots, create/reschedule/cancel bookings, view history, redeem loyalty points, receive promotions/notifications |
| Manager | Branch-level operator responsible for day-to-day operations | View/manage branch bookings, manage walk-in/check-ins, view branch metrics/reports, assist customers, override bookings within branch policy |
| Admin | System-level administrator | Manage users/roles, configure branches/services, create/edit/delete loyalty tiers and promotions, configure global policies, view audit logs and system reports |

Note: Staff is anticipated; when introduced, Staff will have scoped permissions for check-ins, station operation, and handling customer interactions but will not have administrative or promotion-management capabilities.

## Functional Requirements

This section enumerates the system's functional requirements, each with a brief description and acceptance criteria. Requirements are prioritized for implementation planning.

| ID | Requirement | Description | Acceptance Criteria |
|---|---|---:|---|
| FR-1 | Customer Registration & Authentication | Support phone-based registration with OTP verification and password. Provide login, logout, and token refresh. | Users can register with phone, receive OTP, verify account, and subsequently log in. Unverified users cannot create bookings. JWT issued on login with refresh token support. |
| FR-2 | Profile & Vehicle Management | Allow customers to maintain profile and register multiple vehicles with license plates and optional nicknames. | Customers can CRUD vehicles. License plates validated and unique per branch. Deleting a vehicle with active bookings is blocked. |
| FR-3 | Branch & Service Catalog | Admins can define branches and the services offered (duration, price, capacity). Customers can browse branches and services. | GET endpoints return branches and services. Admins can create/update branch metadata and service definitions. |
| FR-4 | Slot Search & Availability | Provide an API and UI to query available time slots per branch and service for a selected date; factor in capacity and service durations. | Slot search shows available slots, remaining capacity, and priority indicators. Results consistent across concurrent requests. |
| FR-5 | Booking Lifecycle | Enable customers to create, confirm, reschedule, and cancel bookings. Enforce booking windows based on loyalty tier. | Booking creation validates capacity, booking window, no overlap for same vehicle; returns 201 on success. Reschedule/cancel endpoints enforce cancellation policy; notifications sent on change. |
| FR-6 | Capacity & Waitlist Management | Enforce per-slot capacity and maintain a prioritized waitlist when slots are full. | If capacity exceeded, booking is rejected or waitlisted according to configuration. Waitlist entries ranked by loyalty tier and timestamp; promotions to confirmed booking follow defined confirmation windows. |
| FR-7 | Loyalty Engine | Award points for spend and visits; maintain point ledger with expiry; support monthly auto-evaluation for tier upgrades/downgrades. | Transactions generate LoyaltyPointRecord entries. Scheduled job evaluates tiers monthly and updates Customer profiles with audit logs and notifications. |
| FR-8 | Redemption & Perks | Enable customers to redeem points for discounts, free services, or add-ons. Admins configure redemption rules and limits. | Redemption request validates available points and perk availability. Successful redemption adjusts point ledger and booking price. |
| FR-9 | Promotions & Targeting | Admins create targeted promotions using criteria (tier, last_visit_days, branch). Promotions schedule and dispatch to eligible customers. | Promotions created by Admins include criteria JSON; dispatch job selects recipients and creates notification tasks. Tracking of per-user promotion uses enforced. |
| FR-10 | Transaction Logging & Export | Log bookings, transactions, points awarded/redeemed, and promotion dispatch events. Support export in CSV/Excel. | Admins can export filtered transaction and booking logs. All changes to financial or loyalty state are persisted and auditable. |
| FR-11 | LPR Integration (Optional) | Accept LPR events and match license plates to customers for auto check-in. | Webhook endpoint accepts LPR events with idempotency; matched bookings can be auto-checked-in or presented to Manager for confirmation. |
| FR-12 | Notifications | Support in-app notifications and integrations for SMS/Email. Provide retries and dead-letter handling. | Notification system queues messages; transient failures retried; failures logged; users see history of in-app notifications. |
| FR-13 | RBAC & Security | Enforce role-based authorization for all sensitive endpoints. | Roles enforced via Spring Security annotations. Admin-only endpoints return 403 for other roles. Audit log for privilege changes. |
| FR-14 | Admin Console & Reporting | Admins and Managers access dashboards and reporting tools with filters and exports. | Dashboards show KPIs (utilization, LTV, tier distribution). Reports are exportable and support date-range queries. |

## Non-Functional Requirements

These requirements ensure the system meets performance, security, reliability, and maintainability expectations.

Security
- All API endpoints are served over HTTPS.
- Authentication via JWT (short-lived access tokens + refresh tokens). Refresh tokens persisted to allow revocation.
- Passwords stored as secure hashes (bcrypt or Argon2). Secrets stored in cloud Key Vault/Secrets Manager.
- Role claims embedded in JWT and validated server-side; critical actions audited.
- Input validation and output encoding to prevent injection and XSS vulnerabilities.

Reliability
- Critical operations (booking creation, point updates) are transactional and idempotent where applicable.
- Retry policies for transient external calls (SMS provider, email).
- Scheduled tasks (tier evaluation, expiry) are resilient and support idempotent re-runs.

Availability
- Target availability: 99.5% for API during business hours.
- Architecture supports horizontal scaling of stateless API instances behind load balancers; database configured for high availability via managed services.

Maintainability
- Follow clean architecture: controllers -> services -> repositories. Business rules centralized in service layer.
- Use Flyway for database migrations and semantic versioning for APIs (/api/v1).
- Comprehensive unit and integration tests; code coverage targets for core modules defined in test plan.

Scalability
- Stateless microservice-like backend allows horizontal scaling. Use Redis for caching hot reads (slot availability, promotion lists) to reduce DB load.
- Read replicas recommended for reporting workloads.

Performance
- Typical slot search and tier-priority decisions must respond under 1 second under normal load.
- Use pagination for listing endpoints and indexing strategies for reporting queries.

Observability
- Implement structured logging (JSON) and centralized log collection (Application Insights / CloudWatch / ELK).
- Expose metrics (Prometheus/OpenTelemetry) and health endpoints (/health, /metrics) for monitoring.

Privacy and Compliance
- PII is stored securely and exported only with user consent for analytics. Data retention policies configurable at branch or global level.
- Support data export and deletion requests for compliance with local regulations.

Internationalization
- All user-facing strings externalized for i18n. Dates and times localized according to branch timezone.

## Constraints

- Database: SQL Server is the mandated RDBMS for transactional data; schema design must account for SQL Server types and indexing strategies.
- Payment Processing: Online payment and refund processing are out of scope for the initial release.
- Hardware Integrations: Direct hardware drivers or on-prem controllers beyond event contract for LPR are out of scope.
- Team: Implementation expected by a 5-person development team; planning and deliverables sized accordingly.
- Deployment Environments: Production deployment targets Azure or AWS managed services; architecture must be cloud-agnostic where possible.

## Assumptions

- OTP and notification delivery rely on third-party providers (SMS gateway, email service); their availability and SLAs will be considered in design and retry/backoff strategies.
- Branch capacities, service durations, and pricing are configured by Admins; no need for automatic dynamic capacity learning in initial release.
- Customers consent to collection of usage data for research purposes; surveys and analytics are opt-in.
- LPR devices (if used) send events reliably to a webhook endpoint; the system will implement idempotency and retry mechanisms for webhook processing.
- Timezones: Each branch defines its timezone; booking UIs and scheduling logic normalize dates/times to branch local time.

## Acceptance Criteria and Traceability

- Each FR must have at least one automated integration test that validates the end-to-end flow (API + DB) and one unit test exercising the service-level business rule.
- All APIs must be documented using OpenAPI/Swagger and versioned with /api/v1.
- Critical business rules (booking window, priority queuing, point expiry) must be traceable to the corresponding acceptance tests and illustrated in the design docs.

## Appendix: Terminology

- Booking Window: Maximum number of days in advance a customer may create a booking; configurable per loyalty tier.
- Waitlist: Queue for customers when a desired slot has reached capacity, ordered by priority and timestamp.
- LoyaltyTier: A defined membership level (Member, Silver, Gold, Platinum) with attributes such as booking_window_days, accrual_rate, and perks.
- LoyaltyPointRecord: Immutable ledger entries recording point awards and deductions with expiry dates.

---

This Requirements Specification is based on the authoritative SRS (Topic.md) and is intended to serve as the contract for implementation, testing, and acceptance of the AutoWash Pro system. Any changes to scope, business rules or acceptance criteria must be recorded via the approval workflow and reflected in an updated version of this document.
=======
# AutoWash Pro — requirements.md

## Project Overview
AutoWash Pro is a smart automated car & motorbike wash management system providing advanced booking, tiered loyalty, priority queuing, admin configuration, and analytics. Backend: Java 21 + Spring Boot 3; Frontend: React + Vite. DB: SQL Server. Deploy to Azure/AWS. RBAC with Customer, Manager, Admin (extendable to Staff).

## Business Goals
- Increase repeat visits and LTV via loyalty tiers and promotions
- Reduce manual queueing and improve throughput with priority booking
- Enable data-driven promotions and analytics
- Provide admin tools for branches and campaigns

## Scope
Core booking, loyalty, promotions, admin analytics, LPR integration optional, REST API, web UI.

## In Scope
- Registration, authentication (JWT)
- Customer profiles & vehicles
- Tiered loyalty engine (accrual, expiry, auto-upgrade/downgrade)
- Tier-based booking windows & priority queue
- Admin UI for tiers, promotions, branches
- Reporting & export
- Notifications (in-app, SMS/email hooks)
- SQL Server schema and migrations

## Out Of Scope
- Payment gateway integration (explicitly excluded)
- Refund processing
- On-prem hardware drivers (beyond LPR event contract)

## Actors

| Actor | Description | Permissions |
|---|---:|---|
| Customer | Vehicle owner who books services | Register/login, manage profile/vehicles, book/cancel, view history, redeem points |
| Manager | Branch operator / shift lead | Manage bookings, view branch metrics, approve promotions (branch scope) |
| Admin | System administrator | Configure tiers, promotions, global reports, user/branch management |

Note: System is designed to add Staff role later with permissions subset (e.g., check-in, operate stations).

## Functional Requirements

| ID | Requirement | Description | Priority |
|---|---|---:|---:|
| FR-1 | Customer Registration & Profile | Register via phone, verify OTP, add vehicles, manage profile | High |
| FR-2 | Booking System | Tier-based advanced booking windows, limited slots, cancellations | High |
| FR-3 | Priority Queueing | Higher tiers get earlier slots & queue priority | High |
| FR-4 | Loyalty Engine | Points for spend/visits, monthly auto-upgrades/downgrades, expiry | High |
| FR-5 | Redemption | Points → discounts/free services/add-on redemptions | High |
| FR-6 | Tier Management (Admin) | Create/edit tiers, accrual rates, perks, auto rules | High |
| FR-7 | Promotions | Targeted campaigns (e.g., Silver+), scheduling & limits | Medium |
| FR-8 | Transaction Logging | Store booking/transaction histories for audit & export | High |
| FR-9 | Analytics & Reports | Repeat rate, LTV, tier distribution, promotion performance | Medium |
| FR-10 | LPR Integration (Optional) | Match plate to customer, auto-checkin | Low |
| FR-11 | Notifications | Email/SMS/in-app notifications for booking and promotions | Medium |
| FR-12 | RBAC & Security | JWT, Spring Security, role-based endpoints | High |
| FR-13 | Admin UI | Manage branches, services, staff (future), promotions | High |
| FR-14 | Export Data | CSV/Excel exports for analytics | Medium |

## Non-Functional Requirements
- Security: JWT auth, HTTPS, secure storage of PII, least-privilege RBAC, hashing of secrets.
- Reliability: ACID transactions for bookings/points; retries for external calls.
- Availability: 99.5% SLA target; read replicas for reporting.
- Maintainability: Layered, modular codebase, clear API contracts, versioning (/api/v1).
- Scalability: Use stateless services behind load balancers; database scaling via read replicas and partitioning.
- Performance: Booking queries and tier-priority decisions < 1s for normal load.

## Assumptions
- Phone OTP service available (3rd-party)
- Branch capacities are predefined and configured per branch
- Offline/edge devices send LPR events via reliable queue (e.g., Azure Service Bus)

## Constraints
- No payment/refund implementation
- SQL Server required (on-prem or managed)
- Team of 5 with parallel backend/frontend workstreams
>>>>>>> Stashed changes
