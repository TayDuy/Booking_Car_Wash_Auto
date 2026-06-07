<<<<<<< Updated upstream
# AutoWash Pro — Business Rules

## 1. Introduction

Purpose
This document records the definitive business rules for AutoWash Pro — the Smart Automated Car Wash Management System. Business rules codify the product's expected behavior, constraints, validations, and operational procedures. They are the authoritative source for backend implementation, frontend validation, database constraints, QA cases, and product acceptance criteria.

Definitions
- Business Rule: A declarative statement that constrains or guides business behavior, processes, or data.
- Validation Rule: A type of business rule that checks data correctness and format at entry points (UI/API).
- System Rule: Rules that define system behavior, processing order, and automated jobs.
- Operational Rule: Rules that apply to business operations, capacity, scheduling, and human-involved processes.

---

## 2. Customer Management Rules

### Registration Rules

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-CUS-001 | Customer phone number must be unique across the system. | Two accounts cannot share +84123456789. | Allow merging for verified corporate accounts with admin approval. |
| BR-CUS-002 | Customer must verify phone number via OTP before creating a booking. | Unverified user cannot POST /bookings. | Admin can create bookings for a customer without OTP for assisted registration. |
| BR-CUS-003 | Customer may register multiple vehicles under their account. | Add Car A and Bike B to same profile. | Corporate accounts may own many vehicles with a different model. |
| BR-CUS-004 | One vehicle can be linked to only one active customer account. | Plate ABC123 cannot be in two active profiles. | If a previous profile is deactivated the plate can be reassigned after verification. |
| BR-CUS-005 | Email is optional for registration; phone is required. | User registers with phone only. | If email provided it must be unique when enforced in settings. |
| BR-CUS-006 | Password rules: min 8 characters, one uppercase, one lowercase, one number, and one special character. | P@ssw0rd1 accepted. | If using OTP-only flow, password optional until set. |
| BR-CUS-007 | Duplicate registration attempts with same phone within 24 hours are rate-limited. | Excessive OTP sends blocked after 5 attempts. | Admin override for support actions. |
| BR-CUS-008 | Existing users who register via SSO or other provider must have phone verified before booking. | SSO user still must verify phone. | If SSO provides trusted phone claim and admin trusts provider, verification may be bypassed. |
| BR-CUS-009 | Phone must follow E.164 format. | +84123456789 stored in DB. | Legacy imports may be normalized on admin import. |
| BR-CUS-010 | Account lockout after N failed login attempts (configurable, default 5). | After 5 wrong passwords, lockout for 15 minutes. | Admin can manually unlock account. |
| BR-CUS-011 | User deletion is soft; deleting a user marks is_deleted and preserves historical transactions. | Deleted user cannot log in. | GDPR deletion request must purge PII after compliance checks. |
| BR-CUS-012 | When registering via OTP, create CustomerProfile record automatically on verification. | OTP verified -> profile created. | If admin creates the user, profile created on first login. |
| BR-CUS-013 | Customer contact preferences must be opt-in for marketing notifications. | Marketing toggle default false. | Transactional messages (booking confirmations) do not require opt-in. |
| BR-CUS-014 | Phone numbers flagged as invalid by telco provider cannot be used until verified. | Invalid number blocked. | Admin can force-validate after manual check. |
| BR-CUS-015 | Users can link multiple external identity providers to the same account (future). | Link Google and Apple to same profile. | Implementation in future release with SSO mapping rules. |

### Profile Rules

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-CUS-PF-001 | Profile contains display name, contact preferences, default branch, and notification preferences. | Name, prefer SMS or email, default branch set. | Default branch may be unset. |
| BR-CUS-PF-002 | Customers can update their profile details but phone cannot be changed without re-verification. | Update address allowed; change phone triggers OTP. | Admin may change phone after identity verification. |
| BR-CUS-PF-003 | Profile data changes generate an audit log entry. | Name changed -> AuditLog record created. | Minor preference toggles may be aggregated in logs. |
| BR-CUS-PF-004 | Profile privacy settings control exportability in analytics. | If customer disables export, their PII removed from analytics exports. | Aggregates (counts) still included. |
| BR-CUS-PF-005 | Customers can view and export their own transaction and points history. | Customer requests CSV of last year transactions. | Data redaction applied for PII as required by policy. |
| BR-CUS-PF-006 | Customer profile deactivation prevents new bookings but preserves history. | Deactivated customer cannot create bookings. | Reactivation by OTP unlocks account. |
| BR-CUS-PF-007 | Preferred communication channel selected by customer used for notifications. | If SMS preferred, promotions sent via SMS first. | Failover to email if SMS undelivered and email present. |
| BR-CUS-PF-008 | Customer timezone used to display local times in UI. | Branch in Asia/Ho_Chi_Minh shows local slot times. | Admin override for global view. |
| BR-CUS-PF-009 | Profile-level referral codes tracked and can award bonus points upon successful referral. | Referral credit applied when referred user completes first paid booking. | Fraud checks may reject referral reward. |

---

## 3. Vehicle Management Rules

Vehicle rules are critical to booking integrity and LPR matching. At least 15 rules are specified.

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-VEH-001 | License plate must be normalized to uppercase and stripped of whitespace and punctuation before storage. | "abc-123" -> "ABC123". | Admin-imported legacy data preserved in raw_plate with normalized_plate computed. |
| BR-VEH-002 | license_plate uniqueness enforced per branch by default (branch_id + license_plate). | Same plate allowed in different branches only if enforcement disabled. | Global unique constraint configurable via admin setting. |
| BR-VEH-003 | Vehicle type must be one of the allowed enumerations: CAR, MOTORBIKE, TRUCK (future). | "CAR" accepted. | Unknown types rejected during validation. |
| BR-VEH-004 | Vehicle must reference an active CustomerProfile. | Vehicle.customer_id points to existing profile. | Admin-created vehicles for guest or corporate accounts permitted with nullable customer_id in special cases. |
| BR-VEH-005 | A vehicle marked inactive cannot be used for new bookings. | is_active = 0 blocks booking. | Manager can temporarily reactivate for walk-in service. |
| BR-VEH-006 | Vehicle with outstanding active bookings cannot be deleted. | Delete attempt returns 409 Conflict. | Admin can force-delete after manual reconciliation. |
| BR-VEH-007 | Vehicles have optional metadata: color, model, manufacturer, VIN. | VIN stored if provided. | Not required for basic booking functionality. |
| BR-VEH-008 | Vehicle ownership transfer requires verification: old owner must release or admin approves transfer. | Transfer plate ABC123 to another account with admin approval. | If previous account is inactive > 90 days, auto-allow transfer after checks. |
| BR-VEH-009 | Vehicles can have multiple aliases/nicknames per customer for convenience. | "Family Car" label used in UI. | Nicknames do not affect uniqueness rules. |
| BR-VEH-010 | Vehicle plate history stored for audit when plate edits occur. | If plate updated, previous_plate saved in history table. | Minor formatting corrections still create history entry. |
| BR-VEH-011 | LPR matching prefers exact normalized_plate, then fuzzy matching (configurable). | Exact match returns fastest customer lookup. | Fuzzy match used when exact match fails (e.g., OCR errors). |
| BR-VEH-012 | Vehicles may be linked to a default branch to prioritize slot recommendations. | Vehicle assigned to Branch A preferred in search. | Customers can book at any branch regardless of default. |
| BR-VEH-013 | Maximum number of vehicles per customer configurable (default 10). | Attempting to add 11th vehicle returns 403. | Admin override available. |
| BR-VEH-014 | Vehicles must have valid plate format per local regex when provided; validation messages explain format. | Vietnam plate regex enforced for VN branches. | Admin may import exceptions for fleet partners. |
| BR-VEH-015 | Vehicles created by Managers during assisted booking are linked to the customer who provided ID or phone. | Manager adds vehicle for customer in branch. | If customer not present, vehicle saved as unverified until customer claims. |
| BR-VEH-016 | Duplicate vehicle detection warns users during creation and suggests existing linked profiles. | Suggest account owning plate ABC123. | Users may proceed after confirmation. |
| BR-VEH-017 | Vehicle soft-deletion preserves the plate for historical linking in bookings and transactions. | Deleted vehicle displays in history as "deleted". | Hard delete allowed only by admin after retention period. |

