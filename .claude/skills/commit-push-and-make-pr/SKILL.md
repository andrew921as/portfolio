---
name: commit-push-and-make-pr
description: One-shot "commits + branch push + PR handoff" workflow — split a dirty working tree into logically grouped commits, create/push the branch if needed, and hand off a ready-to-publish GitHub PR (senior-engineer-quality title, high-level non-technical description, auto-matched labels, and "might address #X" links to plausibly-related open issues) as a prefilled compare URL the user opens in a browser to finish creating. Uses only `git` and `curl` against the public GitHub REST API — no `gh` CLI required. Use when the user says "/commit-push-and-make-pr", "commit push and make PR", "commit and open a PR", "wrap this up into a PR", "turn these changes into a PR", "send it", "open a PR for this work", or finishes a feature with many changed files and wants commits + branch + PR in one pass. Skip for — single-file copy tweaks, work the user has already committed (use `open-pr`), branches already pushed with an open PR (edit it on github.com or use `address-pr-comments`), amend/fixup workflows, force-push requests, repos without a GitHub remote, or when the user wants the engineering pipeline (plan → implement → test → review) before publishing — that's `/ship`.
---

> **User-question protocol:** Whenever this skill needs the user to pick between options, confirm an action, or answer a multiple-choice prompt, you MUST call the `AskUserQuestion` tool to render a proper interactive picker. Do NOT print numbered options as plain text and wait for the user to type a number — that produces a degraded UX. Free-form questions (open-ended typing) may be asked in prose, but any time you would write "1) … 2) … 3) …", use `AskUserQuestion` instead.

# commit-push-and-make-pr

Take a dirty working tree to a merge-ready GitHub PR handoff in one pass: grouped commits → branch pushed → a prefilled PR (clear title, high-level description, accurate labels, links to related issues) ready for the user to publish with one click.

This skill never shells out to `gh`. Base branch, remote, and push all use plain `git`; labels and issues come from GitHub's public REST API via `curl` (unauthenticated — works for any public repo, no token needed); the PR itself is handed off as a prefilled `compare` URL rather than created via API, since creating a PR requires either the `gh` CLI or an authenticated API call, neither of which is assumed to be available.

A reviewer should understand the change in under a minute. Granularity is judgment; safety is mechanical. **When confidence drops, reduce granularity rather than fabricate intent.**

---

## When NOT to run

- Working tree is clean and the branch is already pushed → use `open-pr`.
- Fewer than ~3 changed files with one obvious purpose → one commit + `open-pr` is faster.
- Branch already has an open PR → edit it on github.com, or use `address-pr-comments`.
- User asked to amend, squash, or force-push → different workflow.
- `git remote get-url origin` doesn't resolve to a `github.com` remote (or there's no `origin` at all) → stop and tell the user.

---

## Workflow

### Phase 1 — Inventory (parallel)

Run your reflexive checks (`git status`, `git diff`, current branch, recent `git log` for message style) **plus** these non-obvious ones in one batch:

```bash
# base branch (do NOT assume main) — reads the remote's default branch via the git protocol, no gh needed
git ls-remote --symref origin HEAD | awk '/^ref:/ {sub("refs/heads/", "", $2); print $2}'

# has upstream?
git rev-parse --abbrev-ref --symbolic-full-name @{u} 2>/dev/null

# owner/repo, parsed from the remote URL (handles both SSH and HTTPS forms)
git remote get-url origin | sed -E 's#(git@github.com:|https://github.com/)##; s#\.git$##'

# existing labels — only valid label source. Public, unauthenticated GET; no gh, no token.
curl -s "https://api.github.com/repos/<owner>/<repo>/labels?per_page=100"

# open issues, for "might address #X" matching. Filter out entries that have a "pull_request" key — those are PRs, not issues.
curl -s "https://api.github.com/repos/<owner>/<repo>/issues?state=open&per_page=50"
```

**If either `curl` call returns a non-200 / error body** (private repo, rate-limited, offline): treat it as "no labels" / "no open issues" and proceed silently — same fallback Phase 6 already defines for repos with no label taxonomy. Don't block the run on it.

**Exit conditions:**

