---
name: git-feature-worktree
description: Sets up an isolated git branch + worktree before starting any new feature, implementation, refactor, or bug fix in a git repository. Trigger this automatically whenever you are about to begin substantive coding work on something new — not just when the user explicitly says "create a worktree" or "make a branch". Phrases like "let's build X", "implement Y", "refactor Z", "add support for...", or "fix the bug in..." should all trigger this skill first, before any code is written. Creates a branch named feature/Andrew921/descriptiveName, then a matching worktree under a dedicated worktrees folder, and moves work into it. Do not use this for tiny one-line edits, typo fixes, or read-only exploration/investigation — only for work substantial enough to deserve its own branch.
---

# Git Feature Worktree Setup

## Why this exists

Working directly on `main` (or on whatever branch happens to be checked out) makes it easy to
accidentally mix unrelated changes together, and makes it hard to abandon or park a feature
without disrupting other work. Giving every new feature its own branch *and* its own worktree
(rather than just switching branches in place) means:

- The main repo checkout is never disturbed — whoever/whatever is using it keeps working on
  whatever it had checked out.
- Multiple features can be worked on in parallel, each in its own directory, without stashing
  or switching back and forth.
- Cleanup is just deleting a directory and a branch.

## When to use this

Use this skill proactively, before starting the actual implementation work, whenever you're
about to:
- Build a new feature
- Implement something new
- Refactor existing code
- Fix a non-trivial bug

Skip it for small, self-contained edits (fixing a typo, tweaking a config value, answering a
question about the code) where spinning up a whole branch and worktree would be overkill.

If you're unsure whether the current task is "substantial enough," lean toward using it —
tearing down an unused worktree is cheap, but work done directly on the wrong branch can be
messy to untangle later.

## How it works

Everything below is handled by one script: `scripts/create_feature_worktree.sh`. Run it instead
of doing the git commands by hand — it encodes the naming convention, guards against clobbering
existing branches/worktrees, and figures out the right base branch for you.

```bash
bash scripts/create_feature_worktree.sh <descriptiveName> [username]
```

- `descriptiveName`: a short camelCase description of the work, e.g. `addUserAuth`,
  `refactorPaymentFlow`, `fixLoginRedirect`. If you pass something with spaces or dashes
  (e.g. "Add User Auth"), the script will convert it to camelCase for you — but it's cleaner
  to just pass camelCase directly since that's the canonical format.
- `username`: defaults to `Andrew921`. Only pass this if the user tells you to use a different
  identifier.

### What the script does, in order

1. Confirms you're inside a git repository (fails loudly if not).
2. Fetches `origin` so the base branch is up to date (a fetch failure is a warning, not a hard
   stop — it'll fall back to local refs).
3. Sanitizes `descriptiveName` into camelCase.
4. Builds the branch name: `feature/<username>/<descriptiveName>`.
5. Picks the base branch to branch from, preferring `origin/main`, falling back to
   `origin/master`, then local `main`, then local `master`.
6. **Stops and asks for guidance** (exit code 2) if the branch already exists locally or on
   `origin`, or if the target worktree directory already exists. Don't work around this by
   forcing or renaming things yourself — surface the conflict to the user and let them decide
   whether to reuse, delete, or rename.
7. Creates the branch and the worktree in a single atomic step
   (`git worktree add -b <branch> <path> <base>`), checked out at the tip of the base branch.
   This is why the main repo checkout is never touched — the branch is created directly inside
   the new worktree rather than checked out in place first.

### Where the worktree ends up

`../worktrees/<repo-name>/<descriptiveName>` relative to the repo root — i.e. a sibling
`worktrees/` directory next to the repo, namespaced by repo name so multiple repos' worktrees
don't collide.

### After it succeeds

The script prints the worktree path on a `worktree=` line. `cd` into that directory and do all
subsequent work for this feature there — edits, commits, tests, everything — leaving the
original repo directory untouched.

### If it stops with exit code 2

The branch or worktree directory already exists. Tell the user what already exists and ask how
they'd like to proceed (reuse it, delete the old one, or pick a different `descriptiveName`)
before taking any further action. Don't guess.

## Example

```
User: "let's implement rate limiting for the API"

1. Run: bash scripts/create_feature_worktree.sh rateLimiting
2. Script creates branch feature/Andrew921/rateLimiting from origin/main
3. Script creates worktree at ../worktrees/<repo-name>/rateLimiting
4. cd into that worktree
5. Begin implementing rate limiting there
```