Validation Rules
- license_plate: @Pattern per branch locale; @NotNull for required.
- type: Enum constraint in DB + DTO validation.

Operational Rules
- Regular batch job to normalize plates and flag suspicious duplicates for manual review.

---

## 4. Booking Management Rules

Booking rules define creation, modification, cancellation, capacity, priority, and status lifecycle. The following 30+ rules describe precise behavior.

### General Booking Rules (IDs BR-BOOK-001 to BR-BOOK-010)

| Rule ID | Description | Reason | Example | Impact |
|---|---|---|---|---|
| BR-BOOK-001 | Customers cannot create bookings in the past. | Prevents inconsistent scheduling. | Today is 2026-06-04; booking for 2026-06-03 rejected. | API returns 400. |
| BR-BOOK-002 | Customers cannot create overlapping bookings for the same vehicle. | Prevents double-booking the vehicle. | Existing booking 9:00-10:00; new booking 9:30 rejected. | 409 Conflict. |
| BR-BOOK-003 | Booking requests must include vehicleId, branchId, and at least one serviceId. | Ensures booking is actionable. | Missing serviceId -> 400. | 400 Bad Request. |
| BR-BOOK-004 | Booking duration computed from service durations and is used to set scheduled_end. | Accurate allocation of slots. | Two services totalling 45 minutes set scheduled_end = start+45m. | Consistent slot blocking. |
| BR-BOOK-005 | Booking creation must be idempotent when client supplies Idempotency-Key header. | Prevents duplicate bookings on retries. | Re-sent request with same key returns the original booking. | Duplicate prevention implemented server-side. |
| BR-BOOK-006 | Booking creation requires the customer's phone to be verified. | Business rule for trust and notifications. | Unverified user -> 403. | 403 Forbidden. |
| BR-BOOK-007 | A booking's total_amount is calculated from sum(service.base_price) minus promotions and redemptions. | Ensures accurate billing and points calculation. | 100000 base - 10% promo = 90000. | Points awarded based on final charge per rules. |
| BR-BOOK-008 | Bookings created through LPR auto-match use best-effort matching and create tentative records for manager confirmation. | Avoid incorrect auto-check-ins. | LPR detects plate -> finds customer -> creates tentative check-in. | Manager confirms or reassigns. |
| BR-BOOK-009 | Bookings attempted outside branch operating hours are rejected. | Enforce operational constraints. | Branch hours 08:00-18:00; booking at 19:00 rejected. | 400 with message. |
| BR-BOOK-010 | Booking window enforcement: allowable advance days depends on customer's current loyalty tier. | Tier benefits control access. | Gold -> 12 days; Member -> 7 days. | 400 if outside window. |

### Booking Creation Rules (BR-BOOK-011 to BR-BOOK-020)

| Rule ID | Description | Reason | Example | Impact |
| BR-BOOK-011 | Booking start time must align with defined slot granularity (e.g., 15-minute boundaries). | Simplifies capacity management. | Start at 09:00 or 09:15 allowed; 09:10 rejected. | 400 error. |
| BR-BOOK-012 | Booking must pass capacity check: sum(active bookings for slot) + requested qty <= slot capacity. | Prevent overcommit. | Capacity 10, existing 10 -> new booking waitlisted or rejected. | 409 or 202 waitlisted. |
| BR-BOOK-013 | If capacity is full and waitlist enabled, create a waitlist entry with priority rank. | Keep customers engaged instead of failing silently. | Added to waitlist with rank = tierPriority + timestamp. | 202 Accepted. |
| BR-BOOK-014 | Booking requests must validate the vehicle belongs to the customer or that the customer has permission for that vehicle. | Security & ownership enforcement. | Attempt to book with another customer’s vehicle -> 403. | 403 Forbidden. |
| BR-BOOK-015 | When redeeming points at booking, verify points are available and not expired. | Prevent negative balances. | Redeem 1000 pts when only 900 available -> 400. | 400 Bad Request. |
| BR-BOOK-016 | Promotion application validated at booking time; promotions must be active and the customer eligible. | Prevent abuse and ensure correct discounts. | Expired promo -> rejected. | 400 or no discount applied. |
| BR-BOOK-017 | Create booking operations are transactional: booking + bookingservice + transaction + loyalty record must commit together. | Consistency of financial and loyalty state. | Partial write would violate accounting. | Rollback on error. |
| BR-BOOK-018 | For corporate or bulk bookings, additional validation enforces limits and requires manager/admin approval. | Special handling for enterprise customers. | Bulk 50 bookings -> manager review required. | PR workflow. |
| BR-BOOK-019 | System logs booking creation with audit details: creator, source (web/manager/lpr), idempotency key. | Traceability and compliance. | Audit record created. | Supports dispute resolution. |
| BR-BOOK-020 | New bookings trigger notifications (email/SMS/in-app) to customer and optionally to manager. | Operational awareness. | Booking confirmation sent. | Notification job enqueued. |

### Booking Modification Rules (BR-BOOK-021 to BR-BOOK-030)

| Rule ID | Description | Reason | Example | Impact |
| BR-BOOK-021 | Customers can reschedule bookings subject to booking window and capacity. | Flexibility with constraints. | Reschedule from 09:00 to 10:00 if slot free. | 200 OK. |
| BR-BOOK-022 | Reschedule within restricted cancellation window may incur penalty per branch policy. | Deters last-minute changes. | <2 hours -> penalty applied. | Points deducted or fee recorded. |
| BR-BOOK-023 | Manager or Admin may modify bookings beyond customer window but must record reason in audit. | Operational exceptions. | Manager moves booking due to machine downtime. | Audit entry required. |
| BR-BOOK-024 | Rescheduling is idempotent with idempotency-key; concurrent reschedules serialized to prevent conflicts. | Prevents race conditions. | Concurrent reschedule -> one succeeds, others receive latest state. | 409 or updated result. |
| BR-BOOK-025 | Changing vehicle for a booking requires vehicle ownership verification and updates associated plate for LPR mapping. | Security. | Change to verified vehicle owned by same user. | 200 OK. |
| BR-BOOK-026 | Changing services recalculates total_amount, points_estimate, and may change booking duration. | Consistent billing. | Add extra service -> price increases. | Points recalculated. |
| BR-BOOK-027 | Any modification triggers notification to customer with change summary. | Keep customers informed. | Reschedule -> email sent. | Notification enqueued. |
| BR-BOOK-028 | Modifications after 'Washing' or 'Completed' statuses are not allowed; cancellation after washing requires manager intervention. | Preserve operation integrity. | Attempt to modify a running wash -> 403. | Manager override. |
| BR-BOOK-029 | System prevents modifications that would create overlapping bookings for the same vehicle as result. | Maintain booking invariants. | Change causes overlap -> reject. | 409 Conflict. |
| BR-BOOK-030 | All modifications recorded in BookingChangeLog with previous and new values. | Auditability. | Log entry created. | Helps customer disputes. |