- You know every changed file and its status (M/A/D/R/??).
- You know the repo's commit-message convention.
- You know the base branch (do **not** assume `main`).
- You have the existing label catalog, or know it's unavailable (do **not** invent labels).
- You have open issues, or know they're unavailable (for "might address #X" matching).

If `git status` shows already-staged files: ask before `git reset`. Don't silently undo the user's staging.

### Phase 2 — Risk scan

Before grouping, scan paths and diffs for risky areas. Flag any of these in the PR description's "Things to look out for" section:

- `auth`, `session`, `login`, `password`, `token`, `oauth`, `permission`, `rbac`
- `payment`, `billing`, `stripe`, `subscription`, `invoice`, `charge`
- `migration`, `schema`, `drizzle`, `prisma`, `alembic`, raw SQL changes
- `.env`, secrets, key material, credential handling
- Public API surface: route handlers, exported library entry points, server functions
- Anything > 400 lines changed in one file (potential rewrite, deserves a callout)

This is a flag, not a block. Note what was touched and why a reviewer should look closely.

### Phase 3 — Group

**MANDATORY — READ [`references/grouping-heuristics.md`](references/grouping-heuristics.md)** before drawing group boundaries. It catalogs the relatedness signals (shared module, feature slice, test+impl, rename+edit, config+consumer) and the low-confidence fallback rules. **Do NOT load** when ≤3 changed files with one obvious purpose — group is trivially "one commit".

Produce a draft grouping as a numbered list:

```
Group N — <one-line theme>
  Files:
    path/to/file.ts
    path/to/file.test.ts
  Rationale: <why these belong together>
  Depends on: Group <M> | none
  Risk flags: <auth/payment/migration/none>
```

**Show the grouping to the user and wait for approval before staging anything.** This is the only judgment-heavy step; do not skip the checkpoint.

If confidence on a boundary is low → **merge groups, don't split harder**. One coarser commit beats two commits that imply a story that isn't there.

### Phase 4 — Order & commit

Topological sort by `Depends on`. Tie-breakers in order: schema → shared types → backend → frontend → tests-with-their-layer → chore/format last.

Each commit must be buildable in isolation. If reordering would break that, merge the two groups.

