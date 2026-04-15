#!/usr/bin/env bash
# Auto-deploy hook: commits file changes and pushes to main so Vercel auto-deploys prod.
# Fires on Claude Code Stop event. Runs async — does not block the next prompt.
# Skips turns where nothing changed. Refuses to commit secret-looking files.

set -u
REPO="/Users/dhruvshah/LEADERSHIP FEDERATION/theleadershipfederation"
LOG="$REPO/.claude/auto-deploy.log"

cd "$REPO" || exit 0

ts() { date "+%Y-%m-%d %H:%M:%S"; }
log() { echo "[$(ts)] $*" >> "$LOG"; }

# 1. Bail if working tree is clean (no tracked changes + no untracked files)
if git diff --quiet && git diff --cached --quiet && [ -z "$(git ls-files --others --exclude-standard)" ]; then
  exit 0
fi

# 2. Refuse if any untracked secret-looking file would be added
SECRETS=$(git ls-files --others --exclude-standard | grep -E '\.(env|pem|key)($|\.)' || true)
if [ -n "$SECRETS" ]; then
  log "BLOCKED: untracked secret-looking files present:"
  echo "$SECRETS" | sed 's/^/  /' >> "$LOG"
  exit 0
fi

# 3. Build a short commit message from changed paths (top 3)
CHANGED=$(git status --porcelain | awk '{print $2}' | head -3 | tr '\n' ' ' | sed 's/ $//')
MSG="auto: ${CHANGED:-update}"

# 4. Stage, commit, push
git add -A >> "$LOG" 2>&1
if ! git commit -m "$MSG" >> "$LOG" 2>&1; then
  log "commit failed (nothing staged or hook rejected); aborting"
  exit 0
fi

log "commit OK: $MSG"
if git push origin main >> "$LOG" 2>&1; then
  log "push OK → Vercel should deploy shortly"
else
  log "PUSH FAILED — check log above"
fi