### Booking Cancellation Rules (BR-BOOK-031 to BR-BOOK-040)

| Rule ID | Description | Reason | Example | Impact |
| BR-BOOK-031 | Customers may cancel bookings prior to cancellation cutoff (default 2 hours). | Protects revenue and operations. | Cancel 24 hours before -> no penalty. | 200 OK. |
| BR-BOOK-032 | Cancellation within cutoff applies penalty (points deduction or fee) as configured per branch. | Deters opportunistic behavior. | Cancel 1 hour before -> -100 points. | Points updated. |
| BR-BOOK-033 | No-shows automatically set status to NO_SHOW after manager-defined grace period and may trigger penalties. | Operational fairness. | No-show -> record and apply penalty. | Customer flagged. |
| BR-BOOK-034 | Cancellations update loyalty point records if points were previously awarded on booking completion (refund policy dependent). | Financial correctness. | Cancelled bookings before completion -> no points awarded. | Audit update. |
| BR-BOOK-035 | Cancellations by Admin/Manager require reason and are recorded for audit. | Traceability. | Manager cancels due to equipment failure -> reason recorded. | Helps refunds. |
| BR-BOOK-036 | Partial cancellation (remove a service) adjusts pricing and points pro-rata. | Accurate billing. | Remove add-on -> reduce amount. | Transaction adjusted. |
| BR-BOOK-037 | Reinstating a cancelled booking requires manager approval. | Prevent abuse of last-minute rebookings. | Reinstated booking audited. | 200 after approval. |
| BR-BOOK-038 | Cross-branch cancellations are not allowed; booking belongs to single branch. | Operational clarity. | Cancel at branch A only. | 403 if incorrect. |
| BR-BOOK-039 | Automated cancellation for unpaid bookings if payment model later added. | Operational hygiene. | Unpaid reservation expired -> auto-cancel. | Waitlist promoted. |
| BR-BOOK-040 | Cancellation notifications sent to customer and branch staff where relevant. | Communication. | Cancellation email sent. | Notification logged. |

### Booking Capacity & Time Window Rules (BR-BOOK-041 to BR-BOOK-050)

| Rule ID | Description | Reason | Example | Impact |
| BR-BOOK-041 | Branch-level capacity defined per time slot and per service if necessary. | Fine-grained control of resources. | Service A capacity 10 per 15-min slot. | Capacity checks enforced. |
| BR-BOOK-042 | Default booking window days defined per tier; Member 7, Silver 10, Gold 12, Platinum 14 by default. | Tier benefits expressed here. | Member -> 7 days ahead. | Booking API validates. |
| BR-BOOK-043 | Weekend/holiday operating hours may alter slot availability. | Real-world constraints. | Holiday -> reduced hours. | Slot search honors exception. |
| BR-BOOK-044 | Slot capacity recalculated on cancel/complete to free slots. | Dynamic capacity. | Cancel frees spot for waitlist promotion. | Waitlist processed. |
| BR-BOOK-045 | Blackout windows (maintenance) configured per branch disallow bookings during those periods. | Planned downtime. | 13:00-15:00 maintenance -> no bookings. | 400 rejects. |
| BR-BOOK-046 | Minimum lead time for same-day bookings (e.g., 30 minutes) to allow processing. | Operational feasibility. | Booking within 10 minutes rejected. | 400 error. |
| BR-BOOK-047 | Maximum booking length limited to business-configured max to prevent resource hogging. | Fair usage. | Max 4 hours per booking. | 400 if exceeded. |
| BR-BOOK-048 | Concurrent booking operations for same slot serialized via DB-level reservation to prevent oversubscription. | Data integrity. | Two simultaneous creates -> one succeeds. | Use transactions/locks. |
| BR-BOOK-049 | Booking searches support timezone-aware queries returning results in user's local timezone. | User experience. | Display slots in user tz. | Correct UI rendering. |
| BR-BOOK-050 | For multi-service bookings, combined duration influences slot selection and capacity reservation. | Accurate scheduling. | 30m + 15m services require 45m contiguous time. | Slot selection algorithm must find contiguous slots. |

### Booking Priority & Status Lifecycle (BR-BOOK-051 to BR-BOOK-060)

| Rule ID | Description | Reason | Example | Impact |
| BR-BOOK-051 | Booking statuses: Pending -> Confirmed -> Checked-In -> Washing -> Completed | Clear state machine for operations. | Booking flows through statuses. | Guaranteed transitions. |
| BR-BOOK-052 | Pending status indicates booking reserved but not yet confirmed by payment or manual confirmation if required. | Represent initial stage. | Pending used for hold. | UI indicates pending. |
| BR-BOOK-053 | Confirmed indicates slot allocated; customer notified. | Operational readiness. | Confirmed booking shows in manager dashboard. | Staff prepares service. |
| BR-BOOK-054 | Checked-In set when vehicle arrives and either LPR or staff confirms. | Operational start. | LPR triggers check-in. | Status changes. |
| BR-BOOK-055 | Washing indicates active service in progress and blocks modifications except manager actions. | Prevents mid-wash changes. | Attempt to cancel -> denied. | 403 unless manager. |
| BR-BOOK-056 | Completed status triggers transaction finalization and awarding of points following rules. | Points recorded at completion. | Completed -> award points. | LoyaltyPointRecord created. |
| BR-BOOK-057 | Cancelled and No-Show are terminal statuses but can have follow-up actions (penalty, reactivation). | Business closure. | No-Show leads to penalty. | Flags applied. |
| BR-BOOK-058 | Tier-based priority influences waitlist position and slot preemption only if configured. | Encourage higher tiers while protecting fairness. | Platinum higher rank. | Waitlist order affects promotions. |
| BR-BOOK-059 | Preemption (bumping) lower-tier confirmed bookings is forbidden unless explicit policy permits and customer consented. | Protect customer trust. | No auto-bumping. | Admin must opt-in. |
| BR-BOOK-060 | Booking lifecycle events emit domain events (BookingCreated, BookingUpdated, BookingCancelled) consumed by notifications and reporting subsystems. | Loose coupling and observability. | Event to notification worker. | Asynchronous processing. |

---

