# Copilot instructions for AutoWash-Pro

Purpose: quick, practical guidance for Copilot sessions and automation working in this repository.

---

## Build, test, and lint commands
All commands assume working directory is the repository root (AutoWash-Pro). Use the platform-appropriate wrapper where present.

Backend (Spring Boot, Maven):
- Run app (Windows): cd backend && .\mvnw.cmd spring-boot:run
- Run app (Unix): cd backend && ./mvnw spring-boot:run
- Build artifact (Windows): cd backend && .\mvnw.cmd clean package
- Run tests: cd backend && .\mvnw.cmd test
- Run a single test class/method (Maven Surefire):
  - Class: cd backend && .\mvnw.cmd -Dtest=BackendApplicationTests test
  - Method: cd backend && .\mvnw.cmd -Dtest=BackendApplicationTests#contextLoads test

Frontend (React + Vite, npm):
- Start dev server: cd frontend && npm run dev
- Build production bundle: cd frontend && npm run build
- Preview production build: cd frontend && npm run preview
- Lint (ESLint): cd frontend && npm run lint
- Lint a single file: cd frontend && npm run lint -- src/App.jsx

Notes:
- Backend requires Java 17 (see backend/pom.xml). Use the included Maven wrapper (mvnw/mvnw.cmd).
- Frontend uses Vite; ensure Node installed. There are no frontend test scripts present currently.

---

## High-level architecture (big picture)
- Monorepo named AutoWash-Pro with two main workspaces:
  - backend/: Spring Boot 3.x application (Java 17). Entry point: com.autowash.backend.BackendApplication.
  - frontend/: React app built with Vite (ES modules). Entry: src/main.jsx and src/App.jsx.
- Artifacts & build outputs live under backend/target and frontend/dist (after build).
- Configuration & design docs live under docs/: requirements, API design, ERD, sequence diagrams and sprint planning — use these for feature intent and API expectations.
- The backend is a standard Spring Boot app (starter dependencies + spring-boot-maven-plugin); tests use JUnit Jupiter and SpringBootTest.

---

## Key conventions and repository-specific patterns
- Use the Maven wrapper in backend/ (mvnw on Unix, mvnw.cmd on Windows). Do not invoke global mvn unless necessary.
- Java package root: com.autowash.backend — place new controllers/services under this package to ensure component scanning.
- Tests: JUnit Jupiter + @SpringBootTest for integration-style tests. Use Maven -Dtest to target single classes/methods.
- Frontend uses ESLint with scripts in package.json; prefer passing file paths through the npm script (npm run lint -- <path>) for targeted fixes.
- Do not commit generated files under backend/target. Ignore and avoid editing files in target/.
- Docs under docs/ are the canonical design artifacts (API design, DB design). Refer to them when changing public API or DB schema.

---

## Files consulted and integrated
- README.md (root), backend/README.md, frontend/README.md
- backend/pom.xml (Java version, plugins, test deps)
- frontend/package.json (dev scripts, lint)
- docs/03-design/system-architecture.md and other docs under docs/

---

If you want this file extended to include recommended Node and Java versions, CI workflow snippets, or helper scripts (e.g., docker-compose for local infra), say which one to add.
