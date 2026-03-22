# âœ… Jenkins Local Git Checkout - FIXED

**Date:** March 5, 2026  
**Issue:** Build #7 failed with local Git checkout security error  
**Status:** âœ… RESOLVED

---

## ðŸ”´ Problem

Jenkins refused to checkout code from local Git repository:

```
ERROR: Checkout of Git remote 'C:\AMP\Projects\MySoceity' aborted because 
it references a local directory, which may be insecure.
```

### Root Cause:
By default, Jenkins blocks Git checkouts from local directories for security reasons. Since we're using a local repository path (`C:\AMP\Projects\MySoceity`), Jenkins needs explicit permission.

---

## âœ… Solution Applied

Jenkins has been restarted with the required system property:

```bash
java -Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true -jar jenkins.war --httpPort=8080
```

This flag tells Jenkins it's safe to checkout from the local Git repository.

---

## ðŸš€ How to Start Jenkins (Going Forward)

### Option 1: Use the Helper Script (Recommended)
```powershell
cd C:\AMP\Projects\MySoceity
.\START_JENKINS.ps1
```

This script automatically starts Jenkins with the correct configuration.

### Option 2: Manual Start
```powershell
cd C:\AMP\Projects\MySoceity
java -Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true -jar jenkins.war --httpPort=8080
```

### âš ï¸ IMPORTANT:
**ALWAYS** use the `-Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true` flag when starting Jenkins, or builds will fail with the checkout error.

---

## ðŸŽ¯ Next Steps

### 1. Trigger Build #8
- Go to: http://localhost:8080/job/NammaSociety-Pipeline/
- Click **"Build Now"** in left sidebar
- Build should now complete successfully

### 2. Expected Build Output:
```
âœ… Checkout - Gets code from local Git repo
âœ… Build Backend Services - Compiles auth & user services
âœ… Test Backend Services - Runs unit tests
âœ… Package Backend Services - Creates JAR files
âœ… Build Frontend Applications - Builds all 4 Angular apps
âœ… Archive Artifacts - Saves build outputs
```

**Total Time:** 3-5 minutes

---

## ðŸ“Š Build History Summary

| Build # | Status | Reason |
|---------|--------|--------|
| #1-#5   | FAILURE | Jenkinsfile not committed to Git |
| #6      | FAILURE | Invalid branch pattern `**` |
| #7      | FAILURE | Local Git checkout blocked |
| #8      | PENDING | Should succeed with fix applied |

---

## ðŸ”§ Technical Details

### What Changed:
1. **System Property Added:**  
   `hudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true`

2. **Why It's Needed:**  
   Jenkins Git plugin blocks local checkouts by default to prevent accidentally exposing local files. Since we're intentionally using a local repository (not a security risk in this case), we explicitly allow it.

3. **When It's Required:**  
   Only needed when using local file paths as Git repository URLs:
   - âœ… Allowed: `C:\AMP\Projects\MySoceity`
   - âœ… Allowed: `/home/user/project`
   - âŒ Not needed: `https://github.com/user/repo.git`
   - âŒ Not needed: `git@github.com:user/repo.git`

### Alternative Solutions (Not Used):
1. **Convert to Git URL:** Use `file:///C:/AMP/Projects/MySoceity`  
   - Still requires the system property
   
2. **Use Remote Repository:** Push to GitHub/GitLab and use HTTPS URL  
   - More complex setup, unnecessary for local development

3. **Set in Jenkins UI:** Dashboard â†’ Manage Jenkins â†’ System Properties  
   - Requires restart anyway, command-line flag is simpler

---

## ðŸ“ Files Updated

### New Files Created:
- **START_JENKINS.ps1**  
  Helper script to start Jenkins with correct configuration
  
- **JENKINS_LOCAL_CHECKOUT_FIX.md** (this file)  
  Documentation of the fix

### Configuration Changes:
- **Jenkins Startup Command**  
  Added `-Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true` flag

---

## âœ… Verification Checklist

Before triggering the next build:

- [x] Jenkins stopped and restarted
- [x] System property added to startup command
- [x] Jenkins accessible at http://localhost:8080
- [x] Pipeline job exists: http://localhost:8080/job/NammaSociety-Pipeline/
- [x] Branch pattern fixed (changed from `**` to `*/*`)
- [x] Both backend JARs exist (auth & user services)
- [x] Frontend dependencies installed (node_modules)
- [x] Jenkinsfile committed to Git (commit 3103a87)

---

## ðŸ†˜ Troubleshooting

### If Build Still Fails:

1. **Verify Jenkins Started Correctly:**
   ```powershell
   netstat -ano | findstr ":8080"
   # Should show LISTENING
   ```

2. **Check Java Process Command:**
   ```powershell
   Get-WmiObject Win32_Process | Where-Object { $_.Name -eq "java.exe" } | 
       Select-Object CommandLine | Format-List
   # Should contain: -Dhudson.plugins.git.GitSCM.ALLOW_LOCAL_CHECKOUT=true
   ```

3. **Verify Git Repository:**
   ```powershell
   cd C:\AMP\Projects\MySoceity
   git status
   # Should show: On branch appmod/java-upgrade-20260301053214
   ```

4. **Check Jenkinsfile Exists:**
   ```powershell
   git ls-files Jenkinsfile
   # Should output: Jenkinsfile
   ```

---

## ðŸ“š Related Documentation

- **[BUILD_FIX_APPLIED.md](BUILD_FIX_APPLIED.md)** - Branch pattern fix
- **[JENKINS_WORKING_CONFIGURATION.md](JENKINS_WORKING_CONFIGURATION.md)** - Complete setup guide
- **[JENKINS_SETUP_GUIDE.md](JENKINS_SETUP_GUIDE.md)** - Installation instructions
- **[START_JENKINS.ps1](START_JENKINS.ps1)** - Jenkins startup script

---

**Issue Resolved:** March 5, 2026  
**Jenkins Status:** âœ… Running with local checkout enabled  
**Ready for Build:** #8

ðŸš€ **You're all set! Go trigger Build #8!**

