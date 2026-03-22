# NammaSociety - Microservices & Microfrontend Architecture

A modern community management platform built with microservices backend (Java) and microfrontend architecture (Angular with Module Federation).

## Architecture Overview

### Frontend (Microfrontendss)
- **Host App**: Main shell application that orchestrates all microfrontends
- **Login MFE**: Authentication and login management
- **Register MFE**: User registration and account creation
- **Dashboard MFE**: Community dashboard and utilities

### Backend (Microservices)
- **Auth Service**: Authentication and authorization (Port: 8001)
- **User Service**: User profile and management (Port: 8002)

### Data Storage
- In-memory storage implementation (placeholder for future RDBMS integration)

## Prerequisites

- Node.js (v16+)
- npm or yarn
- Java JDK 11+
- Maven

## Installation

```bash
npm run install-all
```

## Development

Start all services in development mode:

```bash
# Terminal 1: Start Host App
npm run serve:host

# Terminal 2: Start Login MFE
npm run serve:login

# Terminal 3: Start Register MFE
npm run serve:register

# Terminal 4: Start Dashboard MFE
npm run serve:dashboard

# Terminal 5: Start Auth Service
npm run serve:auth

# Terminal 6: Start User Service
npm run serve:user
```

## Building

Build all applications:

```bash
npm run build-all
```

Or build individual components:

```bash
npm run build:host
npm run build:login
npm run build:register
npm run build:dashboard
npm run build:backend
```

## Project Structure

```
MySoceity/
â”œâ”€â”€ frontend/
â”‚   â”œâ”€â”€ host-app/          # Main shell application
â”‚   â”œâ”€â”€ login-mfe/         # Login microfrontend
â”‚   â”œâ”€â”€ register-mfe/      # Register microfrontend
â”‚   â””â”€â”€ dashboard-mfe/     # Dashboard microfrontend
â”œâ”€â”€ backend/
â”‚   â”œâ”€â”€ auth-service/      # Authentication microservice
â”‚   â””â”€â”€ user-service/      # User management microservice
â”œâ”€â”€ shared-assets/         # Shared images and resources
â””â”€â”€ documentation/         # Project documentation

```

## Key Features

- âœ… Microservices Architecture
- âœ… Microfrontend Architecture with Angular Module Federation
- âœ… In-Memory Data Storage (Placeholder for RDBMS)
- âœ… Scalable and Maintainable Code
- âœ… Independent Deployment of Microfrontends
- âœ… RESTful API Communication

## API Endpoints

### Auth Service (Port 8001)
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration

### User Service (Port 8002)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user profile
- `GET /api/users` - List all users

## Contributing

Follow the code style and architecture patterns established in the project.

## License

MIT

