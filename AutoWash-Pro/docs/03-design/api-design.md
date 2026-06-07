<<<<<<< Updated upstream
# AutoWash Pro — API Design (REST)

Base URL: /api/v1
Authentication: JWT Bearer tokens in Authorization header: "Authorization: Bearer <access_token>"
All APIs return JSON. Errors conform to Problem+JSON (RFC 7807): {"type","title","status","detail","instance"}.

Security & Authorization
- Use Spring Security with method-level annotations: @PreAuthorize("hasRole('ADMIN')"), @PreAuthorize("hasRole('MANAGER') or hasRole('ADMIN')") or @PreAuthorize("#customerId == principal.id") for scoped checks.
- Access tokens: short-lived (e.g., 1 hour). Refresh tokens stored server-side (RefreshToken table) and used by POST /auth/refresh.
- Sensitive endpoints require role-checks and optional branch-scoped claims.

Validation
- Use Jakarta Validation annotations on DTOs: @NotNull, @Size, @Pattern(regexp="^\\+?[1-9][0-9]{7,14}$") for E.164 phone, @Future for dates, @Min/@Max for numeric ranges.
- Controllers annotated with @Validated and use @ControllerAdvice to translate exceptions to Problem+JSON.

Common Response DTOs
- PagedResponse<T> { List<T> items; int page; int size; long total; }
- ErrorResponse: Problem+JSON

---

Authentication APIs

| Method | Endpoint | Description | Role |
|---|---|---|---|
| POST | /api/v1/auth/otp/send | Send OTP to phone for registration or login | Public |
| POST | /api/v1/auth/otp/verify | Verify OTP and (optionally) create/verify user | Public |
| POST | /api/v1/auth/register | Register a new user (phone + password or OTP) | Public |
| POST | /api/v1/auth/login | Login with phone + password -> returns access and refresh tokens | Public |
| POST | /api/v1/auth/refresh | Exchange refresh token for new access token | Public (requires refresh token cookie/header) |
| POST | /api/v1/auth/logout | Revoke refresh token (server-side) | Authenticated |

POST /api/v1/auth/otp/send
Request:
{
  "phone": "+84123456789",
  "purpose": "REGISTER"  // REGISTER | LOGIN | PASSWORD_RESET
}
Response: 200 OK { "sent": true }
Validation: phone required, E.164 format

POST /api/v1/auth/otp/verify
Request:
{
  "phone": "+84123456789",
  "otp": "123456",
  "createIfMissing": true
}
Response: 200 OK { "accessToken":"...","refreshToken":"...","userId":"uuid","isNew":false }
Notes: createIfMissing controls whether OTP verify auto-creates user.

POST /api/v1/auth/register
Request DTO:
{
  "phone":"+84123456789",
  "password":"P@ssw0rd",
  "name":"Nguyen Van A",
  "otp":"123456" // optional if using OTP flow
}
Validation: password min 8, phone unique
Response: 201 Created { "userId":"uuid","message":"Registered" }

POST /api/v1/auth/login
Request:
{ "phone":"+84123456789", "password":"P@ssw0rd" }
Response: 200 OK
{
  "accessToken":"eyJ...",
  "expiresIn":3600,
  "refreshToken":"<opaque-token>"
}
Errors: 401 Unauthorized on invalid credentials

POST /api/v1/auth/refresh
Request: { "refreshToken":"<opaque>" } or via httpOnly cookie
Response: 200 OK { "accessToken":"...","expiresIn":3600 }

---

Booking APIs

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | /api/v1/branches/{branchId}/slots | List available slots for date & service | Public/Customer |
| GET | /api/v1/bookings | List bookings (scoped by role) | Customer/Manager/Admin |
| POST | /api/v1/bookings | Create booking | Customer |
| GET | /api/v1/bookings/{id} | Get booking detail | Owner/Manager/Admin |
| PUT | /api/v1/bookings/{id} | Update booking (reschedule) | Owner/Manager/Admin |
| DELETE | /api/v1/bookings/{id} | Cancel booking | Owner/Manager/Admin |
| POST | /api/v1/bookings/{id}/checkin | Mark as checked-in (Manager/Staff or automated LPR) | Manager/Admin |