## 5. Queue Management Rules (15+ rules)

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-QUE-001 | Waitlist entries ordered by tier priority (Platinum > Gold > Silver > Member) then by requested time then by created_at. | Platinum created later still ahead of Silver earlier. | Admin may set special 'VIP' overrides. |
| BR-QUE-002 | Tier priority is defined numerically in configuration (e.g., Platinum=4, Gold=3...). | Numeric weights used for sorting. | Weights adjustable by admin. |
| BR-QUE-003 | Tie-breaking uses earliest request timestamp, then lexicographic userId if needed. | Two users same tier -> earlier timestamp first. | If timestamp identical (rare), use userId. |
| BR-QUE-004 | When a slot frees, the system offers the slot to the top waitlist entry and waits for confirmation window (configurable, default 15 minutes). | Offer sent to customer, awaiting acceptance. | If no response, offer to next. |
| BR-QUE-005 | Offer acceptance within confirmation window converts waitlist entry to booking; failure removes entry or demotes priority. | Accept within 15m -> booking confirmed. | Auto-cancel after expiry. |
| BR-QUE-006 | No-show for waitlist-confirmed booking treated as penalty and may remove user from waitlist for X days. | No-show after accepting -> 7-day ban from waitlist. | Manager override possible. |
| BR-QUE-007 | Walk-in customers can be assigned to available slots or waitlist according to branch policy. | Walk-in served if capacity available. | Some branches disallow walk-ins during peak hours. |
| BR-QUE-008 | Queue overflow triggers overflow handling: add to remote queue, notify customer of estimated wait time, or offer alternative branches. | Overflow at branch A -> offer branch B. | Customer may decline. |
| BR-QUE-009 | Emergency or manager-prioritized entries can be inserted at top of queue with audit logging. | Manager inserts VIP entry. | Audit required. |
| BR-QUE-010 | Waitlist entries expire after configured window if not processed. | Entries older than 7 days auto-removed. | Admin may extend lifespan. |
| BR-QUE-011 | When capacity increases (staff added), algorithm re-evaluates waitlist promotions. | More capacity -> promote top entries. | Promotions rate-limited to avoid flooding. |
| BR-QUE-012 | Multiple concurrent promotions for same slot are serialized to avoid double-confirmations. | Only one promotion per slot at a time. | Backoff retries used. |
| BR-QUE-013 | Customers with restricted accounts (e.g., penalty flag) are excluded from automatic promotions. | Penalized user not promoted. | Admin can override. |
| BR-QUE-014 | Queue metrics (position, ETA) available to customer in UI when opted-in. | Show waitlist position 3/20 and ETA 20m. | If customer opts out, no ETA shown. |
| BR-QUE-015 | System logs all queue changes for analytics (promotion, expiry, acceptance). | For later analysis of waitlist efficiency. | Data aggregated in reports. |

---

## 6. Loyalty Program Rules (25+ rules)

### Point Accumulation

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-LOY-001 | Points awarded based on transaction final_amount and tier accrual_rate. Default rule: points = FLOOR(final_amount * accrual_rate). | final_amount=100000, accrual_rate=0.001 => 100 pts. | Special campaigns may override accrual rate. |
| BR-LOY-002 | Base accrual default is 1 point per 1,000 VND (0.001). | 50,000 VND -> 50 points. | Admin can change accrual rates per tier or promotion. |
| BR-LOY-003 | Points are recorded as immutable LoyaltyPointRecord entries with delta and expiry_date. | +100 points record with expiry in 12 months. | Manual adjustments flagged as 'MANUAL'. |
| BR-LOY-004 | Points may be awarded for non-transaction activities (e.g., referrals, surveys) with source metadata. | Survey completion -> +20 pts. | Requires opt-in if tied to personal data. |
| BR-LOY-005 | Points awarded at transaction completion; pending states do not award until confirmed. | Booking completed -> points awarded. | If booking later voided, point reversal applied. |
| BR-LOY-006 | Points awarded are integer values; fractional points are floored. | 12.9 -> 12. | Rounding policy documented. |
| BR-LOY-007 | Points adjustments (positive/negative) create ledger entries and update CustomerProfile.points_balance within a transaction. | Refund -> -50 pts. | Manual adjustment flagged and audited. |
| BR-LOY-008 | Points for promotions may be time-limited special accruals; expiry per promotion config. | Promo +200 pts expire in 3 months. | Promotion rules can set expiry_date. |
| BR-LOY-009 | Points are non-transferable between customer accounts. | Cannot gift points to another user. | Admin may perform gift via manual adjustment. |
| BR-LOY-010 | Points rounding rules consistent across services and stored in config. | Set roundingMode=FLOOR. | Configurable per deployment. |

### Point Redemption

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-LOY-011 | Redeemed points must be available and not expired at time of checkout. | Attempt to use expired pts -> reject. | Admin override allowed. |
| BR-LOY-012 | Redemption types include DISCOUNT (percent), FIXED_AMOUNT, FREE_SERVICE, ADD_ON. | Use 1000 pts for free wash. | Some redemptions limited per period. |
| BR-LOY-013 | Partial redemption supported where points cover part of price; remaining paid by customer. | Use 500 pts to cover part of amount. | Last-cent rounding rules apply. |
| BR-LOY-014 | Redeemed points recorded as negative LoyaltyPointRecord entries with reason and linked booking. | Redemption -> -1000 pts entry. | Prevent double-spend with transaction lock. |
| BR-LOY-015 | Redeemed points are non-refundable under normal operation. | Redemption applied -> cannot refund points on cancellation. | Exceptional cases reversed by admin after review. |
| BR-LOY-016 | Maximum redemption per booking may be capped (configurable). | Max 50% of booking amount via points. | Admin may adjust for promos. |

### Point Expiration & Cleanup

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-LOY-017 | Points expire after configured months from awarded date (default 12 months). | Points from 2025-06-04 expire 2026-06-04. | Promotions may set different expiry. |
| BR-LOY-018 | Expiration run is implemented as scheduled job that inserts negative LoyaltyPointRecord for expired points and notifies customers. | Job runs daily applying expirations. | Manual override possible. |
| BR-LOY-019 | Expired points are not available for redemption. | Attempt to redeem expired points -> 400. | Admin reversal allowed. |
| BR-LOY-020 | Expiry notifications are sent 30 days prior to point expiry (configurable). | Notify user that 200 pts expire in 30 days. | Suppress notifications if user opted out of marketing. |

### Bonus & Campaigns

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-LOY-021 | Bonus points campaigns defined per promotion with start/end and target criteria. | New users get +500 pts during campaign. | Campaign may be limited to first N users. |
| BR-LOY-022 | Bonus points are ledger entries and follow expiration rules per promotion. | Bonus pts expire in 6 months per promo. | Some promos set non-expiring bonus. |
| BR-LOY-023 | Referral bonuses applied after referred customer's first paid booking completes. | Referred user books -> referrer gets reward. | Fraud detection may deny referral credit. |

### Manual Adjustments & Disputes

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-LOY-024 | Manual point adjustments require admin role and reason; they are auditable. | Support adds 100 pts for error. | Multiple manual adjustments allowed with justification. |
| BR-LOY-025 | Disputed transactions open a support ticket; pending adjustments flagged and not applied until resolution. | Customer disputes missing points -> investigation. | Temporary credit possible. |

---

## 7. Tier Management Rules (20+ rules)

