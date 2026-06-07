<<<<<<< Updated upstream
UI Wireframe (placeholder)

=======
# AutoWash Pro — ui-wireframe.md

Recommended UI Framework: TailwindCSS or Material UI (MUI). React + Vite + React Router.

Suggested folder structure (React)
```
/frontend
  /src
    /api
    /auth
    /components
      /common
      /customer
      /admin
      /manager
    /pages
    /routes
    /store (zustand or Redux Toolkit)
    /styles
    main.jsx
```

State management
- Use Redux Toolkit or Zustand for session & global state; React Query for server data caching.

Navigation & Routing
- Public routes: /, /login, /register, /forgot
- Protected routes with role-based guards

Pages & Details

Public Pages
- Landing Page
  - Purpose: Marketing + branch search
  - Components: Hero, Features, Branch list, CTA
  - API Calls: GET /api/v1/branches
- Login
  - Components: Phone/Password, OTP modal
  - Actions: Authenticate → store JWT
- Register
  - Actions: send OTP, verify

Customer Pages
- Dashboard
  - Purpose: Overview (next booking, points, promotions)
  - Components: Upcoming booking card, loyalty summary, quick book
  - API: GET /api/v1/customers/me, GET /api/v1/promotions
- Profile
  - Update profile, view documents
  - API: PUT /api/v1/customers/me
- Vehicle Management
  - List, add, remove vehicles
  - API: GET/POST/PUT/DELETE /api/v1/vehicles
- Booking Page
  - Search branch & available slots
  - Slot picker, service selector, summary, redeem points toggle
  - API: GET /api/v1/branches/{id}/slots, POST /api/v1/bookings
- Booking History
  - Paginated list with filters
  - API: GET /api/v1/bookings?customerId=me
- Loyalty Dashboard
  - Tier progress bar, point history
  - API: GET /api/v1/loyalty/me

Manager Pages
- Dashboard
  - Branch KPIs, upcoming bookings, check-ins
  - API: GET /api/v1/reports/bookings?branchId=
- Booking Management
  - Calendar/list, assign staff (future), mark no-show
  - API: GET/PUT /api/v1/bookings
- Customer Management
  - Search customers, view profiles
  - API: GET /api/v1/customers?branchId=

Admin Pages
- Dashboard
  - System-wide KPIs
  - API: GET /api/v1/reports/*
- User Management
  - CRUD users, assign roles
  - API: GET/POST/PUT/DELETE /api/v1/users
- Loyalty Configuration
  - Manage tiers, accrual rates
  - API: GET/POST/PUT /api/v1/loyalty/tiers
- Promotion Management
  - Create schedules & targets
  - API: /api/v1/promotions
- Reports
  - Export CSV, schedule jobs
  - API: /api/v1/reports

UI Components (reusable)
- AuthForm, OTPModal, SlotPicker, ServiceSelector, TierProgress, PromoCard, CSVExportButton, RoleGuard

State Management Requirements
- Auth slice: token, refresh token, user roles
- Booking slice: current booking flow (atomic)
- Cache server lists with React Query; stale-while-revalidate patterns

Accessibility & UX
- Keyboard navigable slot picker, aria labels, color contrast for tier badges
- Mobile-first responsive layout

Security in UI
- Never store sensitive data in localStorage unencrypted. Use httpOnly cookies for refresh token if possible.
>>>>>>> Stashed changes