GET /api/v1/branches/{branchId}/slots?serviceId=&date=
Response: 200 OK
[ { "start":"2026-06-10T09:00:00+07:00", "end":"...", "capacityRemaining":3, "priorityLocked":false } ]
Behavior: slot search should compute capacity using Booking, BookingService and consider pending waitlist entries.

POST /api/v1/bookings
Request DTO:
{
  "vehicleId":"uuid",
  "branchId":"uuid",
  "serviceIds":["uuid1"],
  "preferredStart":"2026-06-10T09:00:00+07:00",
  "notes":"...",
  "usePoints": { "points": 100, "redemptionType":"DISCOUNT" }
}
Validation: preferredStart MUST be within tier-dependent booking window; vehicle must belong to customer; services must be active.
Responses:
- 201 Created: booking payload { id, status, scheduled_start, scheduled_end, points_estimated }
- 409 Conflict: capacity exceeded or overlapping booking
- 400 Bad Request: validation errors

PUT /api/v1/bookings/{id}
Body similar to POST to reschedule. Enforce cancellation windows: if within penalty window, return 403 or apply penalty.

DELETE /api/v1/bookings/{id}
Behavior: soft-cancel; record in audit; refund/points adjustment as per business rules.

---

Loyalty APIs

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | /api/v1/loyalty/me | Get current customer's loyalty status and point balance | Customer |
| GET | /api/v1/loyalty/tiers | List configured loyalty tiers | Public |
| GET | /api/v1/loyalty/history | Point ledger history (paged) | Customer |
| POST | /api/v1/loyalty/redeem | Redeem points | Customer |

GET /api/v1/loyalty/me
Response:
{
  "customerId":"uuid",
  "tier": { "id":"uuid","name":"Gold","bookingWindowDays":12 },
  "pointsBalance": 1250,
  "nextTierProgress": { "targetPoints":2000, "currentPoints":1250 }
}

POST /api/v1/loyalty/redeem
Request:
{ "points":1000, "redemptionType":"FREE_WASH", "bookingId":"optional-uuid" }
Validation: Ensure sufficient non-expired points. Use DB transaction to insert LoyaltyPointRecord with negative delta and mark promotion/transaction accordingly.
Responses:
- 200 OK with updated balance
- 400 Bad Request if insufficient points or redemption invalid

---

Promotion APIs

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | /api/v1/promotions | List active promotions | Public/Customer |
| GET | /api/v1/promotions/{id} | Get promotion detail | Public |
| POST | /api/v1/promotions | Create promotion | Admin |
| PUT | /api/v1/promotions/{id} | Update promotion | Admin |
| POST | /api/v1/promotions/{id}/dispatch | Dispatch promotion to targets (async) | Admin |
| GET | /api/v1/promotions/{id}/recipients | View recipients/uses | Admin |

POST /api/v1/promotions
Request DTO:
{
  "name":"Silver Month Promo",
  "description":"10% off for Silver+",
  "startDate":"2026-06-01T00:00:00Z",
  "endDate":"2026-06-30T23:59:59Z",
  "perk": { "type":"PERCENT_DISCOUNT","value":10 },
  "targetCriteria": { "minTier":"Silver","lastVisitDays":30 },
  "maxUses": 1
}
Validation: startDate < endDate; targetCriteria schema validated; perk types enumerated.
Response: 201 Created with promotion id.

POST /api/v1/promotions/{id}/dispatch
Behavior: enqueue job to evaluate PromotionTarget and create Notification entries and PromotionUse records; return 202 Accepted.

---

Admin APIs