Tier definitions: Member (base), Silver, Gold, Platinum.

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-TIER-001 | Tier upgrades/downgrades evaluated monthly by batch job. | Job runs on 1st of month. | Immediate adjustments allowed for manual promotions. |
| BR-TIER-002 | Gold requires minimum 10 visits in 12 months or 5000 points (configurable). | Customer with 11 visits -> eligible. | Admin may set alternate thresholds. |
| BR-TIER-003 | Platinum requires top-tier thresholds (e.g., 20 visits / 15000 pts). | Enterprise decision. | Manual elevation allowed for VIP customers. |
| BR-TIER-004 | Silver threshold default: 3 visits or 1000 points in 12 months. | 4 visits -> auto-upgrade. | Tuning allowed per market. |
| BR-TIER-005 | Upgrade effectivity applies at start of next billing cycle or immediately depending on config. | Upgrade applied immediately -> booking window extended. | Admin configure delay. |
| BR-TIER-006 | Downgrade occurs when customer fails to meet retention criteria over lookback window (12 months). | Points drop -> downgrade. | Grace periods can be applied. |
| BR-TIER-007 | Tiers define booking_window_days, accrual_rate, and perks_json. | Gold: booking_window_days=12. | Per-tier overrides allowed by branch in exceptional cases. |
| BR-TIER-008 | Tier benefits applied at booking time and checkout; system calculates entitlements. | Gold gets 3 extra days window. | Manager can override per booking. |
| BR-TIER-009 | Tier retention policies (e.g., hold status) allow temporary freeze for travel. | Freeze 3 months -> no downgrade. | Requires customer request. |
| BR-TIER-010 | Tier migration logs include previous tier, new tier, timestamp, and reason. | Audit entry for upgrade. | Manual entries tagged as admin. |
| BR-TIER-011 | Tier priority numeric values define queuing order. | Platinum priority=4. | Admin may remap priorities. |
| BR-TIER-012 | Tiers may have exclusion rules (e.g., corporate accounts not eligible for certain promos). | Corporate excluded from casual promos. | Special corporate promos exist. |
| BR-TIER-013 | Tier-based discounts auto-apply only if customer qualifies and redemption rules allow stacking. | Platinum auto 5% discount. | Stacking rules determine combination. |
| BR-TIER-014 | Tier downgrade notifications sent 7 days prior to effective downgrade (if grace). | Notify customer of downgrade timeline. | Immediate downgrade for violations. |
| BR-TIER-015 | Manual tier adjustments by Admin include effective_date and audit reason. | Admin grants temporary Gold for marketing. | Temporary tag expires at date. |
| BR-TIER-016 | Tier expiry (if temporary) reverts to previous tier automatically. | Temporary Gold reverts after promotion ends. | Notifications sent on change. |
| BR-TIER-017 | Tier-specific perks (e.g., free add-ons per period) tracked to enforce limits. | Gold gets 1 free vacuum per month; track usages. | Unused perks do not roll over unless configured. |
| BR-TIER-018 | Tier calculation uses canonical metrics: visits, points earned, and spend; weightings configurable. | 70% points + 30% visits. | Configurable per market. |
| BR-TIER-019 | Legacy tier mapping for imported data supported via migration scripts. | Import maps old tiers to current names. | Manual mapping allowed. |
| BR-TIER-020 | In disputes, canonical tier reported is system-assigned value; support may override in exceptional cases. | Support changes tier pending review. | Audit logged. |

---

## 8. Promotion Rules (20+ rules)

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-PRO-001 | Promotions can specify targetCriteria (tier, branchId, lastVisitDays, minSpend). | Target Silver+ who haven’t visited in 30 days. | Ad-hoc targeting by support allowed. |
| BR-PRO-002 | Promotion must have start_date < end_date and non-negative duration. | start 2026-06-01 < end 2026-06-30. | Admin warnings on short windows. |
| BR-PRO-003 | Promotion perks are limited to types: PERCENT_DISCOUNT, FIXED_DISCOUNT, FREE_SERVICE, BONUS_POINTS, UPGRADE. | 10% off is PERCENT_DISCOUNT. | New types added via migration. |
| BR-PRO-004 | Promotions cannot exceed 100% discount. | 110% discount rejected. | Error in setup must be corrected. |
| BR-PRO-005 | Promotions have max_uses per customer and optional global cap. | Max 1 use per customer. | Admin can increase. |
| BR-PRO-006 | Promotions marked exclusive prevent stacking with other promotions unless stacking_mode allows. | Exclusive promo blocks double discounts. | Stacking_mode=COMBINE allows limited stacks. |
| BR-PRO-007 | Promotions targeted by branch apply only to bookings at that branch. | Branch-specific coupon. | Global promo can override. |
| BR-PRO-008 | Promotion dispatch job evaluates targetCriteria and produces PromotionUse records when sent or applied. | Dispatch to 1000 customers creates records. | Dry-run mode to preview recipients supported. |
| BR-PRO-009 | Promotion expiry prevents redemption after end_date. | Expired promo code rejected. | Admin may extend end_date. |
| BR-PRO-010 | Promotion codes optionally require code redemption (coupon) or auto-apply to eligible customers. | Auto-apply for Silver+. | Code-based requires manual entry. |
| BR-PRO-011 | Promotion creation requires audit log entry with creator id and justification. | Admin creates promo -> audit saved. | System campaigns may be auto-created by marketing system with linkage. |
| BR-PRO-012 | Promotion preview (dry-run) provides estimated recipient count without dispatch. | Marketing previews reach. | Estimates may differ at dispatch time due to state changes. |
| BR-PRO-013 | Promotion overlapping rules define precedence: higher priority or earliest created wins, unless stacking allowed. | Two promos -> priority decides. | Admin can force order. |
| BR-PRO-014 | Promotions that grant free services reserve inventory if required; max uses decremented on confirmation. | Free wash limited to 100 customers. | Oversubscription handled via waitlist. |
| BR-PRO-015 | Promotion reporting captures impressions (sent), redemptions, and conversions. | 1000 sent, 50 redeemed. | Partial data reconciliation allowed. |
| BR-PRO-016 | Promotion rollback supported: admin can revoke unredeemed promotions and notify recipients. | Recall promo before redemption ends. | Refunds not applicable as no payment. |
| BR-PRO-017 | Coupon generation ensures unique codes and rate-limited generation to avoid abuse. | Generate 10k coupon codes. | Bulk generation throttled. |
| BR-PRO-018 | Promotions targeted at a specific cohort may be limited to customers meeting criteria at dispatch time (not at creation). | Dispatch selects current eligible customers. | Time-sensitive cohorts vary. |
| BR-PRO-019 | Promotions with external partner integrations must include partner id and usage contract. | Partner co-branded. | Partner limits enforced. |
| BR-PRO-020 | Expired promotions removed from active API responses and marked historical for reporting. | GET /promotions returns active only. | Admin can query archived promotions. |

---

## 9. Checkout and Pricing Rules (15+ rules)

