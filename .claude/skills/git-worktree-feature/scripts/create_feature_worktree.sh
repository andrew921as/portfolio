#!/usr/bin/env bash
# create_feature_worktree.sh
#
# Creates a new feature branch and a matching git worktree for it, then
# prints the worktree path so the caller can cd into it.
#
# Usage:
#   create_feature_worktree.sh <descriptiveName> [username]
#
# Example:
#   create_feature_worktree.sh addUserAuth Andrew921
#   -> branch: feature/Andrew921/addUserAuth
#   -> worktree: ../worktrees/<repo-name>/addUserAuth

set -euo pipefail

DESCRIPTIVE_NAME="${1:-}"
USERNAME="${2:-Andrew921}"

if [ -z "$DESCRIPTIVE_NAME" ]; then
  echo "ERROR: descriptiveName is required." >&2
  echo "Usage: $0 <descriptiveName> [username]" >&2
  exit 1
fi

# --- Sanity checks -----------------------------------------------------

if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
  echo "ERROR: not inside a git repository." >&2
  exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"

# --- Sanitize the descriptive name into camelCase -----------------------
# Strips anything that isn't alphanumeric, then lowercases the first
# character to keep things consistent even if the caller passed
# "Add User Auth" or "add-user-auth".

sanitize_camel_case() {
  local input="$1"
  # Split on non-alphanumeric boundaries, title-case each word, join.
  local words
  words=$(echo "$input" | grep -oE '[A-Za-z0-9]+')
  local result=""
  local first=true
  while IFS= read -r word; do
    if $first; then
      result+="$(echo "${word:0:1}" | tr '[:upper:]' '[:lower:]')${word:1}"
      first=false
    else
      result+="$(echo "${word:0:1}" | tr '[:lower:]' '[:upper:]')${word:1}"
    fi
  done <<< "$words"
  echo "$result"
}

CLEAN_NAME="$(sanitize_camel_case "$DESCRIPTIVE_NAME")"

if [ -z "$CLEAN_NAME" ]; then
  echo "ERROR: descriptiveName '$DESCRIPTIVE_NAME' had no alphanumeric characters." >&2
  exit 1
fi

BRANCH_NAME="feature/${USERNAME}/${CLEAN_NAME}"
WORKTREE_DIR="${REPO_ROOT}/../worktrees/${REPO_NAME}/${CLEAN_NAME}"

# --- Determine the base branch (main or master) -------------------------

git fetch origin --quiet 2>/dev/null || echo "WARNING: 'git fetch origin' failed, using local refs only." >&2

BASE_BRANCH=""
if git show-ref --verify --quiet refs/remotes/origin/main; then
  BASE_BRANCH="origin/main"
elif git show-ref --verify --quiet refs/remotes/origin/master; then
  BASE_BRANCH="origin/master"
elif git show-ref --verify --quiet refs/heads/main; then
  BASE_BRANCH="main"
elif git show-ref --verify --quiet refs/heads/master; then
  BASE_BRANCH="master"
else
  echo "ERROR: could not find origin/main, origin/master, main, or master to branch from." >&2
  exit 1
fi

# --- Guard against existing branch / worktree ----------------------------

if git show-ref --verify --quiet "refs/heads/${BRANCH_NAME}"; then
  echo "STOP: branch '${BRANCH_NAME}' already exists locally." >&2
  echo "Ask the user whether to reuse it, delete it, or pick a different name before proceeding." >&2
  exit 2
fi

if git show-ref --verify --quiet "refs/remotes/origin/${BRANCH_NAME}"; then
  echo "STOP: branch '${BRANCH_NAME}' already exists on origin." >&2
  echo "Ask the user whether to check it out, delete it, or pick a different name before proceeding." >&2
  exit 2
fi

if [ -e "$WORKTREE_DIR" ]; then
  echo "STOP: worktree path '${WORKTREE_DIR}' already exists." >&2
  echo "Ask the user whether to reuse it, remove it, or pick a different name before proceeding." >&2
  exit 2
fi

# --- Create the branch + worktree in one step -----------------------------

mkdir -p "$(dirname "$WORKTREE_DIR")"

git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$BASE_BRANCH"

echo ""
echo "SUCCESS"
echo "branch=${BRANCH_NAME}"
echo "base=${BASE_BRANCH}"
echo "worktree=${WORKTREE_DIR}"
echo ""
echo "Next: cd \"${WORKTREE_DIR}\" and begin work there."
