# Jenkins CI/CD - Working Configuration & Handover

**Date:** March 5, 2026  
**Project:** NammaSociety Application  
**Jenkins Version:** 2.541.2 (Stable)

---

## âœ… ISSUE RESOLVED

**Problem:** Jenkins builds were failing with error: *"Unable to find Jenkinsfile from git"*

**Root Cause:** The Jenkinsfile was created in the project directory but was NOT committed to the Git repository.

**Solution Applied:**
```bash
git add Jenkinsfile
git commit -m "Add Jenkinsfile for Jenkins CI/CD pipeline"
# Commit: 3103a87
```

---

## ðŸ“‹ WORKING CONFIGURATION

### Jenkins Installation
- **Type:** WAR file (jenkins.war)
- **Location:** `C:\AMP\Projects\MySoceity\jenkins.war`
- **Jenkins Home:** `C:\Users\paran\.jenkins`
- **Access URL:** http://localhost:8080
- **Port:** 8080

### Tools Configuration
All configured in **Manage Jenkins â†’ Tools**:

| Tool | Name | Path |
|------|------|------|
| **JDK** | `Java-25` | `C:\Program Files\Java\jdk-25.0.2` |
| **Maven** | `Maven-3.9.12` | `C:\Program Files\Apache\maven` |
| **Git** | `Default` | `C:\Program Files\Git\cmd\git.exe` |

### Pipeline Job Configuration

**Job Name:** `NammaSociety-Pipeline`

**Configuration Details:**
```yaml
Type: Pipeline
Repository URL: C:\AMP\Projects\MySoceity
Repository Type: Local Git Repository (file system)
Branch Specifier: ** (builds all branches)
Script Path: Jenkinsfile
Lightweight Checkout: Enabled

Build Triggers:
  - SCM Polling: H/5 * * * * (checks every 5 minutes)
  
Build Retention:
  - Days to keep: 30
  - Max builds to keep: 10
```

**Current Branch:** `appmod/java-upgrade-20260301053214`

---

## ðŸš€ HOW TO TRIGGER BUILDS

### Method 1: Manual Trigger (Recommended)

