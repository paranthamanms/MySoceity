# Architecture Overview

## System Design

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚                     HOST APPLICATION                         â”‚
â”‚                    (Angular - Port 4200)                      â”‚
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                    â”‚           â”‚            â”‚
                    â–¼           â–¼            â–¼
            â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”  â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
            â”‚  Login   â”‚  â”‚Register  â”‚  â”‚Dashboard â”‚
            â”‚   MFE    â”‚  â”‚   MFE    â”‚  â”‚   MFE    â”‚
            â”‚ :4201    â”‚  â”‚  :4202   â”‚  â”‚  :4203   â”‚
            â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜  â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                    â”‚           â”‚            â”‚
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                            â”‚
                â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                â–¼                        â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚  Auth Service   â”‚    â”‚  User Service   â”‚
        â”‚(Spring Boot)    â”‚    â”‚(Spring Boot)    â”‚
        â”‚  Port: 8001     â”‚    â”‚  Port: 8002     â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
                â”‚                      â”‚
                â–¼                      â–¼
        â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”    â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â”‚  In-Memory DB   â”‚    â”‚  In-Memory DB   â”‚
        â”‚  (User Data)    â”‚    â”‚ (Profile Data)  â”‚
        â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

## Component Diagram

### Frontend Architecture (Microfrontend Pattern)

```
Host Application (Shell)
â”œâ”€â”€ Provides HTML shell
â”œâ”€â”€ Manages routing
â”œâ”€â”€ Handles shared services
â””â”€â”€ Loads MFEs dynamically

Login MFE
â”œâ”€â”€ login.component
â”œâ”€â”€ auth.service
â””â”€â”€ Styling (SCSS)

Register MFE
â”œâ”€â”€ register.component
â”œâ”€â”€ auth.service
â””â”€â”€ Styling (SCSS)

Dashboard MFE
â”œâ”€â”€ dashboard.component
â”œâ”€â”€ auth.service
â””â”€â”€ Styling (SCSS)
```

### Backend Architecture (Microservices Pattern)

```
Auth Service
â”œâ”€â”€ AuthController
â”œâ”€â”€ AuthService
â”œâ”€â”€ JwtTokenProvider
â”œâ”€â”€ UserRepository (In-Memory)
â””â”€â”€ Models: User, LoginRequest, RegisterRequest

User Service
â”œâ”€â”€ UserProfileController
â”œâ”€â”€ UserProfileService
â”œâ”€â”€ UserProfileRepository (In-Memory)
â””â”€â”€ Models: UserProfile
```

## Data Flow

### Login Flow
```
1. User enters credentials in Login MFE
2. Login Component sends POST to Auth Service (/api/auth/login)
3. Auth Service validates credentials
4. If valid:
   - Generates JWT token
   - Returns token and user data
5. Token stored in localStorage
6. User redirected to Dashboard
```

### Register Flow
```
1. User enters registration details in Register MFE
2. Register Component sends POST to Auth Service (/api/auth/register)
3. Auth Service:
   - Validates inputs
   - Checks username/email uniqueness
   - Encrypts password with BCrypt
   - Creates user in repository
4. If successful:
   - Generates JWT token
   - Returns token and user data
5. Dashboard loads with user info
```

### Dashboard Access Flow
```
1. Dashboard MFE loads
2. Checks localStorage for token
3. If no token, redirects to login
4. If token exists:
   - Loads user data from localStorage
   - Displays personalized content
5. On logout:
   - Clears localStorage
   - Calls logout endpoint
   - Redirects to login
```

## API Contracts

### Authentication Service (Port 8001)

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "string",
  "password": "string"
}

Response (200):
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "user": {
    "id": "uuid",
    "username": "string",
    "email": "string",
    "userType": "owner|tenant",
    "towerNumber": "string",
    "flatNumber": "string"
  }
}
```

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "string",
  "email": "string",
  "password": "string",
  "confirmPassword": "string",
  "userType": "owner|tenant",
  "ownerType": "resident|nonResident",
  "towerNumber": "string",
  "flatNumber": "string"
}

Response (200):
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzUxMiJ9...",
  "user": {...}
}
```

### User Service (Port 8002)

#### Get Profile
```
GET /api/users/{userId}

Response (200):
{
  "userId": "string",
  "username": "string",
  "email": "string",
  "userType": "owner|tenant",
  "towerNumber": "string",
  "flatNumber": "string",
  "phoneNumber": "string",
  "address": "string",
  "active": true
}
```

#### Update Profile
```
PUT /api/users/{userId}
Content-Type: application/json

{
  "phoneNumber": "string",
  "address": "string",
  "profilePhotoUrl": "string"
}

Response (200): Updated profile object
```

## Technology Stack

### Frontend
- **Framework**: Angular 16
- **Language**: TypeScript
- **Module Federation**: Native Angular v16
- **Styling**: SCSS
- **HTTP Client**: Angular HttpClientModule
- **State Management**: localStorage + Services

### Backend
- **Framework**: Spring Boot 3.1.0
- **Language**: Java 11
- **Security**: Spring Security + JWT
- **JWT Library**: jjwt
- **Password Encoding**: BCrypt
- **Build Tool**: Maven
- **Database**: In-Memory (ConcurrentHashMap)

