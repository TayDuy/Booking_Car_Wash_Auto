<<<<<<< Updated upstream
# AutoWash Pro — Database Design (SQL Server)

This document defines the SQL Server database design for AutoWash Pro. It includes entity descriptions, table DDLs, primary and foreign keys, constraints, indexes, and notes on transactional safety and maintenance. The design targets at least 10 entities covering the booking, loyalty, promotions, users, and integration needs described in the SRS (Topic.md).

Design principles
- Use UNIQUEIDENTIFIER (GUID) as public identifiers (NEWID()).
- Use datetime2(3) for timestamps (UTC).
- Normalize to 3NF, keep audit/ledger tables immutable where practical (append-only).
- Use rowversion (timestamp) for optimistic concurrency on frequently updated aggregates (e.g., points_balance).
- Use appropriate indexes for slot search and reporting workloads.
- Use soft deletes (is_deleted, deleted_at) for auditability when necessary.

Entities (overview)
1. Role
2. [User]
3. CustomerProfile
4. Vehicle
5. Branch
6. Service
7. Booking
8. BookingService
9. Transaction
10. LoyaltyTier
11. LoyaltyPointRecord
12. Promotion
13. PromotionTarget
14. Waitlist
15. AuditLog
16. RefreshToken
17. WebhookDelivery

---

Entity: Role
Description: System roles for RBAC (ADMIN, MANAGER, CUSTOMER, STAFF).

CREATE TABLE dbo.Role (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(50) NOT NULL UNIQUE,
  description NVARCHAR(256) NULL
);

Index/Constraints: UNIQUE(name)

---

Entity: User
Description: Authentication principal. A user may map to a CustomerProfile.

CREATE TABLE dbo.[User] (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  phone NVARCHAR(16) NOT NULL UNIQUE,
  email NVARCHAR(254) NULL,
  password_hash NVARCHAR(256) NOT NULL,
  is_verified BIT NOT NULL DEFAULT 0,
  role_id UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  is_deleted BIT NOT NULL DEFAULT 0,
  deleted_at DATETIME2(3) NULL,
  CONSTRAINT FK_User_Role FOREIGN KEY (role_id) REFERENCES dbo.Role(id)
);

Indexes:
- UNIQUE INDEX IX_User_Phone ON dbo.[User](phone)
- INDEX IX_User_Role_CreatedAt ON dbo.[User](role_id, created_at)

Notes: phone normalized to E.164 on input.

---

Entity: CustomerProfile
Description: Domain profile for customers; caches tier and points for quick access.

CREATE TABLE dbo.CustomerProfile (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL UNIQUE,
  tier_id UNIQUEIDENTIFIER NULL,
  points_balance INT NOT NULL DEFAULT 0,
  signup_date DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  row_version ROWVERSION,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT FK_CustomerProfile_User FOREIGN KEY (user_id) REFERENCES dbo.[User](id),
  CONSTRAINT FK_CustomerProfile_Tier FOREIGN KEY (tier_id) REFERENCES dbo.LoyaltyTier(id)
);

Indexes:
- UNIQUE INDEX UQ_CustomerProfile_User ON dbo.CustomerProfile(user_id)
- INDEX IX_CustomerProfile_Tier ON dbo.CustomerProfile(tier_id)

Notes: points_balance is a cached aggregate from LoyaltyPointRecord; updates guarded by optimistic concurrency using row_version.

---

Entity: Vehicle
Description: Vehicles owned by customers; license_plate unique per branch (or global configurable).

CREATE TABLE dbo.Vehicle (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  customer_id UNIQUEIDENTIFIER NOT NULL,
  branch_id UNIQUEIDENTIFIER NULL,
  license_plate NVARCHAR(32) NOT NULL,
  type NVARCHAR(20) NOT NULL, -- 'CAR'|'MOTORBIKE'
  nickname NVARCHAR(64) NULL,
  is_active BIT NOT NULL DEFAULT 1,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Vehicle_Customer FOREIGN KEY (customer_id) REFERENCES dbo.CustomerProfile(id),
  CONSTRAINT FK_Vehicle_Branch FOREIGN KEY (branch_id) REFERENCES dbo.Branch(id)
);