| Method | Endpoint | Description | Role |
|---|---|---|---|
| GET | /api/v1/users | List users with filters | Admin |
| GET | /api/v1/users/{id} | Get user detail | Admin |
| POST | /api/v1/users | Create system user | Admin |
| PUT | /api/v1/users/{id} | Update user (including role) | Admin |
| DELETE | /api/v1/users/{id} | Soft-delete user | Admin |
| GET | /api/v1/branches | List branches | Admin/Manager |
| POST | /api/v1/branches | Create branch | Admin |
| PUT | /api/v1/branches/{id} | Update branch | Admin |
| GET | /api/v1/loyalty/tiers | List or create tiers | Admin |
| POST | /api/v1/loyalty/tiers | Create tier | Admin |
| GET | /api/v1/reports/bookings | Booking metrics & CSV export | Admin/Manager |
| GET | /api/v1/audit | Audit logs (filterable) | Admin |

Examples

- GET /api/v1/reports/bookings?from=2026-06-01&to=2026-06-30&branchId={id}&format=csv
Response: 200 OK (text/csv)

- GET /api/v1/audit?entity=Promotion&actorUserId={id}&from=&to=
Response: Paged AuditLog entries.

---

Integrations & Webhooks
- POST /api/v1/integrations/lpr/events — accept LPR events for check-in. Requires idempotency-key header and validation. Auth via HMAC signature or IP restrictions.
- POST /api/v1/webhooks/outbound/{provider} — used by notification worker to send to external providers (internal use).

---

Error Handling & Idempotency
- Use idempotency-key header for POST /bookings and webhook endpoints; store key in a table to prevent duplicate processing.
- Problem+JSON responses contain status and details for client-friendly error messages.

---

DTO Validation Examples (Jakarta annotations)
- BookingRequestDTO {
  @NotNull UUID vehicleId;
  @NotNull UUID branchId;
  @NotEmpty List<@NotNull UUID> serviceIds;
  @NotNull @Future OffsetDateTime preferredStart;
}

- RedeemRequestDTO {
  @NotNull int points; @NotBlank String redemptionType;
}

---

Notes for Implementation (Spring Boot)
- Use Spring Web MVC with controllers organized by module (AuthController, BookingController, LoyaltyController, PromotionController, AdminController).
- Use DTOs and mappers (MapStruct) to transform entities to responses.
- Apply transactional boundaries at service layer (@Transactional).
- Use @PreAuthorize for endpoint protection; validate branch-scoped claims when Manager role accesses branch-scoped data.
- Expose OpenAPI via springdoc-openapi and secure swagger UI behind role-based access.

End of API design document.
=======
# AutoWash Pro — api-design.md

Base: /api/v1
Auth: Bearer JWT (Authorization: Bearer <token>)
HTTP: Use standard status codes; return Problem+JSON for errors.

## Authentication Module
- POST /api/v1/auth/register
  - Description: Register new user (Customer)
  - Role: Public
  - Request DTO:
    { "phone": "string", "name": "string", "password": "string (min8)", "otp": "string (optional for verify)"} 
  - Response DTO:
    { "userId": "uuid", "phone":"", "verified":false }
  - Validation: phone E.164, password min 8, unique phone
  - Status: 201 Created / 400 Bad Request
- POST /api/v1/auth/login
  - Request: { "phone": "string", "password": "string" }
  - Response: { "accessToken":"jwt", "expiresIn":3600, "refreshToken":"token" }
  - Status: 200 / 401

- POST /api/v1/auth/otp/send
  - Request: { "phone": "string" } → 200

- POST /api/v1/auth/otp/verify
  - Request: { "phone", "otp" } → marks verified → 200

## Users Module (Admin)
- GET /api/v1/users
  - List users (Admin only), pagination, filters
  - Role: Admin
- GET /api/v1/users/{id}
  - Role: Admin
- PUT /api/v1/users/{id}
  - Role: Admin

## Customers Module
- GET /api/v1/customers/me
  - Role: Customer
  - Response: profile, tier, points_balance
- PUT /api/v1/customers/me
  - Update profile (name, preferences)