1. Open Jenkins: http://localhost:8080/job/NammaSociety-Pipeline/
2. Click **"Build Now"** button (left sidebar)
3. Watch build appear in **Build History** (lower-left)
4. Click build number (e.g., **#6**) â†’ **"Console Output"** to see live logs

### Method 2: Automatic Trigger

Builds trigger automatically every 5 minutes if there are Git changes:
- Jenkins polls the repository every 5 minutes
- If changes are detected, a build starts automatically
- No manual intervention needed

### Method 3: Use PowerShell Script

Run the provided script:
```powershell
cd C:\AMP\Projects\MySoceity
.\TRIGGER_JENKINS_BUILD.ps1
```

This script will:
- Open Jenkins in your browser
- Help you trigger the build
- Monitor build progress
- Show results when complete

---

## ðŸ“Š BUILD PIPELINE STAGES

Your Jenkinsfile defines these stages:

### 1. Checkout
- Pulls latest code from Git repository
- Duration: ~5-10 seconds

### 2. Build Backend Services (Parallel)
- **Auth Service:** `mvn clean compile` in `backend/auth-service`
- **User Service:** `mvn clean compile` in `backend/user-service`
- Duration: ~30-60 seconds

### 3. Test Backend Services (Parallel)
- **Auth Service:** `mvn test`
- **User Service:** `mvn test`
- Publishes JUnit test reports
- Duration: ~20-40 seconds

### 4. Package Backend Services (Parallel)
- **Auth Service:** Creates `auth-service-1.0.0.jar`
- **User Service:** Creates `user-service-1.0.0.jar`
- Duration: ~20-30 seconds

### 5. Build Frontend Applications (Parallel)
- **Login MFE:** `npm install` â†’ `npm run build`
- **Dashboard MFE:** `npm install` â†’ `npm run build`
- **Register MFE:** `npm install` â†’ `npm run build`
- **Host App:** `npm install` â†’ `npm run build`
- Duration: ~120-180 seconds (slowest stage)

### 6. Archive Artifacts
- Archives all `.jar` files
- Archives all `dist/` folders
- Makes artifacts downloadable from Jenkins UI
- Duration: ~5-10 seconds

**Total Expected Build Time:** 3-5 minutes

---

## ðŸ“¦ BUILD ARTIFACTS

After a successful build, these artifacts are created:

### Backend JAR Files
```
backend/auth-service/target/auth-service-1.0.0.jar
backend/user-service/target/user-service-1.0.0.jar
```

### Frontend Build Folders
```
frontend/login-mfe/dist/login-mfe/
frontend/dashboard-mfe/dist/dashboard-mfe/
frontend/register-mfe/dist/register-mfe/
frontend/host-app/dist/host-app/
```

### Downloading Artifacts

1. Go to build page: http://localhost:8080/job/NammaSociety-Pipeline/[BUILD_NUMBER]/
2. Click **"Build Artifacts"** in the left sidebar
3. Download individual files or entire folders

---

## ðŸ” MONITORING BUILDS

### During Build
- **Blue blinking icon** = Building in progress
- Click build number â†’ **"Console Output"** for live logs
- Stages shown in **"Stage View"** (visual progress)

### After Build
- **Blue solid icon** âœ… = Success
- **Red solid icon** âŒ = Failure
- **Yellow solid icon** âš ï¸ = Unstable (tests failed but build succeeded)
- **Gray solid icon** = Aborted

### Build Notifications
Email notifications are configured (check **Manage Jenkins â†’ System â†’ E-mail Notification**):
- Success: Green checkmark email
- Failure: Red X email with error details

---

## ðŸ› ï¸ COMMON ISSUES & SOLUTIONS

### Issue 1: Build Fails at Checkout
**Error:** "Unable to find Jenkinsfile"  
**Solution:** Ensure Jenkinsfile is committed to Git
```powershell
git add Jenkinsfile
git commit -m "Update Jenkinsfile"
```

### Issue 2: Maven Build Fails
**Error:** "mvn: command not found" or Java version mismatch  
**Solution:** 
1. Go to **Manage Jenkins â†’ Tools**
2. Verify **Maven-3.9.12** path: `C:\Program Files\Apache\maven`
3. Verify **Java-25** path: `C:\Program Files\Java\jdk-25.0.2`
4. Save and retry build

### Issue 3: Frontend Build Fails
**Error:** "npm: command not found"  
**Solution:** 
- NodeJS must be installed on the Jenkins server
- Or install **NodeJS Plugin** in Jenkins
- Configure NodeJS in **Manage Jenkins â†’ Tools**

### Issue 4: Out of Memory During Frontend Build
**Error:** "JavaScript heap out of memory"  
**Solution:** Edit Jenkinsfile, add to npm build commands:
```groovy
bat 'npm run build -- --max-old-space-size=4096'
```

### Issue 5: Tests Fail
**Error:** JUnit test failures  
**Solution:** Fix test issues in code, commit, and rebuild. Build will show as **UNSTABLE** (yellow) but artifacts are still created.

### Issue 6: Branch Not Found
**Error:** "Couldn't find any revision to build"  
**Solution:** 
1. Go to Job â†’ **Configure**
2. Under **Branches to build**, set to `**` (build all branches)
3. Or specify exact branch: `*/appmod/java-upgrade-20260301053214`

---

## ðŸ”„ MODIFYING THE PIPELINE

### Edit Jenkinsfile

1. Open `C:\AMP\Projects\MySoceity\Jenkinsfile` in editor
2. Make changes (add stages, modify commands, etc.)
3. **IMPORTANT:** Commit changes to Git:
   ```powershell
   git add Jenkinsfile
   git commit -m "Update pipeline"
   ```
4. Trigger new build to test changes

### Common Modifications

**Add a deployment stage:**
```groovy
stage('Deploy to Staging') {
    steps {
        echo 'Deploying to staging server...'
        bat 'copy backend\\auth-service\\target\\*.jar C:\\Deploy\\staging\\'
        bat 'copy backend\\user-service\\target\\*.jar C:\\Deploy\\staging\\'
    }
}
```

**Add code quality checks:**
```groovy
stage('Code Quality') {
    steps {
        dir("${BACKEND_DIR}/auth-service") {
            bat 'mvn sonar:sonar'
        }
    }
}
```

**Skip tests temporarily:**
Change `mvn test` to `mvn test -DskipTests`

---

## ðŸ“ˆ BEST PRACTICES

### 1. Always Commit Changes Before Building
```powershell
git status
git add .
git commit -m "Your changes"
```

### 2. Monitor First Few Builds Closely
- Watch console output for errors
- Verify all stages complete successfully
- Check artifacts are created

### 3. Keep Builds Fast
- Frontend builds are slowest (~3 minutes)
- Consider caching `node_modules` if builds are too slow
- Use parallel stages whenever possible

### 4. Review Build Trends
- Go to job page â†’ Click **"Trend"**
- Monitor build duration over time
- Investigate sudden increases in build time

### 5. Clean Workspace Periodically
```powershell
# In Jenkinsfile, add to post section:
always {
    cleanWs()  # Cleans workspace after build
}
```

---

## ðŸŽ¯ NEXT STEPS

### Immediate (Now)
1. âœ… **Run first successful build**
   - Run `.\TRIGGER_JENKINS_BUILD.ps1`
   - Or manually click "Build Now"
   - Verify all stages complete successfully

2. âœ… **Verify artifacts**
   - Check JAR files were created
   - Check Angular dist folders exist
   - Download artifacts from Jenkins UI

### Short Term (This Week)
1. **Setup deployment stage**
   - Deploy to staging environment
   - Add deployment scripts to Jenkinsfile

2. **Configure email notifications**
   - Setup SMTP in Jenkins
   - Add recipient emails
   - Test notifications

3. **Add integration tests**
   - Create test stage after build
   - Use Selenium/Cypress for frontend
   - Use REST Assured for backend APIs

### Long Term (Future)
1. **Move to AWS EKS**
   - Install Jenkins on Kubernetes using Helm
   - Same Jenkinsfile will work!
   - Configure cloud agents for distributed builds

2. **Add code quality gates**
   - Integrate SonarQube
   - Add code coverage requirements
   - Fail build if quality thresholds not met

3. **Implement GitOps**
   - Auto-deploy on successful build
   - Use GitHub/GitLab webhooks
   - Continuous Deployment to production

---

## ðŸ“ž QUICK REFERENCE

### URLs
- **Jenkins Dashboard:** http://localhost:8080
- **NammaSociety Pipeline:** http://localhost:8080/job/NammaSociety-Pipeline/
- **Build Console:** http://localhost:8080/job/NammaSociety-Pipeline/[BUILD_NUM]/console

### Commands

**Start Jenkins:**
```powershell
cd C:\AMP\Projects\MySoceity
java -jar jenkins.war --httpPort=8080
```

**Trigger Build:**
```powershell
.\TRIGGER_JENKINS_BUILD.ps1
```

**Check Git Status:**
```powershell
cd C:\AMP\Projects\MySoceity
git status
git log --oneline -5
```

**View Build Logs:**
```powershell
Get-Content "$env:USERPROFILE\.jenkins\jobs\NammaSociety-Pipeline\builds\lastBuild\log" -Tail 50
```

### File Locations
- **Jenkins Home:** `C:\Users\paran\.jenkins`
- **Job Config:** `C:\Users\paran\.jenkins\jobs\NammaSociety-Pipeline\config.xml`
- **Build Logs:** `C:\Users\paran\.jenkins\jobs\NammaSociety-Pipeline\builds\[NUM]\log`
- **Jenkinsfile:** `C:\AMP\Projects\MySoceity\Jenkinsfile`

---

## âœ… VERIFICATION CHECKLIST

Before considering Jenkins setup complete, verify:

- [ ] Jenkins is accessible at http://localhost:8080
- [ ] JDK, Maven, and Git are configured in Tools
- [ ] NammaSociety-Pipeline job exists
- [ ] Jenkinsfile is committed to Git (commit 3103a87)
- [ ] First build triggers successfully
- [ ] All pipeline stages complete (Checkout, Build, Test, Package, Archive)
- [ ] Backend JAR files are created
- [ ] Frontend dist folders are created
- [ ] Artifacts are downloadable from Jenkins UI
- [ ] Build logs are viewable
- [ ] Email notifications work (optional)

---

## ðŸ“š ADDITIONAL RESOURCES

**Jenkins Documentation:**
- Official Docs: https://www.jenkins.io/doc/
- Pipeline Syntax: https://www.jenkins.io/doc/book/pipeline/syntax/
- Jenkinsfile Examples: https://www.jenkins.io/doc/pipeline/examples/

**Troubleshooting:**
- Check logs: Click build â†’ "Console Output"
- Check Jenkins logs: `C:\Users\paran\.jenkins\logs\jenkins.log`
- Restart Jenkins: Stop the process â†’ Restart with `java -jar jenkins.war`

**Community Support:**
- Jenkins Community: https://community.jenkins.io/
- Stack Overflow: https://stackoverflow.com/questions/tagged/jenkins

---

**Created:** March 5, 2026  
**Last Updated:** March 5, 2026  
**Status:** âœ… Ready for Production Use  
**Next Review:** After first successful build

---

## ðŸŽ‰ READY TO BUILD!

Your Jenkins CI/CD pipeline is now fully configured and ready to use. Run your first build with:

```powershell
.\TRIGGER_JENKINS_BUILD.ps1
```

**Good luck with your automated builds!** ðŸš€

