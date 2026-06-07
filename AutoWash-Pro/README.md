# AutoWash Pro

AutoWash Pro is a Smart Automated Car Wash Management System with Advance Booking and Loyalty Program.

## Technology Stack
- Backend: Java 21, Spring Boot 3, Spring Security, Spring Data JPA, JWT, Maven
- Frontend: React, Vite, Axios, TailwindCSS or Material UI
- Database: SQL Server
- Deployment: Azure or AWS

## Project Structure
```
AutoWash-Pro/
  backend/ (Spring Boot)
  frontend/ (React + Vite)
  database/ (migrations & scripts)
  docs/ (project documentation)
  assets/ (diagrams and images)
```

## Setup Instructions
See individual docs: docs/README.md and docs/03-design/system-architecture.md for environment details.

## Backend (Quickstart)
- JDK 21
- Maven
- Configure application-local.yml with DB and secret settings (use vault/secrets manager in production)
- Run: mvn spring-boot:run (or package and run jar)

## Frontend (Quickstart)
- Node 18+
- pnpm/npm install
- cd frontend && npm install && npm run dev

## Database
- SQL Server instance required. Run migrations (Flyway) in backend on startup or via CLI.

## Documentation
Open docs/README.md for the documentation index.

## Team Members
- Team Leader: TBD
- Backend Dev 1: TBD
- Backend Dev 2: TBD
- Frontend Dev 1: TBD
- Frontend Dev 2: TBD

