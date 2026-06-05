# Software Requirements Specification (SRS)

**Project Code:** SU26SWP01

**Title:** AutoWash Pro — Smart Automated Car Wash Management System with Advance Booking & Loyalty Program

**Submitted by:** VanTTN2

**Responsible:** (TBD)

**Date:** 2026-06-04

---

## Table of Contents
1. Introduction
2. Goals and Scope
3. Stakeholders and Primary Actors
4. System Overview
5. Functional Requirements
6. Data Model / Main Entities
7. Non-Functional Requirements (summary)
8. Constraints and Assumptions
9. Research Questions & Objectives
10. Project Plan and Timeline
11. Acceptance Criteria & Deliverables
12. Appendix: Survey & Log Fields

---

## 1. Introduction
This document captures the software requirements for AutoWash Pro — a smart, automated car (and motorbike) wash management system that provides advanced booking, a multi-tier loyalty program, and operator administration tools. The system aims to increase customer retention and lifetime value through personalized rewards, tiered benefits, and digital tracking of transactions and loyalty points.

## 2. Goals and Scope
- Implement an integrated booking and loyalty management platform for car/motorbike wash businesses.
- Provide multi-tier loyalty (e.g., Member / Silver / Gold / Platinum) with auto-upgrade/downgrade logic.
- Enable tier-based priority booking windows and priority queues.
- Provide admin tools for configuring tier rules, point rates, perks, and targeted promotions.
- Collect usage data for research (surveys, synthetic logs) to study factors that influence tier progression and retention.

Out of scope: Online payment processing and refund management (cannot be implemented by the team).

## 3. Stakeholders and Primary Actors
- Customers (vehicle owners) — create accounts, book washes, view points & history, redeem rewards.
- Admins / Wash Operators — configure tiers, promotions, monitor operations and analytics.
- System (automated processes such as loyalty engine, queue manager).

## 4. System Overview
AutoWash Pro integrates booking, loyalty, and optional LPR (License Plate Recognition) automation to: 
- Track points, visits and spend per customer
- Apply tier benefits at booking and checkout
- Allow admins to run targeted promotions and analyze program performance

## 5. Functional Requirements
Each requirement includes a short description and acceptance criteria.

FR-1: Customer Registration & Profile
- Users register with phone number and optionally link license plate(s).
- Must store contact, vehicle(s), and basic preferences.
- Acceptance: Users can register, verify phone, and add a vehicle.

FR-2: Booking System
- Advanced booking windows depend on tier (example: Member 7 days, Silver 10, Gold 12, Platinum 14).
- Priority queueing: higher tiers get earlier access to limited slots.
- Acceptance: Tier-based booking window enforced and queue priority applied.

FR-3: Loyalty Engine
- Track points for spend, visits, and configured activities.
- Auto-upgrade/down-grade evaluated monthly.
- Support redemption: points → discounts, free wash, add-ons.
- Points expire after 12 months by default.
- Acceptance: Points, tier changes, and redemptions recorded and reflected in user account.

FR-4: Tier Rules and Perks Management (Admin)
- Admin can create/edit tiers, point accrual rates, redemption rules, and perks.
- Admin can run targeted promotions (e.g., "Send to Silver+ only").
- Acceptance: Admin UI to configure rules and to launch targeted campaigns.

FR-5: Transaction & History Logging
- Log booking timestamp, amount, loyalty points awarded/redeemed, vehicle, and tier at time of transaction.
- Acceptance: Searchable history per user and downloadable logs for analytics.

FR-6: Auto-apply Perks at Checkout
- System auto-applies eligible discounts/perks based on tier and redemption choices.
- Acceptance: Checkout shows applied perks and final price with points usage.

FR-7: Admin Analytics & Reports
- Provide metrics: repeat rate, lifetime value, tier distribution, promotion performance.
- Acceptance: Admin can view and export reports.

FR-8: LPR Automation (Optional)
- Optionally integrate with LPR to identify vehicles and link to customer accounts.
- Acceptance: LPR event matched to customer record when available.

## 6. Data Model / Main Entities
- Customer (id, name, phone, email, linked_vehicles, tier, points_balance)
- Vehicle (id, customer_id, license_plate, type)
- Booking (id, customer_id, vehicle_id, datetime, slot, amount, status)
- Transaction (id, booking_id, amount, points_awarded, points_redeemed, timestamp)
- Promotion (id, name, target_criteria, start_date, end_date, perks)
- Loyalty_Point_Record (id, customer_id, delta, reason, expiry_date)

## 7. Non-Functional Requirements (summary)
- Security: Personal data stored securely; phone verification on registration.
- Reliability: Booking and loyalty services available during business hours; transactional integrity for points.
- Performance: Booking search and tier-priority queuing respond under 1s for typical queries.
- Privacy: Retain personal data per applicable regulations; ability to export user activity logs.

## 8. Constraints and Assumptions
- No online payment/refund support will be implemented.
- Data collection for research will be limited to opt-in survey participants and synthetic/collected logs from partner sites.
- Target dataset sizes: synthetic behavioral dataset ~2,000 records; survey-sourced data target ~3,000 records.

## 9. Research Questions & Objectives
Research question: What factors most influence customer loyalty tier progression in smart service ecosystems?

Objectives:
- Identify factors that strongly influence tier upgrades, retention, and long-term engagement.
- Collect and analyze booking logs, points, redemption behavior and survey responses.

## 10. Project Plan and Timeline (16 weeks)
- Phase 1 (Weeks 1–4): Prototype system + survey design
  - Build registration, booking, basic loyalty modules
  - Create survey form and pilot it among FPT students/staff
- Phase 2 (Weeks 5–7): Data collection (synthetic)
  - Complete Loyalty, Promotion, Transaction modules
  - Generate/collect ~2k synthetic behavioral records
- Phase 3 (Weeks 8–9): External data collection (survey)
  - Run survey campaigns to gather ~3k responses
- Phase 4 (Weeks 10–12): Data processing
  - Clean, normalize and label logs/survey responses
- Phase 5 (Weeks 13–16): ML & Analysis
  - Train models, perform analytics, test hypotheses and prepare paper/report (conference submission)

## 11. Acceptance Criteria & Deliverables
Deliverables:
- Working prototype: registration, booking, loyalty, admin config, basic analytics
- Data collection artifacts: survey form, synthetic dataset, collected logs
- Final report: analysis of factors affecting tier progression and system documentation

Acceptance Criteria:
- Users can register and make tiered-priority bookings
- Loyalty points accrue and redeem correctly; tiers auto-update monthly
- Admins can create targeted promotions and export reports
- Required datasets collected to the specified scale for analysis

## 12. Appendix: Survey & Log Fields
Recommended fields to collect in logs and survey:
- Booking: datetime, slot, service_type, amount, vehicle_type
- Transaction: amount, points_awarded, points_redeemed, redemption_type
- Customer: phone, linked_license_plate, tier_at_time, signup_date
- Survey fields: frequency of wash, average spend, reward usage, motivation for choosing tier, demographics (optional)

---

For questions, or to request changes to scope or level of detail, please indicate desired edits.
