# NammaSociety Project - Setup & Deployment Guide

## Prerequisites
- Node.js v16+ with npm
- Java JDK 11+
- Maven
- Git (optional)

## Project Structure

```
MySoceity/
â”œâ”€â”€ frontend/                          # Microfrontend Applications
â”‚   â”œâ”€â”€ host-app/                     # Main Shell Application (Port 4200)
â”‚   â”œâ”€â”€ login-mfe/                    # Login Microfrontend (Port 4201)
â”‚   â”œâ”€â”€ register-mfe/                 # Register Microfrontend (Port 4202)
â”‚   â””â”€â”€ dashboard-mfe/                # Dashboard Microfrontend (Port 4203)
â”œâ”€â”€ backend/                           # Microservices
â”‚   â”œâ”€â”€ auth-service/                 # Authentication Service (Port 8001)
â”‚   â””â”€â”€ user-service/                 # User Management Service (Port 8002)
â”œâ”€â”€ shared-assets/                    # Shared Images and Resources
â””â”€â”€ documentation/                    # Project Documentation
```

## Initial Setup

### 1. Copy Assets from Baashayaam

Copy the following files from the Baashayaam project to NammaSociety:

```bash
# Copy images
xcopy "C:\Users\paran\OneDrive\Desktop\My Projects\Baashayaam\src\main\webapp\images\4.jpg" "C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity\shared-assets\images\"

xcopy "C:\Users\paran\OneDrive\Desktop\My Projects\Baashayaam\src\main\webapp\images\logo.svg" "C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity\shared-assets\images\"
```

### 2. Copy Assets to Each MFE

After copying to shared-assets, distribute to each microfrontend:

```bash
# Copy to Login MFE
xcopy "C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity\shared-assets\images\*" "C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity\frontend\login-mfe\src\assets\images\"

# Copy to Register MFE
xcopy "C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity\shared-assets\images\*" "C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity\frontend\register-mfe\src\assets\images\"

# Copy to Dashboard MFE
xcopy "C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity\shared-assets\images\*" "C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity\frontend\dashboard-mfe\src\assets\images\"
```

### 3. Install Dependencies

Install all npm dependencies:

```bash
cd C:\Users\paran\OneDrive\Desktop\My Projects\AMP\MySoceity

# Install Host App
cd frontend\host-app
npm install
cd ..\..

# Install Login MFE
cd frontend\login-mfe
npm install
cd ..\..

# Install Register MFE
cd frontend\register-mfe
npm install
cd ..\..

# Install Dashboard MFE
cd frontend\dashboard-mfe
npm install
cd ..\..
```

Or use the convenience script:
```bash
npm run install-all
```

## Running the Application

### Development Mode - Start All Services

You need to open multiple terminal windows. Each service runs on a different port.

#### Terminal 1: Start Auth Service (Port 8001)
```bash
cd backend\auth-service
mvn clean install
mvn spring-boot:run
```

#### Terminal 2: Start User Service (Port 8002)
```bash
cd backend\user-service
mvn clean install
mvn spring-boot:run
```

#### Terminal 3: Start Login MFE (Port 4201)
```bash
cd frontend\login-mfe
npm install
npm start
```

#### Terminal 4: Start Register MFE (Port 4202)
```bash
cd frontend\register-mfe
npm install
npm start
```

#### Terminal 5: Start Dashboard MFE (Port 4203)
```bash
cd frontend\dashboard-mfe
npm install
npm start
```

#### Terminal 6: Start Host App (Port 4200)
```bash
cd frontend\host-app
npm install
npm start
```

### Access the Application

Once all services are running, open your browser and navigate to:
```
http://localhost:4200
```

## Services Overview

### Backend Services

#### Auth Service (Port 8001)
- **Health Check**: `GET http://localhost:8001/api/auth/health`
- **Login**: `POST http://localhost:8001/api/auth/login`
  - Body: `{"username": "string", "password": "string"}`
- **Register**: `POST http://localhost:8001/api/auth/register`
  - Body: Complete registration form data
- **Validate Token**: `POST http://localhost:8001/api/auth/validate`
  - Header: `Authorization: Bearer <token>`
- **Logout**: `POST http://localhost:8001/api/auth/logout`

#### User Service (Port 8002)
- **Health Check**: `GET http://localhost:8002/api/users/health`
- **Get User Profile**: `GET http://localhost:8002/api/users/{userId}`
- **Create Profile**: `POST http://localhost:8002/api/users`
- **Update Profile**: `PUT http://localhost:8002/api/users/{userId}`
- **List All Profiles**: `GET http://localhost:8002/api/users`
- **Delete Profile**: `DELETE http://localhost:8002/api/users/{userId}`

### Frontend Applications

