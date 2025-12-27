#!/bin/bash
set -e

echo "Running security checks..."
echo ""

# Check .env is not staged
if git diff --cached --name-only 2>/dev/null | grep -E '^\.env$|^\.env\.' | grep -v '\.example$'; then
  echo "ERROR: .env file is staged for commit!"
  exit 1
fi

# Check for common secret patterns in staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM 2>/dev/null)
if [ -n "$STAGED_FILES" ]; then
  # Check for hardcoded secrets
  if echo "$STAGED_FILES" | xargs grep -l -E '(password|secret|api_key|apikey|token)\s*[:=]\s*["\047][^"\047]{8,}["\047]' 2>/dev/null; then
    echo "WARNING: Possible secrets found in staged files - please verify"
  fi

  # Check for NEXT_PUBLIC_* secrets (common mistake)
  if echo "$STAGED_FILES" | xargs grep -l -E 'NEXT_PUBLIC_.*SECRET|NEXT_PUBLIC_.*KEY.*=.*[a-zA-Z0-9]{20,}' 2>/dev/null; then
    echo "ERROR: Secrets in NEXT_PUBLIC_* env vars are exposed to client!"
    exit 1
  fi
fi

# Dependency audit
if [ -f "package.json" ]; then
  echo "Checking npm dependencies..."
  npm audit --audit-level=high 2>/dev/null || echo "Warning: npm audit found issues"
fi

echo ""
echo "Security checks complete!"
