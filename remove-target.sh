#!/bin/bash
# This script removes the target/ directory from git history

# Remove from current index
git rm -r --cached backend/car-wash-management-backend/target/

# Commit the removal
git commit -m "Remove target/ directory from git history"

# Optional: Clean up local directory if you want to rebuild
# rm -rf backend/car-wash-management-backend/target/

echo "target/ directory has been removed from git history"
echo "Run 'git push origin main' to push changes to remote"
