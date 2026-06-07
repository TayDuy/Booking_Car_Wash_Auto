# AutoWash Pro — usecase-diagram.md

## Actors & Responsibilities
- Customer: register, login, manage profile & vehicles, book/cancel, redeem rewards, view loyalty.
- Manager: manage branch bookings, view branch reports, assist customers.
- Admin: manage tiers, promotions, branches, users, system settings, global reports.

## Use Cases
- Register, Login, Recover Password
- Manage Profile
- Manage Vehicles
- Search Branch & Slots
- Book Wash
- Cancel/Reschedule Booking
- Check-in (via LPR or manually)
- Redeem Rewards
- View Booking & Transaction History
- Admin: Manage Tiers, Promotions, Branches, Reports, Users

## Mermaid Use Case Diagram
```mermaid
%%{init: {'theme': 'default'}}%%
usecaseDiagram
  actor Customer
  actor Manager
  actor Admin

  Customer --> (Register)
  Customer --> (Login)
  Customer --> (Manage Profile)
  Customer --> (Manage Vehicles)
  Customer --> (Search Branch & Slots)
  Customer --> (Book Wash)
  Customer --> (Cancel/Reschedule Booking)
  Customer --> (View Booking History)
  Customer --> (Redeem Rewards)

  Manager --> (Manage Bookings)
  Manager --> (View Branch Reports)
  Manager --> (Assist Customer)

  Admin --> (Manage Users)
  Admin --> (Manage Tiers)
  Admin --> (Manage Promotions)
  Admin --> (Manage Branches)
  Admin --> (View Global Reports)
```

Permissions summary
- Customer: self-scope operations only
- Manager: branch-scope operations + limited editing
- Admin: global configuration and audit