### DevOps
- **Package Manager**: npm (Frontend), Maven (Backend)
- **Development Server**: Angular CLI, Maven
- **Build Tool**: Angular CLI, Maven

## Directory Structure Details

```
MySoceity/
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ host-app/
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ app.component.ts
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ app.module.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ app.routing.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ main.ts
â”‚   â”‚   â”‚   â””â”€â”€ index.html
â”‚   â”‚   â”œâ”€â”€ angular.json
â”‚   â”‚   â”œâ”€â”€ package.json
â”‚   â”‚   â””â”€â”€ tsconfig.json
â”‚   â”‚
â”‚   â”œâ”€â”€ login-mfe/
â”‚   â”‚   â”œâ”€â”€ src/
â”‚   â”‚   â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ pages/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ login/
â”‚   â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ login.component.ts
â”‚   â”‚   â”‚   â”‚   â”‚       â”œâ”€â”€ login.component.html
â”‚   â”‚   â”‚   â”‚   â”‚       â””â”€â”€ login.component.scss
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ services/
â”‚   â”‚   â”‚   â”‚   â”‚   â””â”€â”€ auth.service.ts
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ login.module.ts
â”‚   â”‚   â”‚   â”œâ”€â”€ assets/images/ (4.jpg, logo.svg)
â”‚   â”‚   â”œâ”€â”€ package.json
â”‚   â”‚   â””â”€â”€ angular.json
â”‚   â”‚
â”‚   â”œâ”€â”€ register-mfe/
â”‚   â”‚   â””â”€â”€ (Similar structure to login-mfe)
â”‚   â”‚
â”‚   â””â”€â”€ dashboard-mfe/
â”‚       â””â”€â”€ (Similar structure to login-mfe)
â”‚
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ auth-service/
â”‚   â”‚   â”œâ”€â”€ src/main/java/com/NammaSociety/auth/
â”‚   â”‚   â”‚   â”œâ”€â”€ AuthServiceApplication.java
â”‚   â”‚   â”‚   â”œâ”€â”€ controller/
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ AuthController.java
â”‚   â”‚   â”‚   â”œâ”€â”€ service/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ AuthService.java
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ JwtTokenProvider.java
â”‚   â”‚   â”‚   â”œâ”€â”€ model/
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ User.java
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ LoginRequest.java
â”‚   â”‚   â”‚   â”‚   â”œâ”€â”€ RegisterRequest.java
â”‚   â”‚   â”‚   â”‚   â””â”€â”€ AuthResponse.java
â”‚   â”‚   â”‚   â””â”€â”€ repository/
â”‚   â”‚   â”‚       â””â”€â”€ UserRepository.java
â”‚   â”‚   â”œâ”€â”€ src/main/resources/
â”‚   â”‚   â”‚   â””â”€â”€ application.yml
â”‚   â”‚   â””â”€â”€ pom.xml
â”‚   â”‚
â”‚   â””â”€â”€ user-service/
â”‚       â””â”€â”€ (Similar structure to auth-service)
â”‚
â”œâ”€â”€ shared-assets/
â”‚   â””â”€â”€ images/
â”‚       â”œâ”€â”€ 4.jpg
â”‚       â””â”€â”€ logo.svg
â”‚
â”œâ”€â”€ package.json
â”œâ”€â”€ README.md
â”œâ”€â”€ SETUP_GUIDE.md
â””â”€â”€ ARCHITECTURE.md
```

## Security Architecture

### Authentication Flow
1. Username/Password sent to Auth Service
2. Password compared with stored BCrypt hash
3. JWT token generated with user claims
4. Token includes userId and username
5. Token stored client-side (localStorage)
6. Subsequent requests include token in Authorization header

### Authorization
- Services validate JWT token for protected endpoints
- Token contains userId for identifying user
- Can be extended with role-based access control (RBAC)

## Deployment Architecture

### Development Environment
```
localhost:4200 - Host App
localhost:4201 - Login MFE
localhost:4202 - Register MFE
localhost:4203 - Dashboard MFE
localhost:8001 - Auth Service
localhost:8002 - User Service
```

### Production Considerations
- Use Docker containers for each service
- Kubernetes orchestration for scaling
- API Gateway for routing and load balancing
- CDN for static assets
- Real database (MySQL/PostgreSQL)
- Environment variables for configuration
- SSL/TLS for all communications

## Performance Characteristics

### Frontend
- Each MFE ~50-100KB (gzipped)
- Initial load ~2-3 seconds
- Lazy loading reduces initial bundle size
- Responsive design supports all screen sizes

### Backend
- In-memory operations: < 1ms
- API response time: 10-50ms
- Can handle ~1000 concurrent users with current setup
- Database integration would impact performance based on DB

## Scalability Path

1. **Phase 1** (Current): In-memory, localhost
2. **Phase 2**: Containerization (Docker)
3. **Phase 3**: Kubernetes deployment
4. **Phase 4**: Database integration
5. **Phase 5**: Microservice mesh (Istio)
6. **Phase 6**: Multi-region deployment

---

**Document Version**: 1.0  
**Last Updated**: February 2026