#### Host App (Port 4200)
- Main shell application that orchestrates all microfrontends
- Routes to login, register, and dashboard microfrontends
- Manages overall application state

#### Login MFE (Port 4201)
- Login interface with username and password
- Register link to navigate to registration
- Stores JWT token in localStorage after successful login
- Redirects to dashboard on successful login

#### Register MFE (Port 4202)
- User registration form
- Collects: User Type, Owner Type (if owner), Tower, Flat, Username, Email, Password
- Validates passwords match
- Creates user account via Auth Service
- Returns to login on successful registration

#### Dashboard MFE (Port 4203)
- Main dashboard after login
- Displays user information
- Shows community widgets and utilities
- Logout functionality
- Responsive navigation menu

## Data Storage

Currently, all data is stored in-memory using Java `ConcurrentHashMap`. This is suitable for:
- Development and testing
- Demonstration purposes
- Proof of concept

### Future RDBMS Integration

To integrate a real database (MySQL, PostgreSQL, etc.):

1. **Replace UserRepository** in auth-service with JPA/Hibernate implementation
2. **Add Database Dependencies** to pom.xml:
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-data-jpa</artifactId>
   </dependency>
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-validation</artifactId>
   </dependency>
   <!-- Add your database driver -->
   ```

3. **Create JPA Entity**:
   ```java
   @Entity
   @Table(name = "users")
   public class UserEntity { ... }
   ```

4. **Create Repository Interface**:
   ```java
   @Repository
   public interface UserJpaRepository extends JpaRepository<UserEntity, String> { ... }
   ```

5. **Update Configuration** in `application.yml`:
   ```yaml
   spring:
     datasource:
       url: jdbc:mysql://localhost:3306/NammaSociety
       username: root
       password: yourpassword
       driver-class-name: com.mysql.cj.jdbc.Driver
     jpa:
       hibernate:
         ddl-auto: update
       properties:
         hibernate:
           dialect: org.hibernate.dialect.MySQL8Dialect
   ```

## Building for Production

### Build Backend Services
```bash
# Auth Service
cd backend\auth-service
mvn clean package

# User Service
cd backend\user-service
mvn clean package
```

### Build Frontend Applications
```bash
# Host App
cd frontend\host-app
npm run build

# Login MFE
cd frontend\login-mfe
npm run build

# Register MFE
cd frontend\register-mfe
npm run build

# Dashboard MFE
cd frontend\dashboard-mfe
npm run build
```

## Troubleshooting

### Port Already in Use
If a port is already in use, modify the port in:
- Backend: `src/main/resources/application.yml`
- Frontend: Add `--port XXXX` to ng serve command

### CORS Issues
Make sure all services have CORS enabled. The project includes CORS configuration for:
- `http://localhost:4200` (Host)
- `http://localhost:4201` (Login)
- `http://localhost:4202` (Register)
- `http://localhost:4203` (Dashboard)

### Module Not Found Errors
Ensure all npm dependencies are installed:
```bash
npm install
```

## Architecture Notes

### Microservices Architecture
- **Auth Service**: Handles user authentication and JWT token generation
- **User Service**: Manages user profiles and information
- Services communicate via REST APIs
- In-memory database (placeholder for real DB)

### Microfrontend Architecture
- **Host App**: Main shell application (Shell Pattern)
- **Dynamic Imports**: Each MFE is lazy-loaded
- **Independent Deployment**: Each MFE can be deployed independently
- **Shared Services**: Can be extended with shared libraries

## Security Considerations

### Current Implementation
- JWT tokens for authentication
- Password encryption with BCrypt
- CORS configured for localhost only

### Production Recommendations
1. Use HTTPS for all communications
2. Implement refresh token rotation
3. Add rate limiting on login/register endpoints
4. Use environment-specific configurations
5. Implement logging and monitoring
6. Set up API authentication between services
7. Use secure password policies

## Performance Optimization

### Frontend
- Lazy load microfrontends
- Implement route-level code splitting
- Use OnPush change detection strategy
- Implement caching strategies

### Backend
- Add database connection pooling
- Implement caching (Redis)
- Add API rate limiting
- Implement pagination for list endpoints

## Next Steps

1. **Copy Assets**: Follow the asset copying instructions above
2. **Install Dependencies**: Run `npm install` in each directory
3. **Start Services**: Follow the "Running the Application" section
4. **Test APIs**: Use Postman or similar tool to test endpoints
5. **Customize**: Modify components and services as needed

## Support & Documentation

For more information:
- Angular: https://angular.io/docs
- Spring Boot: https://spring.io/projects/spring-boot
- JWT: https://jwt.io/introduction
- Module Federation: https://webpack.js.org/concepts/module-federation/

---

**Last Updated**: February 2026

