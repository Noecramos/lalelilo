# 🚨 CRITICAL SECURITY ISSUE - Exposed Credentials

## ⚠️ IMMEDIATE ACTION REQUIRED

Your GitHub repositories have **publicly exposed sensitive credentials**. This is a **HIGH PRIORITY** security issue.

---

## 🔴 Exposed Credentials

### Lalelilo Repository
- ❌ Supabase Service Role Key (`scripts/run-migration.mjs`)
- ❌ Passwords in SQL files (`supabase/novix_complete_setup.sql`, `supabase/complete_auth_setup.sql`)
- ❌ WAHA credentials (`waha-cloudrun/deploy.ps1`)

### Olinshop Repository
- ❌ Google API Key (`n8n-ai-simple-ready.json`)
- ❌ Multiple password files (`.ps1` scripts)

---

## 🚀 URGENT STEPS (Do This NOW!)

### Step 1: Rotate ALL Credentials Immediately

#### A. Supabase (Lalelilo)
1. Go to: https://supabase.com/dashboard/project/lecgrltttoomuodptfol/settings/api
2. Click **"Reset service role key"**
3. Copy the new key
4. Update `.env.local` with the new key
5. Update Vercel environment variables

#### B. Google API Keys (Gemini)
1. Go to: https://console.cloud.google.com/apis/credentials
2. Find the exposed API key
3. **Delete it** or **Restrict it**
4. Create a new API key
5. Update `.env.local` and Vercel

#### C. WAHA Credentials
1. Change WAHA API key
2. Update all references

---

### Step 2: Add .gitignore Rules

Make sure these files are NEVER committed:

```gitignore
# Environment variables
.env
.env.local
.env.*.local

# Sensitive SQL files with credentials
**/complete_auth_setup.sql
**/novix_complete_setup.sql

# PowerShell scripts with credentials
**/*password*.ps1
**/*credentials*.ps1
**/deploy.ps1

# N8N workflows with API keys
**/n8n*.json
```

---

### Step 3: Remove from Git History

**Option A: Using git filter-branch (Built-in)**

```bash
cd D:\Antigravity\lalelilo

# Remove sensitive files from history
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch \
    supabase/novix_complete_setup.sql \
    supabase/complete_auth_setup.sql \
    waha-cloudrun/deploy.ps1 \
    scripts/run-migration.mjs" \
  --prune-empty --tag-name-filter cat -- --all

# Force push
git push origin --force --all
git push origin --force --tags
```

**Option B: Using BFG Repo-Cleaner (Faster)**

1. Download: https://rtyley.github.io/bfg-repo-cleaner/
2. Run:
```bash
java -jar bfg.jar --delete-files "novix_complete_setup.sql" lalelilo.git
java -jar bfg.jar --delete-files "complete_auth_setup.sql" lalelilo.git
java -jar bfg.jar --delete-files "deploy.ps1" lalelilo.git
cd lalelilo
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push origin --force --all
```

---

### Step 4: Update .gitignore NOW

Add these files to `.gitignore`:

```gitignore
# Sensitive files
supabase/novix_complete_setup.sql
supabase/complete_auth_setup.sql
waha-cloudrun/deploy.ps1
scripts/run-migration.mjs

# Any file with credentials
*credentials*
*password*
*.env*
!.env.template
!.env.example
```

---

### Step 5: Verify Cleanup

After removing from history:

```bash
# Search for sensitive data
git log --all --full-history -- "**/novix_complete_setup.sql"
git log --all --full-history -- "**/complete_auth_setup.sql"

# Should return nothing
```

---

## 📋 Checklist

- [ ] Rotate Supabase Service Role Key
- [ ] Rotate Google/Gemini API Key
- [ ] Rotate WAHA credentials
- [ ] Update `.gitignore`
- [ ] Remove files from Git history
- [ ] Force push cleaned history
- [ ] Update all environment variables in Vercel
- [ ] Verify credentials are no longer in history
- [ ] Monitor for unauthorized access

---

## 🛡️ Prevention for Future

1. **Always use `.env.local`** for secrets (never commit)
2. **Use `.env.template`** for structure (safe to commit)
3. **Review before committing**: `git diff --cached`
4. **Use GitHub secret scanning** (already enabled)
5. **Use pre-commit hooks** to block sensitive files

---

## 📞 If Credentials Were Used

If you suspect the exposed credentials were accessed:

1. **Check Supabase logs** for unauthorized access
2. **Check Google Cloud billing** for unexpected usage
3. **Review GitHub repository access logs**
4. **Consider making repositories private** temporarily

---

## ⏱️ Time Estimate

- Rotating credentials: **10 minutes**
- Cleaning Git history: **15 minutes**
- Verification: **5 minutes**

**Total: ~30 minutes**

---

**DO THIS NOW before the credentials are exploited!**

Run: `.\SECURITY_FIX.ps1` for guided cleanup.
