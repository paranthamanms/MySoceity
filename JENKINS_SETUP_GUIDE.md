# Jenkins CI/CD Setup Guide for NammaSociety Project

## Installation Options

### Option 1: Install via Chocolatey (Recommended)

**Prerequisites:**
- Administrator PowerShell access

**Steps:**
1. Open PowerShell as Administrator (Right-click Start â†’ "Windows PowerShell (Admin)")
2. Navigate to project directory:
   ```powershell
   cd "c:\AMP\Projects\MySoceity"
   ```
3. Install Jenkins:
   ```powershell
   choco install jenkins -y
   ```
4. Wait for installation to complete (may take 2-3 minutes)

### Option 2: Manual Installation

**Steps:**
1. Download Jenkins from: https://www.jenkins.io/download/thank-you-downloading-windows-installer-stable
2. Run the installer (.msi file)
3. Follow the installation wizard:
   - Installation Directory: `C:\Program Files\Jenkins`
   - Service Type: Run as Windows Service
   - Service Account: LocalSystem (default)
   - Port: 8080 (default)
4. Click "Install" and wait for completion

## Post-Installation Setup

### 1. Start Jenkins Service

**Via PowerShell (Administrator):**
```powershell
Start-Service jenkins
Get-Service jenkins  # Verify it's running
```

**Via Services Manager:**
- Press Win+R, type `services.msc`
- Find "Jenkins" service
- Right-click â†’ Start

### 2. Access Jenkins Web Interface

1. Open browser and navigate to: **http://localhost:8080**
2. You'll see "Unlock Jenkins" page

### 3. Unlock Jenkins

1. Find the initial admin password:
   ```powershell
   Get-Content "C:\Program Files\Jenkins\secrets\initialAdminPassword"
   ```
2. Copy the password and paste it in the browser
3. Click "Continue"

### 4. Install Plugins

1. Select "Install suggested plugins"
2. Wait for installation (3-5 minutes)
3. Recommended additional plugins:
   - Email Extension Plugin (for notifications)
   - Pipeline Plugin (already included)
   - Git Plugin (already included)
   - Maven Integration Plugin
   - NodeJS Plugin

### 5. Create First Admin User

1. Fill in the form:
   - Username: `admin`
   - Password: (your choice)
   - Full name: Your name
   - Email: your-email@example.com
2. Click "Save and Continue"

### 6. Configure Jenkins URL

- Keep default: `http://localhost:8080/`
- Click "Save and Finish"
- Click "Start using Jenkins"

## Jenkins Configuration

### Configure JDK

1. Navigate to: **Manage Jenkins** â†’ **Tools**
2. Under **JDK installations**:
   - Click "Add JDK"
   - Name: `Java-25`
   - Uncheck "Install automatically"
   - JAVA_HOME: `C:\Program Files\Java\jdk-25`
3. Click "Save"

### Configure Maven

1. In **Tools** section (same page as JDK):
2. Under **Maven installations**:
   - Click "Add Maven"
   - Name: `Maven-3.9.12`
   - Uncheck "Install automatically"
   - MAVEN_HOME: `C:\Program Files\apache-maven-3.9.12` (or your Maven installation path)
3. Click "Save"

### Configure NodeJS (for Frontend builds)

1. In **Tools** section:
2. Under **NodeJS installations**:
   - Click "Add NodeJS"
   - Name: `Node-Latest`
   - Check "Install automatically"
   - Version: Select latest LTS version
3. Click "Save"

### Configure Email Notifications (Optional)

1. Navigate to: **Manage Jenkins** â†’ **System**
2. Scroll to **Extended E-mail Notification**:
   - SMTP server: `smtp.gmail.com` (or your SMTP server)
   - Default user e-mail suffix: `@yourdomain.com`
   - Use SMTP Authentication: Yes
   - User Name: your-email@gmail.com
   - Password: (your app password)
   - Use SSL: Yes
   - SMTP Port: 465
3. Scroll to **E-mail Notification** and configure similarly
4. Click "Test configuration" to verify
5. Click "Save"

## Create Jenkins Pipeline Job

### 1. Create New Job

1. From Jenkins homepage, click **New Item**
2. Enter name: `NammaSociety-Pipeline`
3. Select **Pipeline**
4. Click "OK"

### 2. Configure Pipeline

1. **General Section:**
   - Description: `CI/CD Pipeline for NammaSociety Application`
   - Check "Discard old builds" (Keep last 10 builds)

2. **Build Triggers:**
   - Check "Poll SCM"
   - Schedule: `H/5 * * * *` (polls every 5 minutes)
   - OR use "GitHub hook trigger" if you have GitHub setup

