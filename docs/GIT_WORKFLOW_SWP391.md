# GIT WORKFLOW SWP391 - TEAM GUIDE

## Branch Structure
main
develop
feature/be-auth-api
feature/be-auth-security
feature/fe-login
feature/fe-register
feature/fe-auth-layout

## Rules
- No direct commit to main
- Only merge into develop
- Each feature = 1 branch

## Workflow

1. Clone repo
git clone <repo-url>

2. Switch to develop
git checkout develop
git pull origin develop

3. Create branch
git checkout -b feature/your-branch

4. Work + commit
git add .
git commit -m "feat: message"

5. Push branch
git push origin feature/your-branch

6. Create Pull Request
feature/* -> develop

## Update latest code
git checkout develop
git pull origin develop

git checkout feature/your-branch
git merge develop

## Commit convention
feat: add feature
fix: bug fix
style: UI update
refactor: code restructure
chore: setup project
