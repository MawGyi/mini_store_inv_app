# 🛠️ Git Branch + Commit Naming Rule + Rollback Command Cheat Sheet

## 1️⃣ Branch Naming Rules

| Branch Type  | Naming Pattern                  | Example                           | Purpose |
|--------------|---------------------------------|------------------------------------|---------|
| Main         | `main`                          | `main`                             | Production-ready code |
| Feature      | `feature/<short-description>`   | `feature/login-ui`                 | New feature development |
| Bug Fix      | `bugfix/<short-description>`    | `bugfix/header-overlap`            | Bug fixes |
| Hotfix       | `hotfix/<short-description>`    | `hotfix/critical-login-error`      | Urgent production fix |
| Release Tag  | `release/<version>`             | `release/v1.0.0`                   | Preparing for release |
| Experiment   | `experiment/<short-description>`| `experiment/new-theme-test`        | Testing new ideas |

**Rules**  
- Use lowercase only  
- Separate words with `-`  
- Keep branch name short but descriptive  
- One purpose per branch  

---

## 2️⃣ Commit Naming Rules

**Format**
```
<type>(<scope>): <short summary>
```

**Type Options**
- `feat` → New feature
- `fix` → Bug fix
- `docs` → Documentation only
- `style` → Code style changes (no logic)
- `refactor` → Code restructure (no feature/bug)
- `perf` → Performance improvements
- `test` → Tests related changes
- `chore` → Maintenance/config/build changes

**Examples**
```
feat(login): add remember me checkbox
fix(header): resolve overlapping on mobile
docs(readme): update setup instructions
style(navbar): adjust padding and colors
```

---

## 3️⃣ Rollback Command Cheat Sheet

| Action | Command | Notes |
|--------|---------|-------|
| View commit history | `git log --oneline` | Shows commit hash & message |
| Restore file from old commit | `git checkout <commit_hash> -- path/to/file` | Restores file only, not whole repo |
| Revert a whole commit (safe) | `git revert <commit_hash>` | Creates new commit that undoes target commit |
| Undo last commit (keep changes) | `git reset --soft HEAD~1` | Changes stay staged |
| Undo last commit + discard changes | `git reset --hard HEAD~1` | ⚠️ Destroys uncommitted work |
| Rollback to specific commit (keep history) | `git revert --no-commit <commit_hash>` | Good for multiple commits |
| Compare commits | `git diff <commit1> <commit2>` | See what changed |
| Tag a version | `git tag v1.0.0` + `git push origin v1.0.0` | Useful for version rollback |
| Checkout old version for testing | `git checkout <commit_hash>` | Detached HEAD, create new branch to edit |

---

## 4️⃣ Recommended Workflow

1. **Create new feature branch**
```bash
git checkout -b feature/<name>
```

2. **Make small commits**
```bash
git add .
git commit -m "feat(auth): add JWT login"
```

3. **Push branch**
```bash
git push origin feature/<name>
```

4. **Merge to main after review**
```bash
git checkout main
git merge feature/<name>
git push origin main
```

5. **Tag release**
```bash
git tag v1.0.0
git push origin v1.0.0
```

---

📌 **Quick Rollback Summary**
- **File rollback** → `git checkout <hash> -- file`
- **Commit rollback** → `git revert <hash>`
- **Version rollback** → `git checkout vX.Y.Z`

---
