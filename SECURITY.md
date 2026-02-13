# 🔒 Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it privately to **noecramos@gmail.com**.

## Secret Management

### Rules
1. **NEVER** hardcode credentials in source code
2. **NEVER** commit `.env.local` or any `.env` file with real values
3. **ALWAYS** use `process.env.VARIABLE_NAME` to access secrets
4. **ALWAYS** use `.env.example` as a template (no real values)

### Environment Variables
All secrets are stored in `.env.local` (gitignored). See `.env.example` for the required variables.

### Pre-commit Hook
This project includes a pre-commit hook that scans for potential secrets.

To install:
```bash
git config core.hooksPath .githooks
```

### If a Secret is Leaked
1. **Rotate the credential immediately** on the provider's dashboard
2. **Scrub git history** using `git-filter-repo`
3. **Force push** the cleaned history
4. **Update** `.env.local` and Vercel env vars with new credentials

## Protected Files
The following are gitignored for security:
- `.env`, `.env.local`, `.env.*.local`
- `*.pem`, `*.key`, `*.p12` (private keys)
- Files containing `password`, `secret`, `credentials`, `apikey` in their name
- `waha-cloudrun/deploy.ps1` (contains deployment secrets)
- `supabase/novix_complete_setup.sql` (contains setup data)
