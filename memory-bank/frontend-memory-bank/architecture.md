# Frontend Architecture

### Docker, Compose, and Nginx Configuration

- **Dockerfile**: Defines multi-stage builds for both development (Node/Vite, hot reload) and production (Nginx serving built static files). Ensures consistent, reproducible environments for both local development and deployment.
- **.dockerignore**: Excludes files/folders (node_modules, dist, etc.) from Docker build context for faster, smaller builds.
- **docker-compose.yml**: Orchestrates dev and prod containers. Dev container exposes Vite on 5173 with hot reload and live mounts; prod container serves the built app via Nginx on port 3000, includes health checks. Compose simplifies multi-container management and networking.
- **nginx.conf**: Custom Nginx config for SPA routing (serves index.html for unknown routes) and API proxying (e.g., /api/ routes to backend). Ensures the frontend works seamlessly in production environments.

These files enable local development parity with production, support hot reloading, and streamline deployment and testing for the frontend team.
### Configuration and Quality Tools

#### Authentication Context
- **src/contexts/AuthContext.tsx**: Provides authentication state and actions (login/logout, token management, session timeout) via React Context. Exposes a `useAuth` hook for accessing auth state and actions in components. Centralizes authentication logic and ensures consistent access to user/session info across the app.
- **src/pages/auth/Register.tsx**: Implements the registration form using React Hook Form, Zod schema validation, and Ant Design components. Handles user registration by calling `/api/auth/register`, displays validation and server errors, and ensures a consistent UI/UX with the login page.

#### Core Dependencies
- **react-router-dom**: Client-side routing.
- **axios**: HTTP client for API requests.
- **@tanstack/react-query**: Server state management and data fetching.
- **zod**: Runtime type validation.
- **react-hook-form**: Form state management.
- **@hookform/resolvers**: Integrates Zod with React Hook Form.
- **antd**: Ant Design UI component library.
- **@ant-design/icons**: Icon set for Ant Design.
- **styled-components**: CSS-in-JS styling solution.
- **@storybook/react**: UI component development and documentation.
- **cypress**: End-to-end testing framework.
- **@types/styled-components, @types/react-router-dom, @types/jest**: TypeScript typings for smoother development.
- **react-error-boundary**: Error boundary component for React.


#### Absolute Imports
- **tsconfig.app.json**: The `baseUrl` and `paths` options allow you to use absolute imports like `@components/Button` or `@utils/helpers` from anywhere in the `src/` tree, improving code readability and maintainability.
- **vite.config.ts**: The `resolve.alias` section mirrors these paths for Vite's module resolver, ensuring absolute imports work in both development and production builds.
- **vite.config.ts**: Also configures the Vite dev server to proxy all `/api` requests to the backend (e.g., `http://localhost:8080`). This allows frontend code to use relative API paths in development, avoiding CORS issues and 404s from the Vite server.


- **.eslintrc.cjs**: ESLint configuration file. Defines linting rules for JavaScript/TypeScript, React, and Prettier integration. Ensures code style and best practices are enforced across the codebase.
- **.prettierrc**: Prettier configuration file. Dictates code formatting rules (quotes, semicolons, line length, etc.) for consistent style in all files.
- **.eslintignore**: Specifies files and directories for ESLint to skip, such as build outputs and node_modules, improving lint speed and avoiding unnecessary lint errors.
- **.husky/pre-commit**: Git hook script that runs lint-staged before every commit. Ensures only properly formatted and linted code can be committed, preventing code quality issues from entering the repository.


```
src/
├── assets/            # Static assets (images, fonts, etc.)
├── components/        # Reusable UI components
│   ├── common/       # Common components (buttons, inputs, etc.)
│   ├── layout/       # Layout components (header, sidebar, etc.)
│   └── ui/           # Basic UI elements
├── config/           # Application configuration
├── contexts/         # React contexts
├── hooks/            # Custom React hooks
├── pages/            # Page components
│   ├── auth/        # Authentication pages
│   ├── dashboard/   # Main dashboard
│   ├── projects/    # Project management
│   ├── tasks/       # Task management
│   └── users/       # User management (admin)
├── services/         # API services
├── store/            # State management
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── App.tsx           # Main application component
```

## Technology Stack

### Core Technologies
- **React 18**: Component-based UI library
- **TypeScript**: For type safety
- **React Router v6**: Client-side routing
- **Axios**: HTTP client for API requests
- **React Query**: Server state management
- **Zod**: Runtime type validation

### UI Libraries
- **Ant Design (antd)**: UI component library
- **Styled Components**: For component-level styling
- **React Icons**: For iconography

### State Management
- **Context API**: For global state (auth, theme)
- **Zustand**: For complex client-side state (if needed)

## Authentication Flow

1. User enters credentials on login page
2. Credentials are validated client-side using Zod
3. On successful validation, API request is made to `/api/auth/login`
4. JWT token is stored in localStorage and auth context is updated
5. Protected routes check for valid authentication
6. Token is included in subsequent API requests via Axios interceptors

## API Integration

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Projects
- `GET /api/v1/projects` - Get all projects
- `POST /api/v1/projects` - Create project (Admin only)
- `GET /api/v1/projects/{id}` - Get project by ID
- `PUT /api/v1/projects/{id}` - Update project
- `DELETE /api/v1/projects/{id}` - Delete project
- `GET /api/v1/projects/{projectId}/tasks` - Get project tasks
- `POST /api/v1/projects/{projectId}/tasks` - Create task in project (Admin only)

### Tasks
- `GET /api/v1/tasks` - Get all tasks
- `GET /api/v1/tasks/{id}` - Get task by ID
- `POST /api/v1/tasks` - Create task
- `PUT /api/v1/tasks/{id}` - Update task
- `DELETE /api/v1/tasks/{id}` - Delete task

### Users (Admin only)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/{id}` - Get user by ID
- `POST /api/v1/users` - Create user
- `PUT /api/v1/users/{id}` - Update user
- `DELETE /api/v1/users/{id}` - Delete user

## State Management Strategy

### Global State (Context API)
- Authentication state (user, token, roles)
- UI state (theme, loading states, notifications)
- Application settings

### Local State (useState/useReducer)
- Form states
- Component-specific UI states
- Modal/dialog visibility

### Server State (React Query)
- API data caching
- Background updates
- Request deduplication
- Pagination and infinite loading

## Performance Optimization

### Build Optimization
- Code splitting with React.lazy and Suspense
- Tree shaking
- Production build optimization

### Runtime Optimization
- Memoization with React.memo and useMemo
- Virtualized lists for large datasets
- Image optimization
- Lazy loading of non-critical components

## Security Considerations

- JWT token storage in localStorage with XSS protection
- CSRF protection for state-changing operations
- Input validation on both client and server
- Secure HTTP headers
- Content Security Policy (CSP) implementation

## Testing Strategy

### Unit Testing
- Component testing with React Testing Library
- Utility function testing
- Custom hook testing

### Integration Testing
- User flows
- Form submissions
- API interactions

### E2E Testing
- Critical user journeys with Cypress
- Cross-browser testing
- Accessibility testing

## Deployment

### Development
- Local development server with hot reload
- Docker containerization
- Environment-based configuration

### Production
- Optimized production build
- Container orchestration with Docker Swarm/Kubernetes
- CI/CD pipeline with GitHub Actions
- Monitoring and error tracking

## Future Considerations

- Progressive Web App (PWA) support
- Offline functionality with service workers
- Real-time updates with WebSockets
- Internationalization (i18n)
- Advanced analytics integration
