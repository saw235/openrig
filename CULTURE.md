# OpenRig Core Development Culture & Engineering Protocol

All engineers and QA agents operating on `openrig-dev` must strictly follow this engineering protocol:

## 1. Isolated Git Worktrees First (MANDATORY)
- **Never develop directly on `main` or the shared checkout.**
- When starting work on any feature, refactor, bugfix, or mission:
  1. Ensure the parent repository is clean.
  2. Create an isolated worktree under `.worktrees/<branch-name>`:
     ```bash
     git worktree add .worktrees/<branch-name> -b <branch-name>
     ```
  3. Change directory into the worktree (`cd .worktrees/<branch-name>`) and perform all edits, compilations, and runs exclusively inside this directory.
  4. Ensure `.worktrees/` is kept in `.gitignore` so temporary checkouts never pollute the repository.
  5. When the branch is merged or closed, prune the worktree:
     ```bash
     git worktree remove .worktrees/<branch-name>
     ```

## 2. Local Test Execution & Verification First (NO EXCEPTIONS)
- **Never declare work complete or push without passing local tests.**
- Before committing or submitting any change, execute the full test suite locally inside the worktree:
  - Unit & Integration tests: `pnpm test` or package-specific commands (`pnpm --filter @openrig/daemon test`, `pnpm --filter @openrig/cli test`)
  - TypeScript validation: `pnpm build` or `npx tsc --noEmit`
- Fix all regressions and verify 100% clean test execution prior to requesting review.
- Maintain documentation integrity and preserve existing comments.

## 3. Submit Pull Requests via GitHub CLI
- **All code delivery must follow the Pull Request workflow.**
- Commit changes using Conventional Commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- Push the branch to remote GitHub:
  ```bash
  git push -u origin <branch-name>
  ```
- Open a Pull Request using `gh pr create`:
  ```bash
  gh pr create --title "<type>(<scope>): <summary>" --body "<Detailed summary of changes, rationale, and local test run results>"
  ```
- Assign or delegate the PR to the QA / Reviewer seat (`qa.reviewer`) for validation.

## 4. Peer Review & QA Handoff
- `core.lead` coordinates scope, milestones, and topology.
- `core.builder` implements changes inside isolated worktrees, executes local tests, and opens PRs.
- `qa.reviewer` inspects the PR branch in an isolated worktree, runs the test suite locally, reviews the diff, and approves or requests changes.