-- Unique constraint: license_plate per branch (branch_id NULLs treated specially)
CREATE UNIQUE INDEX UQ_Vehicle_Branch_Plate ON dbo.Vehicle(branch_id, license_plate);

Indexes:
- IX_Vehicle_Customer ON dbo.Vehicle(customer_id)
- IX_Vehicle_Plate ON dbo.Vehicle(license_plate)

Notes: license_plate normalized to uppercase and stripped of non-alphanumerics at ingestion.

---

Entity: Branch
Description: Physical wash locations and their configurations (timezone, capacity defaults).

CREATE TABLE dbo.Branch (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(150) NOT NULL,
  address NVARCHAR(300) NULL,
  timezone NVARCHAR(50) NOT NULL,
  default_capacity INT NOT NULL DEFAULT 10,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1
);

Indexes:
- IX_Branch_Name ON dbo.Branch(name);

---

Entity: Service
Description: Service catalog item (e.g., Standard Wash) with duration and price.

CREATE TABLE dbo.Service (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(120) NOT NULL,
  duration_minutes INT NOT NULL,
  base_price DECIMAL(10,2) NOT NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  is_active BIT NOT NULL DEFAULT 1
);

Indexes:
- IX_Service_Name ON dbo.Service(name);

---

Entity: Booking
Description: Represents a scheduled booking tied to a customer, vehicle, branch and timeslot.

CREATE TABLE dbo.Booking (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  customer_id UNIQUEIDENTIFIER NOT NULL,
  vehicle_id UNIQUEIDENTIFIER NOT NULL,
  branch_id UNIQUEIDENTIFIER NOT NULL,
  scheduled_start DATETIME2(3) NOT NULL,
  scheduled_end DATETIME2(3) NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING/CONFIRMED/CANCELLED/NO_SHOW
  total_amount DECIMAL(10,2) NOT NULL,
  points_awarded INT NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  updated_at DATETIME2(3) NULL,
  is_deleted BIT NOT NULL DEFAULT 0,
  CONSTRAINT FK_Booking_Customer FOREIGN KEY (customer_id) REFERENCES dbo.CustomerProfile(id),
  CONSTRAINT FK_Booking_Vehicle FOREIGN KEY (vehicle_id) REFERENCES dbo.Vehicle(id),
  CONSTRAINT FK_Booking_Branch FOREIGN KEY (branch_id) REFERENCES dbo.Branch(id)
);

Indexes:
- IX_Booking_Branch_ScheduledStart ON dbo.Booking(branch_id, scheduled_start);
- IX_Booking_Vehicle_ScheduledStart ON dbo.Booking(vehicle_id, scheduled_start);
- IX_Booking_Status ON dbo.Booking(status);

Constraints & Notes:
- Overlapping bookings for the same vehicle must be prevented by the application using a SERIALIZABLE transaction isolation or explicit slot reservation row (see Waitlist below).
- scheduled_end should equal scheduled_start + SUM(service.duration_minutes).

---

Entity: BookingService
Description: Many-to-many mapping between Booking and Service, with quantity.

CREATE TABLE dbo.BookingService (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  booking_id UNIQUEIDENTIFIER NOT NULL,
  service_id UNIQUEIDENTIFIER NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  CONSTRAINT FK_BookingService_Booking FOREIGN KEY (booking_id) REFERENCES dbo.Booking(id),
  CONSTRAINT FK_BookingService_Service FOREIGN KEY (service_id) REFERENCES dbo.Service(id)
);

Indexes:
- IX_BookingService_Booking ON dbo.BookingService(booking_id);

---