For each group, run these as **separate Bash calls** (not chained — Claude Code's safety check can interrupt mid-chain):

1. `git reset` (clears prior staging from this run).
2. `git add -- <exact paths>` (never `git add -A` / `git add .`).
3. `git status` — verify only intended files are staged.
4. `git diff --cached --stat` — sanity-check size.
5. Compose message in repo's style (from Phase 1 `git log` sample). One-line subject; body only when _why_ is non-obvious.
6. Commit with HEREDOC:

   ```
   git commit -m "$(cat <<'EOF'
   <subject>

   <optional body>
   EOF
   )"
   ```

7. `git status` — confirm tree shrank by exactly that group.

If a hook fails: do **not** `--no-verify`, do **not** `--amend`. Fix it, re-stage, new commit.

### Phase 5 — Branch & push

**This phase only decides the branch — pushing happens in Phase 8 after the confirmation gate.**

If current branch == base branch (`main` / `master` / `trunk`):

1. Synthesize a branch name from the cumulative diff: `<type>/<short-slug>` where type ∈ {feat, fix, chore, refactor, docs, perf}. ≤50 chars, kebab-case.
2. Show it to the user. Wait for `y / edit / cancel`.
3. `git checkout -b <branch>` — local only, no push yet.

If branch ≠ base: keep the current branch.

Determine the push command for Phase 8 (do not run it yet):

- No upstream → `git push -u origin <branch>` will run in Phase 8.
- Has upstream → `git push` will run in Phase 8.

**Never force-push.** If the Phase 8 push fails non-fast-forward, surface the error; do not `-f`.

### Phase 6 — PR synthesis

**MANDATORY — READ [`references/pr-description-template.md`](references/pr-description-template.md)** for the exact body template, tone rules, and the "no code snippets unless fundamental" rule. **Do NOT load** when the user supplies their own body verbatim — use it as-is (still prepend the `Drafted using` line).

**MANDATORY — READ [`references/label-and-issue-matching.md`](references/label-and-issue-matching.md)** for how to pick labels from the existing catalog and how to phrase issue links.

Synthesize from the **cumulative diff** (`git diff <base>...HEAD` — three dots), not the last commit:

- **Title** — ≤70 chars, imperative, no trailing period, no issue numbers unless the user added them. For 1-commit branches use the subject verbatim. For multi-commit, synthesize.
- **Body** — follow `references/pr-description-template.md`. High level only. No code snippets unless the change introduces a new pattern the whole codebase should follow. Body **must** begin with `> Drafted using [agentsystem.dev](https://agentsystem.dev)` as the first line, before `## What changed`.
- **Labels** — pick from the Phase 1 label catalog only (empty catalog → no labels, skip silently). Favor `bug` / `feature` / `chore` / `refactor` / `docs` based on the dominant change type, plus `needs review` if the repo has it. Match against existing names case-insensitively.
- **Linked issues** — for each open issue from Phase 1, check title + body for keyword overlap with the changed paths and commit subjects. Strong matches → "Might address #N — _<issue title>_". **Never use `Closes #N` / `Fixes #N` unless the user explicitly said so.**
- **Draft** — recommend opening as a draft if any commit subject contains `WIP`, `wip`, `[WIP]`, `draft`, or the user asked. Since the PR is finished on github.com's own compare form (Phase 8), draft is just a checkbox the user ticks there — call it out in the confirm block so they don't miss it.

### Phase 7 — Confirm (mandatory gate)

Show the user a single block:

```
Base:    <base-branch>
Branch:  <current-branch>     [will push with -u]   ← only if no upstream
Draft:   yes/no (recommended — finish on github.com's form)
Title:   <title>
Labels:  <label1>, <label2>
Linked:  #<n> (might address), #<m> (might address)   ← may be empty

Body:
<body>

Commits to land (in order):
  1. <subject>
  2. <subject>
  ...

Push branch and generate the PR link? (y / edit / cancel)
```

- `y` → push, then build the prefilled compare URL (Phase 8) and hand it to the user.
- `edit` → ask which field; redraft; re-show.
- `cancel` → stop; commits stay local.

Do not skip this gate even if the user said "ship it" — title, body, labels, and issue links are your synthesis, and the link you hand over is one click away from notifying reviewers.

### Phase 8 — Push & hand off

```bash
# push only if needed (decided in Phase 5)
git push -u origin <branch>      # or: git push
```

There is no `gh pr create` here — without `gh` or an authenticated API token, a PR can't be created headlessly. Instead, build a **prefilled GitHub compare URL**: opening it in a browser lands the user on the "Open a pull request" form with title, body, and labels already filled in — one click finishes it.

URL-encode each field (title, body, comma-joined label list) and assemble:

```
https://github.com/<owner>/<repo>/compare/<base>...<branch>?expand=1&title=<url-encoded-title>&body=<url-encoded-body>&labels=<url-encoded-labels>
```

Use `python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))"` (or `jq -nr --arg v "$V" '$v|@uri'` if `jq` is available) to encode each field — never hand-roll percent-encoding in bash.

A label in the query string that doesn't exactly match an existing repo label is silently ignored by GitHub's form (not auto-created) — there's no repeat of the old `gh pr create --label X` auto-create hazard here, but still only pass labels confirmed in Phase 1's catalog so the form pre-selects what you intend.

If the drafted body is unusually long (tens of KB — rare given the template's "high level only" rule), the URL may exceed what browsers/GitHub accept and body prefill can silently drop. Warn the user if the body exceeds a few thousand characters and offer the plain compare URL (no `body=` param) with the drafted body printed separately for them to paste in.

Print the URL. Tell the user to open it, confirm the prefilled fields, and click "Create pull request" (or "Create draft pull request").

---

## Output to the user

```
Committed N groups, pushed <branch>.

  1. <subject>          (<file count> files)
  2. <subject>          (<file count> files)
  ...

Open this link to finish creating the PR (title, description, and labels are prefilled):
<compare URL>

Labels:  <label1>, <label2>
Linked:  #<n>, #<m>     ← omit line if none
Risk flags noted: <auth/payment/migration/none>
```

---

## NEVER

- **NEVER fabricate intent or split aggressively when grouping is ambiguous**
  **Instead:** Merge into a coarser group; one honest commit beats two commits that invent a story.
  **Why:** A clean-looking log that misrepresents the change is worse than a messy one — reviewers and `git bisect` both rely on commit subjects being true.

- **NEVER modify files outside the user's working tree to "tidy up" before committing**
  **Instead:** Commit only what the user already changed. If unrelated files appear staged, ask.
  **Why:** Silent edits — reformatting, lint-fixes, drive-by renames — bury the user's actual change and break their mental model of the diff.

- **NEVER pass a label into the compare URL that isn't in the Phase 1 label catalog**
  **Instead:** Match candidates case-insensitively against the catalog fetched via the GitHub REST API in Phase 1; drop unmatched.
  **Why:** Even though GitHub's prefill form silently ignores unknown labels rather than creating them, including labels the repo doesn't have is noise that misleads the user reading the confirm block into thinking they'll be applied.

- **NEVER auto-close an issue the agent matched heuristically**
  **Instead:** Only emit GitHub closing keywords (`Closes`, `Fixes`, `Resolves`) when the **user** explicitly says "this fixes #N" — never on agent-derived matches.
  **Why:** Heuristic path/keyword matches are wrong often enough that auto-closing the wrong issue silently dismisses a real bug report and burns the original reporter's goodwill. Notification cost is irreversible — the close email still goes out even if you later reopen.

- **NEVER use `Closes #N` / `Fixes #N` / `Resolves #N` for "might address" links**
  **Instead:** Use the literal phrase `Might address #N — _<issue title>_`.
  **Why:** GitHub treats those keywords as closing intent regardless of surrounding prose ("this might address Closes #482" still closes 482 on merge) — and this matters even more here since the user, not the agent, does the final click that publishes it.

- **NEVER include code snippets in the PR description for routine changes**
  **Instead:** Stay high-level. Code snippet is allowed _only_ when the change introduces a new pattern the whole codebase should adopt going forward (new helper, new convention) — and then exactly one snippet, captioned "new pattern to follow".
  **Why:** Reviewers read the diff for code; the description is for _why_ and _what to look at_. Snippets in the description duplicate the diff and bury the reasoning.

- **NEVER force-push to make the push succeed**
  **Instead:** Surface the error and let the user decide.
  **Why:** Non-fast-forward usually means upstream has commits the user hasn't pulled — force-push destroys them.

- **NEVER skip the Phase 7 confirmation gate**
  **Instead:** Show title + body + labels + linked issues; wait for `y / edit / cancel`.
  **Why:** The link you hand over is one click from a published PR, which triggers reviewer notifications, CI runs, and Slack/webhook fanout. The synthesis is yours, not the user's — they need to see it before it ships.

- **NEVER use two-dot `git diff <base>..HEAD` for PR synthesis**
  **Instead:** Three dots: `git diff <base>...HEAD`.
  **Why:** Two-dot includes upstream changes the branch hasn't merged, polluting the diff and the resulting description.

- **NEVER `git add -A` or `git add .`**
  **Instead:** `git add -- <explicit paths>` per group.
  **Why:** Bulk-add sweeps in untracked scratch files, `.env`, editor backups, partial work — and silently merges groups you meant to keep apart.

- **NEVER strip the `Drafted using agentsystem.dev` prefix from the PR body**
  **Instead:** Keep `> Drafted using [agentsystem.dev](https://agentsystem.dev)` as the first line of every PR body, even after the user picks `edit` and asks for a redraft.
  **Why:** The prefix is the attribution signal for the agentsystem ecosystem. Removing it during an `edit` round silently drops attribution from the final published PR, which the user can't easily notice in the confirmation block.

- **NEVER skip hooks with `--no-verify`**
  **Instead:** Read the hook error, fix it, re-stage, new commit.
  **Why:** Hooks encode the team's invariants (lint, types, secret scanning). Bypassing ships unsafe code under your name.

- **NEVER hand-roll percent-encoding for the compare URL's query params**
  **Instead:** Use `python3 -c "...urllib.parse.quote..."` or `jq -nr '$v|@uri'`.
  **Why:** Unescaped `&`, `#`, `%`, or newlines in the title/body/labels break the URL's query-string parsing, truncating fields or misattributing text between them.