| Rule ID | Description | Formula/Example | Exception |
|---|---|---|---|
| BR-CH-001 | Service line item price = service.base_price * qty. | 50,000 * 2 = 100,000. | Discounts applied after line totals. |
| BR-CH-002 | Subtotal = SUM(line item prices). | Sum of services = 150,000. | Additional charges added after subtotal. |
| BR-CH-003 | Promotion discount applied to subtotal as per promotion type. | 10% off -> subtotal * 0.9. | Stack rules may change formula. |
| BR-CH-004 | Loyalty redemption reduces final price by fixed or percent as configured. | Redeem 1000 pts = 50,000 VND off. | Cap redemption to 50% of subtotal unless configured. |
| BR-CH-005 | Tax calculation applies after discounts but before points if required by local law. | (Subtotal - discount) * taxRate. | Tax rules per region. |
| BR-CH-006 | Final price = max(0, subtotal - promoDiscount - pointsDiscount + taxes + fees). | Prevent negative prices. | Refunds handled separately. |
| BR-CH-007 | Rounding: currency rounded to nearest integer VND. | Final price 12345 -> 12345. | Use two decimals for other currencies. |
| BR-CH-008 | Refunds (future feature) will adjust loyalty points and may record negative transactions. | Refund 50,000 -> points reversed. | Manual review may be required. |
| BR-CH-009 | Discounts may be capped per booking or per customer period. | Max discount 200,000 per booking. | Admin can configure. |
| BR-CH-010 | Pricing override by Manager only with audit and reason. | Manager applies comp -> audit entry. | Approved overrides subject to limits. |
| BR-CH-011 | Service pricing may vary per branch; effective price resolved by branch price list. | Branch A price 50,000, Branch B 55,000. | Default to service.base_price if no branch price. |
| BR-CH-012 | Surcharges (peak hours) applied as percentage on subtotal. | Peak +10% on subtotal. | Configurable schedules. |
| BR-CH-013 | Loyalty point conversion formula: points = FLOOR(final_price * accrual_rate). | final_price 100,000, accrual_rate 0.001 -> 100 pts. | Accrual_rate tier-based. |
| BR-CH-014 | Taxes and service fees are presented to customers with breakdown at checkout. | Show subtotal, discounts, taxes, final. | Back-office override possible. |
| BR-CH-015 | When multiple discounts apply, system computes best combinational outcome based on stacking rules (maximize customer benefit or admin-defined priority). | Choose bigger discount if exclusivity. | Admin defines stacking policy. |

---

## 10. Branch Management Rules (15+ rules)

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-BR-001 | Branch operating hours defined per day of week with timezone awareness. | Mon-Fri 08:00-18:00. | Temporary closures via blackout windows. |
| BR-BR-002 | Branch capacity is defined per slot granularity and per service; default capacity applies when service-specific capacity missing. | Default 10 per slot. | On special events, capacity increased. |
| BR-BR-003 | Branch service assignment controls which services are available at a branch. | Vacuum not available at branch B. | Admin may add service. |
| BR-BR-004 | Branch managers can view and modify bookings within their branch scope only. | Manager A edits bookings at Branch A. | Cross-branch edits disallowed. |
| BR-BR-005 | Branch timezone used for slot calculations and local display. | Branch TZ Asia/Ho_Chi_Minh used. | UI convert for remote managers. |
| BR-BR-006 | Branch-level cancellation policies override global defaults if specified. | Branch X cancellation cutoff 4 hours. | Global default 2 hours applies otherwise. |
| BR-BR-007 | Branch may enable/disable walk-ins by time windows. | No walk-ins 07:00-09:00. | Manager override allowed. |
| BR-BR-008 | Branch maintenance windows are configured to block bookings during downtime. | Maintenance 13:00-14:00. | Emergency maintenance can be set ad-hoc. |
| BR-BR-009 | Branch contact details stored and shown to customers on booking confirmation. | Show phone and address. | PII redaction for privacy. |
| BR-BR-010 | Branch performance metrics maintained for SLA (throughput, avg service time). | Track average wash time. | Used for capacity tuning. |
| BR-BR-011 | Branch staff scheduling may be integrated later; branch capacity aligns with staff availability. | More staff -> higher effective capacity. | Manual adjustments until integration. |
| BR-BR-012 | Multiple branches support shared promotions and cross-branch redemption if enabled. | Promo valid at all branches. | Some promos branch-restricted. |
| BR-BR-013 | Branch-level pricing overrides base service price; visible to customers. | Branch price differs. | Admin controls pricing. |
| BR-BR-014 | Branch closure requires mass-notification to today's booked customers. | Unexpected closure -> notify. | Manager triggers notification workflow. |
| BR-BR-015 | Branch analytics data retention configurable; older data moved to archive for reporting. | Archive after 2 years. | Regulatory retention may override. |

---

## 11. User Authorization Rules (RBAC Matrix & 20+ rules)

RBAC Matrix

| Feature | Customer | Manager | Admin |
|---|---:|---:|---:|
| Register/Login | ✓ | N/A | N/A |
| Manage own profile | ✓ | N/A | ✓ (impersonate) |
| Create Booking | ✓ | ✓ (on behalf) | ✓ |
| Cancel Booking | ✓ (own) | ✓ (branch) | ✓ |
| Modify Booking | ✓ (own) | ✓ (branch) | ✓ |
| Manage Promotions | N | N | ✓ |
| View Branch Reports | N | ✓ | ✓ |
| Manage Branches | N | N | ✓ |
| Adjust Loyalty Points | N | N | ✓ |
| View Audit Logs | N | N | ✓ |

Authorization Rules (sample)

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-AUT-001 | Customers may only access their own profile and bookings. | GET /customers/me only. | Admin can impersonate with audit. |
| BR-AUT-002 | Managers restricted to operations within their assigned branch(es). | Manager from Branch A cannot edit Branch B bookings. | Multi-branch managers have explicit rights. |
| BR-AUT-003 | Admins have global rights including user and branch management. | Admin can create branches. | Super-admin separation of duties recommended. |
| BR-AUT-004 | API endpoints enforce role checks via @PreAuthorize and branch scope via claims or query filters. | Controller annotated accordingly. | Emergency backdoor audit-only endpoint for support. |
| BR-AUT-005 | Password reset flows require identity verification via OTP and are rate-limited. | Password reset OTP required. | Admin reset bypass with audit. |
| BR-AUT-006 | Sensitive actions (points adjustments, role changes) require two-step approval or elevated audit. | Role change logged and may require second approver. | Smaller teams may allow single approver. |
| BR-AUT-007 | Session revocation supported via RefreshToken revocation by Admin. | Support revokes compromised token. | Token rotation recommended. |
| BR-AUT-008 | Manager dashboards filter data to their branch and masked PII except for operations. | Manager sees masked phone except when performing check-in. | Full PII visible only with explicit consent. |
| BR-AUT-009 | System enforces least privilege principle in newly created roles. | New role created with minimal permissions. | Admin can expand permissions. |
| BR-AUT-010 | Audit trail records who performed a privileged action and when. | Role change -> AuditLog entry. | Immutable for compliance. |

(Additional authorization rules define API-level access for each CRUD endpoint and sensitive functions.)

---

## 12. Notification Rules (15+ rules)