## Vehicles Module
- POST /api/v1/vehicles
  - Role: Customer
  - Request:
    { "licensePlate":"string", "type":"car|motorbike", "nickname":"string" }
  - Response: 201 location /vehicles/{id}
- GET /api/v1/vehicles
  - List user's vehicles
- PUT /api/v1/vehicles/{id}
- DELETE /api/v1/vehicles/{id}
  - Validation: prevent deletion if active booking exists

## Branches & Services
- GET /api/v1/branches
  - Public: list branches with capacities & services
- GET /api/v1/branches/{id}/services
- POST /api/v1/branches (Admin)
- PUT /api/v1/branches/{id} (Admin)

## Booking Module
- GET /api/v1/bookings
  - Role: Customer returns user's bookings; Manager returns branch bookings; Admin universal (query filters)
- POST /api/v1/bookings
  - Role: Customer
  - Request DTO:
    {
      "customerId":"uuid (optional if token)",
      "vehicleId":"uuid",
      "branchId":"uuid",
      "serviceIds":[uuid],
      "preferredDatetime":"ISO8601",
      "notes":"string",
      "paymentReference":"string (optional)"
    }
  - Validation:
    - slot within booking window per tier
    - capacity check
    - vehicle not double-booked overlapping
  - Responses:
    - 201 Created with booking payload and estimated points_awarded
    - 409 Conflict for capacity/overlap
- PUT /api/v1/bookings/{id}
  - Role: Customer (own booking), Manager/Admin
  - For reschedule/cancel. Cancellation policy enforced.
  - Status: 200 / 400 / 403
- DELETE /api/v1/bookings/{id}
  - Role: Customer (own), Manager/Admin
  - 204 No Content

## Booking slot-search
- GET /api/v1/branches/{id}/slots?serviceId=&date=
  - Role: Public/Customer
  - Returns available slots with priority weighting

## Loyalty Module
- GET /api/v1/loyalty/me
  - Points balance, tier, history
- GET /api/v1/loyalty/tiers
  - List configured tiers (Admin read)
- POST /api/v1/loyalty/redeem
  - Request:
    { "customerId", "points", "redemptionType", "bookingId" (optional) }
  - Validation: sufficient points, expiry
  - Responses: 200 with updated balance / 400

## Promotions Module
- GET /api/v1/promotions
  - Returns active promotions (Customer)
- POST /api/v1/promotions (Admin)
  - Body:
    { "name","targetCriteria":{"minTier":"Silver","lastVisitDays":30},"perk":{"type":"discount","value":10},"startDate","endDate","maxUses" }

## Reports & Dashboard
- GET /api/v1/reports/loyalty?from=&to=&branchId=
  - Role: Admin/Manager scoped
  - Response: aggregated metrics
- GET /api/v1/reports/bookings?from=&to=&groupBy=
  - CSV export supported via Accept: text/csv

## Notifications
- POST /api/v1/notifications/send (Admin)
  - Target via promotion or criteria

## Security & Authorization
- All protected endpoints require Authorization: Bearer <jwt>
- Roles checked via Spring Security annotations (@PreAuthorize("hasRole('ADMIN')"))
- Refresh tokens endpoint: POST /api/v1/auth/refresh

## Error Handling
- Use Problem JSON (RFC 7807) with code, message, details
- Standard codes: 200,201,204,400,401,403,404,409,500

## JWT Authorization Requirements
- Access token expiry short (e.g., 1 hour), refresh token longer
- Token contains roles and tenant/branch claims where applicable

## Examples & Validation
- Use jakarta.validation annotations (@NotNull, @Pattern, @Future)
- Centralized ControllerAdvice for exception translation

## Missing API suggestions
- Webhook endpoints for LPR events: POST /api/v1/integrations/lpr/events
- Health and metrics: /actuator (Spring Boot)
- Admin audit logs: GET /api/v1/audit
>>>>>>> Stashed changes
