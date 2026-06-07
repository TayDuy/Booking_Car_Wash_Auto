<<<<<<< Updated upstream
ERD Diagram (placeholder)
=======
# AutoWash Pro — erd-diagram.md

## Mermaid ER Diagram
```mermaid
erDiagram
  ROLE {
    uniqueidentifier id PK
    nvarchar name
  }
  "USER" {
    uniqueidentifier id PK
    nvarchar phone
    nvarchar password_hash
    nvarchar name
    bit is_verified
  }
  CUSTOMERPROFILE {
    uniqueidentifier id PK
    uniqueidentifier user_id FK
    uniqueidentifier tier_id FK
    int points_balance
  }
  VEHICLE {
    uniqueidentifier id PK
    uniqueidentifier customer_id FK
    nvarchar license_plate
    nvarchar type
  }
  BRANCH {
    uniqueidentifier id PK
    nvarchar name
    nvarchar address
  }
  SERVICE {
    uniqueidentifier id PK
    nvarchar name
    int duration_minutes
  }
  BOOKING {
    uniqueidentifier id PK
    uniqueidentifier customer_id FK
    uniqueidentifier vehicle_id FK
    uniqueidentifier branch_id FK
    datetime2 scheduled_start
    datetime2 scheduled_end
    nvarchar status
  }
  BOOKINGSERVICE {
    uniqueidentifier id PK
    uniqueidentifier booking_id FK
    uniqueidentifier service_id FK
    int qty
  }
  TRANSACTION {
    uniqueidentifier id PK
    uniqueidentifier booking_id FK
    decimal amount
    int points_awarded
    int points_redeemed
  }
  PROMOTION {
    uniqueidentifier id PK
    nvarchar name
    datetime2 start_date
    datetime2 end_date
  }
  PROMOTIONTARGET {
    uniqueidentifier id PK
    uniqueidentifier promotion_id FK
    nvarchar criteria_json
  }
  LOYALTYTIER {
    uniqueidentifier id PK
    nvarchar name
    int min_points
  }
  LOYALTYPOINTRECORD {
    uniqueidentifier id PK
    uniqueidentifier customer_id FK
    int delta
    datetime2 expiry_date
  }

  "USER" ||--o{ CUSTOMERPROFILE : "has"
  CUSTOMERPROFILE ||--o{ VEHICLE : "owns"
  CUSTOMERPROFILE ||--o{ BOOKING : "makes"
  VEHICLE ||--o{ BOOKING : "used in"
  BRANCH ||--o{ BOOKING : "hosts"
  BOOKING ||--o{ BOOKINGSERVICE : "includes"
  SERVICE ||--o{ BOOKINGSERVICE : "used in"
  BOOKING ||--o{ TRANSACTION : "billed by"
  PROMOTION ||--o{ PROMOTIONTARGET : "targets"
  LOYALTYTIER ||--o{ CUSTOMERPROFILE : "assigned to"
  CUSTOMERPROFILE ||--o{ LOYALTYPOINTRECORD : "has"
```

## Relationship explanation
- One User -> One CustomerProfile (one-to-one)
- One CustomerProfile -> Many Vehicles
- Booking references CustomerProfile, Vehicle, Branch
- Many-to-many between Booking and Service via BookingService
- LoyaltyPointRecord tracks each point delta and expiry for audit
>>>>>>> Stashed changes