| Rule ID | Description | Trigger | Exception |
|---|---|---|---|
| BR-NOT-001 | Booking confirmation notification sent on successful booking creation. | BookingCreated event. | If customer opted out of notifications, in-app notification still created. |
| BR-NOT-002 | Booking reminder sent 24 hours and optionally 1 hour before scheduled_start (configurable). | Scheduled job triggers reminders. | Opt-out suppresses SMS, email still allowed per transactional rules. |
| BR-NOT-003 | Cancellation notifications sent to customer and branch staff. | BookingCancelled event. | If notification fails, retry policy applies. |
| BR-NOT-004 | Loyalty tier change notifications sent when upgrade or downgrade occurs. | Tier evaluation job triggers message. | If user opted out of marketing, send only critical notice. |
| BR-NOT-005 | Promotion dispatch notifications sent to targeted recipients. | PromotionDispatch job. | Rate-limit to avoid spam. |
| BR-NOT-006 | Notification channels include in-app, SMS, and email; choice based on preference and availability. | Prefer SMS then email. | Fallback logic implemented. |
| BR-NOT-007 | Notification delivery failures retried with exponential backoff up to N attempts; failures recorded in WebhookDelivery. | SMS provider down -> retries. | If permanently failed, mark as failed and notify support. |
| BR-NOT-008 | Critical system alerts (branch closure) trigger operator escalation channels in addition to customer notifications. | Unexpected closure -> escalate. | Escalation list configurable. |
| BR-NOT-009 | Notification content must not include sensitive PII unless explicitly consented. | Do not include payment info. | Booking details allowed (time, branch). |
| BR-NOT-010 | Notification templates are versioned and auditable. | Template updated -> history kept. | Rollback possible. |
| BR-NOT-011 | Notification opt-out respects legal obligations for transactional messages. | Booking confirmations still sent despite opt-out. | Marketing suppressed. |
| BR-NOT-012 | Promotion notifications include unsubscribe option where required by law. | Include link to opt-out. | Short messages may direct to preference center. |
| BR-NOT-013 | Notifications for expiry of points sent 30 days prior then 7 days prior. | Points expiring -> emails sent. | Suppression for opted-out customers. |
| BR-NOT-014 | LPR-based check-in notifications sent to customer and manager when match occurs. | LPR event -> check-in forwarded. | If ambiguous match, notify manager for confirmation. |
| BR-NOT-015 | Notification SLA: delivery attempts and retries logged with timestamps for reporting. | Logs show attempts. | Used for dispute resolution. |

---

## 13. Reporting Rules (15+ rules)

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-REP-001 | Revenue reports aggregate transactions by branch, date range, and service. | SUM(amount) grouped by day. | Multi-currency requires normalization. |
| BR-REP-002 | Loyalty reports include distribution of points, redemptions, and churn by tier. | Show points per tier. | Anonymized exports available for privacy. |
| BR-REP-003 | Booking reports show utilization, no-shows, cancellations, and average service time. | Daily utilization 70%. | Sampling for older archived data. |
| BR-REP-004 | Promotion performance measured by impressions, redemptions, conversion rate and revenue uplift. | Promo 1000 sent, 50 redeemed, 5% conv. | Attribution window configurable. |
| BR-REP-005 | Reports support CSV export and scheduled email distribution to stakeholders. | Weekly CSV to manager. | Secure export via SFTP optional. |
| BR-REP-006 | Reports must include timezone normalization to branch locale. | Report times in branch tz. | UTC basis available. |
| BR-REP-007 | Sensitive PII in exports masked unless user consent or admin explicitly requests unmasked export. | Phone masked as +84*******89. | Admin exceptions audited. |
| BR-REP-008 | Report generation heavy jobs run asynchronously and persisted to storage for download. | Large CSV generation queued. | Real-time small queries allowed. |
| BR-REP-009 | Access to reports is role-controlled and logged. | Manager sees branch report. | Admin sees cross-branch. |
| BR-REP-010 | Historical snapshots stored monthly for trend analysis. | Monthly snapshot of tier distribution. | Retention policy applies. |
| BR-REP-011 | Data anomalies flagged automatically if values deviate beyond thresholds. | Sudden drop in bookings triggers alert. | Manual review required. |
| BR-REP-012 | Reports use canonical source-of-truth tables (Booking, Transaction, LoyaltyPointRecord) and never derive sensitive PII at query time. | Use ledger tables. | Aggregated PII may be exported under consent. |
| BR-REP-013 | Ad-hoc reporting queries require approval and scheduling to avoid production DB load. | Large queries scheduled at off-peak. | Admin can run with direct access. |
| BR-REP-014 | Report access and export operations generate audit entries. | CSV export logged. | Helps compliance. |
| BR-REP-015 | Real-time dashboard metrics refreshed at configurable intervals (default 60s). | KPIs update every minute. | Dashboard caches to reduce load. |

---

## 14. Audit and Logging Rules (15+ rules)

| Rule ID | Description | Example | Exception |
|---|---|---|---|
| BR-AUD-001 | All privileged actions (user role changes, points adjustments, promotion creation) are recorded in AuditLog with actor, timestamp, and details. | Admin adjusts points -> audit log. | System automated events also logged with system actor. |
| BR-AUD-002 | Booking lifecycle events are logged as discrete events for traceability (created, modified, cancelled, checked-in, completed). | Booking created -> event emitted. | Events consumed by async services. |
| BR-AUD-003 | Security logs capture authentication attempts, failed logins, token revocations, and suspicious activity. | Multiple failed logins -> alert. | Retention according to security policy. |
| BR-AUD-004 | Loyalty transactions kept as immutable ledger entries for auditability. | LoyaltyPointRecord append-only. | Corrections via compensating entries. |
| BR-AUD-005 | Promotion dispatch and redemption events logged with context (customerId, promotionId, bookingId). | Redemption logged. | Used for reconciliation. |
| BR-AUD-006 | Webhook deliveries and external integration attempts logged with payload hash and status. | LPR webhook attempt logged. | Retry attempts increment attempts count. |
| BR-AUD-007 | Audit logs are immutable and write-once where possible; administrative truncation requires multi-step process. | Audit can't be edited by regular admins. | Archival allowed. |
| BR-AUD-008 | Logs include correlation IDs for tracing across services. | CorrelationId propagated in headers. | Instrumentation across stacks required. |
| BR-AUD-009 | Log retention policies differ by log type (security logs longer than operational logs). | Security logs retained 7 years. | Storage-compliance rules apply. |
| BR-AUD-010 | Access to audit logs restricted to Admin role and Security team. | Only Admins view audit. | Support can request temporary access. |
| BR-AUD-011 | Data exports from audit logs are signed and integrity-checked. | Export CSV with checksum. | Verified for compliance. |
| BR-AUD-012 | Audit trail supports rollback analysis for critical incidents. | Reconstruct sequence for incident. | Preservation required. |
| BR-AUD-013 | All manual adjustments require audit reason and optional ticket id for traceability. | Manual pts add -> enter ticket#123. | Ticket link optional in emergency. |
| BR-AUD-014 | Audit logs available via /api/v1/audit with filters and strict rate limiting. | Admin queries audit. | High-cost queries scheduled. |
| BR-AUD-015 | Audit log integrity checks run periodically to detect tampering. | Hash validation passes. | Alert on mismatch. |

---

## 15. Exception Handling Rules (25+ rules)