Entity: Transaction
Description: Financial and points transaction related to a booking. Keeps ledger of amounts and point deltas.

CREATE TABLE dbo.[Transaction] (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  booking_id UNIQUEIDENTIFIER NULL,
  amount DECIMAL(10,2) NOT NULL,
  points_awarded INT NOT NULL DEFAULT 0,
  points_redeemed INT NOT NULL DEFAULT 0,
  payment_reference NVARCHAR(200) NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Transaction_Booking FOREIGN KEY (booking_id) REFERENCES dbo.Booking(id)
);

Indexes:
- IX_Transaction_Booking ON dbo.[Transaction](booking_id);

---

Entity: LoyaltyTier
Description: Defines tier levels and associated rules (booking window, accrual rate).

CREATE TABLE dbo.LoyaltyTier (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(50) NOT NULL UNIQUE,
  min_points INT NOT NULL DEFAULT 0,
  booking_window_days INT NOT NULL DEFAULT 7,
  accrual_rate DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  perks_json NVARCHAR(MAX) NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

Indexes:
- UNIQUE INDEX UQ_LoyaltyTier_Name ON dbo.LoyaltyTier(name);

---

Entity: LoyaltyPointRecord
Description: Immutable ledger entries recording point deltas, reason, expiry.

CREATE TABLE dbo.LoyaltyPointRecord (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  customer_id UNIQUEIDENTIFIER NOT NULL,
  delta INT NOT NULL,
  reason NVARCHAR(256) NOT NULL,
  expiry_date DATETIME2(3) NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_LoyaltyPointRecord_Customer FOREIGN KEY (customer_id) REFERENCES dbo.CustomerProfile(id)
);

Indexes:
- IX_LoyaltyPointRecord_Customer_Expiry ON dbo.LoyaltyPointRecord(customer_id, expiry_date);

Notes: points_balance in CustomerProfile is a cached sum of active LoyaltyPointRecord entries (sum of delta where not expired).

---

Entity: Promotion
Description: Promotions created by Admin with perks and metadata.

CREATE TABLE dbo.Promotion (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  name NVARCHAR(150) NOT NULL,
  description NVARCHAR(1024) NULL,
  start_date DATETIME2(3) NOT NULL,
  end_date DATETIME2(3) NOT NULL,
  perk_json NVARCHAR(MAX) NULL, -- example: {"type":"discount","value":10}
  max_uses INT NULL, -- per-customer or global depending on promotion_target_type
  created_by UNIQUEIDENTIFIER NOT NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_Promotion_Creator FOREIGN KEY (created_by) REFERENCES dbo.[User](id)
);

Indexes:
- IX_Promotion_Start_End ON dbo.Promotion(start_date, end_date);

Entity: PromotionTarget
Description: Stores targeting criteria as JSON and links to Promotion; may be expanded with normalized columns for reporting.

CREATE TABLE dbo.PromotionTarget (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  promotion_id UNIQUEIDENTIFIER NOT NULL,
  criteria_json NVARCHAR(MAX) NOT NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_PromotionTarget_Promotion FOREIGN KEY (promotion_id) REFERENCES dbo.Promotion(id)
);

---

Entity: Waitlist
Description: Waitlist entries for fully-booked slots, ordered by priority and created_at. When slots free, entries are promoted.

CREATE TABLE dbo.Waitlist (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  booking_request_id UNIQUEIDENTIFIER NULL, -- stores proposed booking attributes or reference to Booking if created
  customer_id UNIQUEIDENTIFIER NOT NULL,
  branch_id UNIQUEIDENTIFIER NOT NULL,
  requested_start DATETIME2(3) NOT NULL,
  status NVARCHAR(30) NOT NULL DEFAULT 'PENDING', -- PENDING/OFFERED/CONFIRMED/CANCELLED
  priority INT NOT NULL DEFAULT 0,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  expiry_at DATETIME2(3) NULL,
  CONSTRAINT FK_Waitlist_Customer FOREIGN KEY (customer_id) REFERENCES dbo.CustomerProfile(id),
  CONSTRAINT FK_Waitlist_Branch FOREIGN KEY (branch_id) REFERENCES dbo.Branch(id)
);

Indexes:
- IX_Waitlist_Branch_Status_Priority ON dbo.Waitlist(branch_id, status, priority DESC, created_at);

Notes: priority computed by tier and timestamp; promotion algorithm should be idempotent.

---

Entity: AuditLog
Description: Tracks administrative actions and important system events for compliance.

CREATE TABLE dbo.AuditLog (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  actor_user_id UNIQUEIDENTIFIER NULL,
  entity NVARCHAR(100) NOT NULL,
  entity_id UNIQUEIDENTIFIER NULL,
  action NVARCHAR(100) NOT NULL,
  details NVARCHAR(MAX) NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  CONSTRAINT FK_AuditLog_User FOREIGN KEY (actor_user_id) REFERENCES dbo.[User](id)
);

Indexes:
- IX_AuditLog_Entity_CreatedAt ON dbo.AuditLog(entity, created_at);

---

Entity: RefreshToken
Description: Persisted refresh tokens to support revocation and device management.

CREATE TABLE dbo.RefreshToken (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  user_id UNIQUEIDENTIFIER NOT NULL,
  token_hash NVARCHAR(256) NOT NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME(),
  expires_at DATETIME2(3) NOT NULL,
  revoked BIT NOT NULL DEFAULT 0,
  revoked_at DATETIME2(3) NULL,
  replaced_by_token UNIQUEIDENTIFIER NULL,
  CONSTRAINT FK_RefreshToken_User FOREIGN KEY (user_id) REFERENCES dbo.[User](id)
);

Indexes:
- IX_RefreshToken_User_Expires ON dbo.RefreshToken(user_id, expires_at);

Notes: Store only a hash of the refresh token for security.

---

Entity: WebhookDelivery
Description: Tracks outbound/inbound webhook events for reliability and retries (e.g., LPR events proxy, delivery attempts).

CREATE TABLE dbo.WebhookDelivery (
  id UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
  source NVARCHAR(100) NOT NULL,
  payload NVARCHAR(MAX) NOT NULL,
  status NVARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING/SENT/FAILED/RETRIED
  attempts INT NOT NULL DEFAULT 0,
  last_attempt_at DATETIME2(3) NULL,
  created_at DATETIME2(3) NOT NULL DEFAULT SYSUTCDATETIME()
);

Indexes:
- IX_WebhookDelivery_Status ON dbo.WebhookDelivery(status, created_at);

---

Additional Implementation Notes
- Migrations: Use Flyway for schema migrations; store migration SQL in /database/migrations.
- Seed Data: Provide seed data for roles, default loyalty tiers, sample branches and services for development/staging.
- Concurrency: Use SERIALIZABLE or explicit application-level locks for critical allocation flows (slot reservation) or implement a Slot table representing discrete capacity units.
- Soft Deletes: Use is_deleted + deleted_at instead of hard deletes for Booking/Vehicle/User/Audit sensitive data; purge policy executed per retention rules.
- Stored Procedures: Prefer application-managed transactions for business logic; use stored procs only for heavy-reporting or batch jobs if required.
- Backups & DR: Configure full and differential backups; transaction log backups at frequent intervals; consider geo-replication in production.

End of database design document.
=======
# AutoWash Pro — database-design.md

Design principles: 3NF, referential integrity, sensible indexing for read-heavy reporting and transactional safety for bookings/points. Use schemas (e.g., dbo), use GUID/UUID for public IDs, identity for internal keys where suitable. Use SQL Server types.

## Entities and sample columns

(Truncated here — full definitions in file stored in docs.)

Refer to created ERD for relationships and SQL snippets.
>>>>>>> Stashed changes
