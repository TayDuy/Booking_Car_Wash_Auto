<<<<<<< Updated upstream
Team Workflow (placeholder)

=======
# AutoWash Pro — team-workflow.md

Team (5):
1. Team Leader — coordination, backlog, sprint planning, PR merge
2. Backend Dev 1 — Auth, Users, Vehicles, DB models
3. Backend Dev 2 — Booking, Loyalty, Promotions, Reports
4. Frontend Dev 1 — Customer UI, booking flows
5. Frontend Dev 2 — Admin & Manager UI, dashboards

## Git Strategy
- Branches:
  - main (protected)
  - develop (integration)
  - feature/{area}-{short}
  - hotfix/{issue}
  - release/{version}
- Examples:
  - feature/be-auth
  - feature/be-booking
  - feature/fe-customer-dashboard

## Pull Request Flow
- PR from feature to develop
- PR template: description, linked ticket, screenshots, testing steps
- Min 1 reviewer + Team Leader approval for backend; 2 reviewers for release merges
- CI runs: build, unit tests, integration tests via GitHub Actions
- Squash merge with conventional commit message

## Code Review Rules
- Enforce coding standards (Checkstyle/SpotBugs for Java; ESLint/Prettier for React)
- Review for security (no secrets), proper error handling, tests
- PR size limit: <= 400 LOC preferred

## Sprint Workflow
- 2-week sprints
- Sprint planning: assign user stories, estimate with story points
- Daily standups (15m)
- Mid-sprint demo + end-sprint retrospective
- Use Jira/GitHub Issues for tracking; label by area & priority

## Task Assignment Matrix (example)
| Component | Backend Dev 1 | Backend Dev 2 | Frontend Dev 1 | Frontend Dev 2 | Team Leader |
|---|---:|---:|---:|---:|---:|
| Auth & Users | Primary | Secondary | Support |  | Oversee |
| Booking | Secondary | Primary | Primary | Support | Oversee |
| Loyalty | Secondary | Primary | Support | Primary | Oversee |
| Promotions | Secondary | Primary | Support | Primary | Oversee |
| Reports | Primary | Primary | Support | Support | Oversee |

## Definition of Done
- Code compiles, unit tests pass (>= 90% critical paths)
- Integration tests for endpoints present
- API documented (OpenAPI/Swagger)
- PR approved and merged to develop
- Updated docs (if contract changed)
- Demoed on staging

## Git Commit Convention
- feat: new feature
- fix: bug fix
- refactor: code change without feature
- docs: documentation
- test: adding/updating tests
- chore: build or CI changes

Commit message example:
"feat(bookings): add slot-search endpoint for branch slots

Closes: #123
Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

## CI/CD & Environments
- Use GitHub Actions; pipelines:
  - PR: build, lint, unit tests
  - develop: deploy to staging (Azure App Service / AWS ECS)
  - main: deploy to production with manual approval
- Use infrastructure as code (ARM/Terraform) for reproducible environments

## Project Folder Structure
```
/backend
  /src/main/java (package: com.autowash)
  /src/test
  /resources (application.yml + profiles)
  pom.xml
/frontend
  /src
  package.json
/docs
  requirements.md
  api-design.md
  database-design.md
  ...
```
>>>>>>> Stashed changes