| Rule ID | Description | Example | System Behavior |
|---|---|---|---|
| BR-EX-001 | Duplicate booking detection by idempotency-key rejects duplicates with 200 response referencing original. | Retry POST with same Idempotency-Key. | Return existing booking. |
| BR-EX-002 | Attempt to create overlapping booking returns 409 with details about conflicting booking. | New booking overlaps existing -> 409 and conflicting booking id. | Client shows conflict. |
| BR-EX-003 | Duplicate vehicle addition returns 409 with link to existing vehicle record. | Add plate already present -> 409. | Suggest manage existing vehicle. |
| BR-EX-004 | Invalid redemption attempt (insufficient points) returns 400 with balance info. | Redeem 1000 pts when only 900 -> 400 message: insufficient. | Client shows deficiency. |
| BR-EX-005 | Tier downgrade conflicts (e.g., simultaneous upgrade and downgrade triggers) resolved by chronological evaluation with admin override. | Edge race resolved by job ordering. | Admin may correct. |
| BR-EX-006 | Branch closed during booking attempt returns 400 with operational message and suggested alternatives. | Branch unexpectedly closed -> 400. | Suggest alternative branches. |
| BR-EX-007 | Fully booked schedule triggers waitlist creation or rejection based on branch policy. | Full -> 202 waitlisted or 409. | Client handles both. |
| BR-EX-008 | Payment provider failures (future) mark booking as PENDING and notify user to retry payment. | Payment network down -> pending. | Retry logic in place. |
| BR-EX-009 | LPR ambiguous matches create a manager-only ticket for manual resolution. | Plate matches two customers -> manager alerted. | Auto-checkin withheld. |
| BR-EX-010 | Webhook signature validation failures drop the event and log an alert. | Invalid signature -> 403. | Incident logged. |
| BR-EX-011 | Out-of-order event arrivals (e.g., check-in after complete) handled idempotently and logged. | Late check-in -> event ignored with warning. | No state change. |
| BR-EX-012 | System-level rate limits throttle abusive endpoints and return 429 with Retry-After. | Excess OTP requests -> 429. | Client must wait. |
| BR-EX-013 | Missing branch/service configuration prevents booking; descriptive error returned. | Service removed -> booking fails. | Admin notified. |
| BR-EX-014 | Data migration anomalies create quarantine records for manual reconciliation. | Import mismatches -> quarantine. | Support intervention required. |
| BR-EX-015 | Promotion oversubscription prevented by atomic decrement of remaining uses; over-requests rejected. | Last promo uses -> one succeeds, others fail. | 409 for losers. |
| BR-EX-016 | Expired tokens return 401 and require refresh or re-login. | Token expired -> 401. | Refresh token flow attempted. |
| BR-EX-017 | Inconsistent ledger states trigger reconciliation job and temporary maintenance mode for write operations. | Balance mismatch found -> maintenance. | Support resolves. |
| BR-EX-018 | Database deadlocks during high concurrency retried automatically with exponential backoff. | Deadlock -> retry operation up to N attempts. | If still fails, escalate. |
| BR-EX-019 | External provider rate limits honored; backoff and queued retry applied. | SMS provider 429 -> queued. | Attempt later. |
| BR-EX-020 | Corrupted or invalid CSV import rows skipped with logged reason; import summary generated. | Bad row -> skip and log. | Admin reviews summary. |
| BR-EX-021 | Incomplete booking creation due to system failure triggers automatic rollback and notification to customer. | DB write fails -> rollback. | Notify customer. |
| BR-EX-022 | Timezone conversion errors flagged and refused for booking creation to avoid incorrect scheduling. | Ambiguous DST -> reject. | Ask user to choose exact timezone. |
| BR-EX-023 | Promotion dispatch partial failures (some recipients failed) retried and failures logged; successes retained. | Mailer fails for subset -> retries. | Reconciliation job after. |
| BR-EX-024 | Unhandled exceptions trigger incident ticket and return generic 500 to client with correlation id. | Null pointer -> 500, correlation id returned. | Engineers trace via logs. |
| BR-EX-025 | Attempt to redeem a promotion that is misconfigured returns 400 and administrator alerted. | Bad perk_json -> 400. | Admin receives alert. |

---

### Cross-cutting Validation Rules
- All phone fields validated via E.164 regex.
- All dates normalized to UTC in backend and interpreted in branch timezone for scheduling.
- All monetary values use DECIMAL(10,2) and consistent rounding rules.
- All inputs validated with Jakarta annotations; errors returned in structured Problem+JSON.

### Operational Rules
- Scheduled jobs: TierEvaluation (monthly), PointsExpiry (daily), PromotionDispatch (scheduled per promo), WaitlistProcessor (near real-time), NotificationDispatcher (async worker).
- Idempotency: POST /bookings and webhook endpoints require Idempotency-Key header processing.
- Backups: Full backup weekly, transaction log backups hourly (configurable).

---

## Appendix: Rule Index (by module)
- Customer: BR-CUS-001..BR-CUS-PF-009
- Vehicle: BR-VEH-001..BR-VEH-017
- Booking: BR-BOOK-001..BR-BOOK-060
- Queue: BR-QUE-001..BR-QUE-015
- Loyalty: BR-LOY-001..BR-LOY-025
- Tier: BR-TIER-001..BR-TIER-020
- Promotion: BR-PRO-001..BR-PRO-020
- Checkout: BR-CH-001..BR-CH-015
- Branch: BR-BR-001..BR-BR-015
- Auth: BR-AUT-001..BR-AUT-010
- Notification: BR-NOT-001..BR-NOT-015
- Reporting: BR-REP-001..BR-REP-015
- Audit: BR-AUD-001..BR-AUD-015
- Exceptions: BR-EX-001..BR-EX-025

End of Business Rules document.
=======
# AutoWash Pro — business-rules.md

Business rules are authoritative declarations; they are enforced in service layer with unit + integration tests.

| Rule ID | Description | Example |
|---|---|---:|
| BR-01 | User Registration Rules: phone required and unique; OTP verification mandatory. | A new user must verify OTP before booking. |
| BR-02 | Vehicle Registration Rules: license_plate unique per branch; optional for user. | Duplicate plates cause validation error. |
| BR-03 | Booking Window Rules: booking window days depend on tier (configurable). | Gold -> 12 days in advance by default. |
| BR-04 | Booking Capacity Rules: branch/service has capacity per slot; overbook blocked. | Slot capacity 10; 11th booking fails. |
| BR-05 | Queue Priority Rules: on full slots, higher tier customers placed earlier in waitlist. | Platinum users jump ahead of Silver in waitlist. |
| BR-06 | Loyalty Point Accumulation Rules: points = floor(amount * accrual_rate). | $50 with rate 1.5 -> 75 points. |
| BR-07 | Loyalty Tier Upgrade Rules: evaluated monthly; upgrade requires points/visits thresholds. | 3 visits and 500 points -> upgrade to Silver. |
| BR-08 | Loyalty Tier Downgrade Rules: inactivity or negative balance triggers downgrade monthly. | <100 points -> downgrade to Member. |
| BR-09 | Point Expiration Rules: points expire after configured months (default 12). | Points granted 2025-06-01 expire 2026-06-01. |
| BR-10 | Redemption Rules: redemption must be ≤ available points; some perks limited per period. | Free wash cost 1000 pts; user with 900 pts cannot redeem. |
| BR-11 | Promotion Eligibility Rules: target filters (tier, branch, last_visit) applied at dispatch. | Promo sent to Silver+ who didn’t visit in 30 days. |
| BR-12 | Analytics Rules: reports computed with snapshot time; sensitive PII anonymized. | LTV computed per customer excluding PII in exports. |

Additional rules suggested:
- BR-13 Cancellation Policy: define time-based fees or point penalties.
- BR-14 No-Show Handling: mark no-shows and apply penalties after N occurrences.
- BR-15 Overlapping Booking Prevention: prevent multiple active bookings at same time for same vehicle.
- BR-16 Promotion Stackability: define whether promotions/discounts can combine.
>>>>>>> Stashed changes
