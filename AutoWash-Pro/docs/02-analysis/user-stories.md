# User Stories — AutoWash Pro

This file organizes user stories into epics and includes acceptance criteria and suggested estimates (story points). Source: SRS (Topic.md).

## Epic: Onboarding & Profile

US-001 (5) - As a Customer, I want to register with my phone and verify via OTP so I can use the service.
Acceptance: OTP sent; user cannot book until verified; user record created.

US-002 (3) - As a Customer, I want to update my profile so my contact info is current.
Acceptance: PUT /customers/me persists changes and returns updated profile.

US-003 (3) - As a Customer, I want to add and manage vehicles so bookings are tied to a plate.
Acceptance: CRUD vehicles with validation; prevent deletion with active bookings.

## Epic: Booking Core

US-010 (8) - As a Customer, I want to search branches and available slots so I can choose a convenient time.
Acceptance: Slot search returns available slots with capacity and priority information.

US-011 (8) - As a Customer, I want to create bookings within my tier window so I can reserve services.
Acceptance: Booking created if within window and capacity; points estimation returned.

US-012 (5) - As a Customer, I want to cancel or reschedule bookings so I can change plans.
Acceptance: Cancellation rules enforced; refund/point adjustments applied if applicable.

## Epic: Loyalty & Promotions

US-020 (13) - As a Customer, I want to earn points for transactions and view tier progress.
Acceptance: Points awarded on transaction; loyalty dashboard displays balance and progress bar.

US-021 (8) - As a Customer, I want to redeem points for discounts or free services at checkout.
Acceptance: Redemption reduces points and applies discounts in final price.

US-022 (8) - As an Admin, I want to create promotions targeted by tier/branch/recency.
Acceptance: Promotion created, validates target criteria, and scheduled for dispatch.

## Epic: Admin & Manager

US-030 (13) - As an Admin, I want to manage loyalty tiers and rules so I can tune accrual and booking windows.
Acceptance: CRUD tiers with validation and audit logging.

US-031 (8) - As a Manager, I want to view branch bookings and KPIs so I can manage operations.
Acceptance: Branch-level dashboard with filters and export.

## Epic: Integrations & Operations

US-040 (5) - As a System, I want to accept LPR events so vehicles can be auto-checked in.
Acceptance: LPR webhook endpoint records events and matches to customer if possible.

## Prioritization
- Sprint 1: US-001, US-003, US-010 (Auth, vehicles, slot search)
- Sprint 2: US-011, US-012 (Booking create/reschedule/cancel)
- Sprint 3: US-020, US-021 (Points awarding & redemption)
- Sprint 4: US-030, US-031 (Admin & Manager dashboards)