3. **Pipeline Section:**
   - Definition: **Pipeline script from SCM**
   - SCM: **Git**
   - Repository URL: Your git repository URL (or file path)
   - Branch Specifier: `*/appmod/java-upgrade-20260301053214`
   - Script Path: `Jenkinsfile`

4. Click "Save"

### 3. Run Your First Build

1. Click **Build Now** on the left sidebar
2. Watch the build progress in **Build History**
3. Click on the build number to see details
4. Click **Console Output** to see live logs

## Pipeline Features

Your Jenkinsfile includes:

### âœ… Multi-Stage Build Process

1. **Checkout**: Pulls code from repository
2. **Build Backend Services**: Compiles auth-service and user-service in parallel
3. **Test Backend Services**: Runs unit tests for both services
4. **Package Backend Services**: Creates JAR files
5. **Build Frontend Applications**: Builds all 4 Angular applications in parallel
6. **Archive Artifacts**: Saves JAR files and dist folders

### âœ… Parallel Execution

- Backend services build simultaneously
- Frontend applications build simultaneously
- Reduces total build time significantly

### âœ… Test Reports

- JUnit test results published
- Test trends visible on dashboard
- Failed tests highlighted

### âœ… Email Notifications

- Success: Green checkmark email sent
- Failure: Red X email with error details
- Includes build number and console output link

### âœ… Artifact Management

- JAR files archived
- Angular dist folders archived
- Artifacts available for download from Jenkins UI

## Troubleshooting

### Jenkins Won't Start

```powershell
# Check service status
Get-Service jenkins

# Restart service
Restart-Service jenkins

# Check logs
Get-Content "C:\Program Files\Jenkins\jenkins.err.log" -Tail 50
Get-Content "C:\Program Files\Jenkins\jenkins.out.log" -Tail 50
```

### Port 8080 Already in Use

1. Stop conflicting service
2. OR change Jenkins port:
   ```powershell
   # Edit jenkins.xml
   notepad "C:\Program Files\Jenkins\jenkins.xml"
   # Find: <arguments>-Xrs -Xmx256m -Dhudson.lifecycle=hudson.lifecycle.WindowsServiceLifecycle -jar "%BASE%\jenkins.war" --httpPort=8080
   # Change 8080 to 8090 (or any available port)
   # Save and restart Jenkins
   Restart-Service jenkins
   ```

### Build Fails: "mvn: command not found"

- Verify Maven is configured in Jenkins Tools
- Ensure MAVEN_HOME points to correct directory
- Restart Jenkins after configuration changes

### Build Fails: "npm: command not found"

- Install NodeJS plugin in Jenkins
- Configure NodeJS in Jenkins Tools
- Update Jenkinsfile to use NodeJS tool

### Frontend Build Fails: "Out of Memory"

Add to npm build commands in Jenkinsfile:
```groovy
bat 'npm run build -- --max-old-space-size=4096'
```

## Next Steps

1. **Setup Git Webhooks** (if using GitHub/GitLab):
   - Configure webhooks to trigger builds automatically on push
   - No need for SCM polling

2. **Add Code Quality Checks**:
   - Integrate SonarQube for code analysis
   - Add Checkstyle/PMD for Java
   - Add ESLint for Angular

3. **Setup Deployment Stage**:
   - Add deployment to staging/production
   - Use Docker containers
   - Deploy to cloud platforms (AWS/Azure/GCP)

4. **Add Integration Tests**:
   - Add Selenium/Cypress tests
   - Test complete user workflows

5. **Setup Monitoring**:
   - Integrate with monitoring tools
   - Track build success rates
   - Monitor build duration trends

## Useful Commands

```powershell
# Check Jenkins service status
Get-Service jenkins

# Start Jenkins
Start-Service jenkins

# Stop Jenkins
Stop-Service jenkins

# Restart Jenkins
Restart-Service jenkins

# View Jenkins logs
Get-Content "C:\Program Files\Jenkins\jenkins.out.log" -Tail 100

# Check Java version (should be 11+)
java -version

# Check Maven version
mvn -version

# Check Node version
node -v
npm -v
```

## Jenkins URL

**Local Access:** http://localhost:8080  
**Network Access:** http://YOUR_IP_ADDRESS:8080

## Support

For more information:
- Jenkins Documentation: https://www.jenkins.io/doc/
- Pipeline Syntax: https://www.jenkins.io/doc/book/pipeline/syntax/
- Plugin Index: https://plugins.jenkins.io/

---

**Created:** March 5, 2026  
**Project:** NammaSociety Application  
**Version:** 1.0

