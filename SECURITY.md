# Security Policy

If you believe you've found a security vulnerability in this repository, please open a new issue with the `security` label or contact the repository owner directly.

This repository previously contained a Google Cloud service account JSON key. To make this repository safe for public publishing we have removed the key file from the working tree and added guidance below to fully remediate and rotate any exposed credentials.

## If you (or someone) accidentally committed secrets

1. Immediately revoke the exposed key in Google Cloud Console:
   - Go to **IAM & Admin → Service Accounts**
   - Select the affected service account
   - Under **Keys**, delete the leaked key
   - Create a new key (JSON) only if needed and store it securely

2. Remove the file from the repository history (required to fully remove secrets):

   Recommended: `git-filter-repo` (fast and safe)

   ```bash
   # Install (if needed)
   pip install git-filter-repo

   # Make a backup of your repo first!
   git clone --mirror <repo-url> repo-mirror.git

   # From your repo root
   git filter-repo --path credentials.json --invert-paths

   # Cleanup and force-push
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force --all
   git push --force --tags
   ```

   Alternative (BFG):

   ```bash
   # Download BFG jar and run:
   java -jar bfg.jar --delete-files credentials.json
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   git push --force
   ```

3. Rotate credentials in all environments and CI/CD:
   - Replace the deleted key by creating a new service account key in GCP
   - Do NOT commit the new key; upload it to your CI secret store (GitHub Secrets, Vercel environment variables, Docker secrets, etc.)
   - Update `GOOGLE_SHEETS_CREDENTIALS_PATH` or your deployment to reference the secret location

4. Scan repository for other leaks:
   - Run `gitleaks`, `trufflehog`, or `git-secrets` locally and in CI to detect secrets
   - Example: `gitleaks detect --source . --report-path gitleaks-report.json`

5. Prevent future leaks:
   - Keep `credentials.json` and other secret files listed in `.gitignore` (already configured)
   - Add secret-scanning to CI (a default GitHub Action is included in `.github/workflows/`)
   - Use platform secret storage (GitHub Secrets, Vercel/Netlify environment variables, or cloud secret managers)
   - Add local commit hooks or CI checks to block accidental commits of sensitive files

## Security contact

If you are a security researcher and want to report a vulnerability privately, open an issue tagged `security` or contact the repo owner directly.

---

This file was added automatically to help safely publish this repository. After you confirm secrets are rotated and removed from history, you may delete this file or adapt it to your org's policy.
