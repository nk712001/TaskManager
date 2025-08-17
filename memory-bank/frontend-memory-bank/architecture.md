# Frontend Architecture

### Docker, Compose, and Nginx Configuration

- **Dockerfile**: Defines multi-stage builds for both development (Node/Vite, hot reload) and production (Nginx serving built static files). Ensures consistent, reproducible environments for both local development and deployment.
- **.dockerignore**: Excludes files/folders (node_modules, dist, etc.) from Docker build context for faster, smaller builds.
- **docker-compose.yml**: Orchestrates dev and prod containers. Dev container exposes Vite on 5173 with hot reload and live mounts; prod container serves the built app via Nginx on port 3000, includes health checks. Compose simplifies multi-container management and networking.
- **nginx.conf**: Custom Nginx config for SPA routing (serves index.html for unknown routes) and API proxying (e.g., /api/ routes to backend). Ensures the frontend works seamlessly in production environments.

These files enable local development parity with production, support hot reloading, and streamline deployment and testing for the frontend team.
### Configuration and Quality Tools

#### Authentication Context
- **src/contexts/AuthContext.tsx**: Implements the authentication provider for the entire app. Handles login/logout, JWT and refresh token storage, 'Remember Me' functionality (persists credentials in localStorage), session timeout (auto-logout after 30 minutes), and exposes error/loading states. State is restored from localStorage on mount. The `useAuth` hook allows any component to access auth state and actions, ensuring a consistent authentication flow and centralized logic.
- **src/pages/auth/Login.tsx**: Implements the login form using React Hook Form, Zod validation, and Ant Design UI components. Integrates with AuthContext for login and error handling. Supports 'Remember Me' and displays error/loading states.
- **src/pages/auth/Register.tsx**: Implements the registration form using React Hook Form, Zod schema validation, and Ant Design components. Handles user registration by calling `/api/auth/register`, displays validation and server errors, and ensures a consistent UI/UX with the login page.
- **src/components/common/PrivateRoute.tsx**: A wrapper component for route protection. It uses `useAuth` to check if a user is authenticated. If not, it redirects to `/login` and preserves the intended destination. While authentication state is loading, it displays a loading indicator. Used in `router.tsx` to protect routes like the Dashboard.
- **Protected Route Mechanism**: Routes that require authentication are wrapped in `PrivateRoute`. This ensures only authenticated users can access them, and handles redirecting unauthenticated users to login, with their original destination saved for post-login navigation.
- **Authentication Flow**: On login, credentials are validated client-side, then sent to `/api/auth/login`. On success, JWT tokens and user info are stored in localStorage (if 'Remember Me' is checked) and in React state. The session auto-expires after 30 minutes of inactivity. All protected routes will check for valid authentication using the context.
#### Core Dependencies
- **react-router-dom**: Client-side routing with nested routes and navigation.
- **axios**: HTTP client for API requests with interceptors for auth tokens.
- **@tanstack/react-query**: Server state management and data fetching with caching.
- **zod**: Runtime type validation for forms and API responses.
- **react-hook-form**: Form state management with validation integration.
- **@hookform/resolvers**: Integrates Zod with React Hook Form.
- **antd**: Ant Design UI component library for consistent design system.
- **@ant-design/icons**: Comprehensive icon set for the application.
- **styled-components**: CSS-in-JS styling solution for component-level styles.
- **@storybook/react**: UI component development and documentation.
- **cypress**: End-to-end testing framework.
- **@types/***: TypeScript type definitions for all dependencies.
- **react-error-boundary**: Error boundary component for React.

### Theming and Theme Provider
- **theme.ts**: Centralizes theme tokens (colors, fonts, radius) for the app. Exports `lightTheme` (and a `darkTheme` scaffold) in Ant Design's ThemeConfig format.
- **App.tsx**: Wraps the app in both Ant Design's `ConfigProvider` and styled-components' `ThemeProvider`, using the same tokens. This ensures Ant Design components and custom styled-components share a single source of truth for theming. Ready for future dark/light mode.

### Task Management

#### Task API Abstraction
- **Location**: `src/api/tasks.ts`
- **Purpose**: Provides a type-safe interface for all task-related backend operations.
- **Functions**:
  - `fetchTasks()`: Retrieves tasks with optional filtering and sorting
  - `createTask()`: Creates a new task with validation
  - `updateTask()`: Updates an existing task
  - `deleteTask()`: Removes a task
- **Type Safety**: Uses TypeScript interfaces for task data structures and API responses
- **Error Handling**: Consistent error handling with React Query integration

#### TaskList Component
- **Location**: `src/pages/tasks/TaskList.tsx`
- **Purpose**: Displays a filterable and sortable list of tasks
- **Features**:
  - Server-side filtering and sorting
  - Pagination support
  - Status-based filtering
  - Responsive design for all screen sizes
  - Integration with React Query for data management

#### TaskForm Component
- **Location**: `src/pages/tasks/TaskForm.tsx`
- **Purpose**: Handles task creation and editing
- **Features**:
  - Form validation using React Hook Form and Zod
  - Reusable form component following the project's form pattern
  - Support for all task fields including title, description, status, priority, and assignment
  - Error handling and loading states
  - Integration with the task API for data persistence

### Project Management

#### Project API Abstraction
- **Location**: `src/api/projects.ts`
- **Purpose**: Provides a type-safe abstraction for all project-related backend operations using Axios.
- **Functions**:
  - `fetchProjects()`: Fetches all projects from the backend.
  - `createProject()`: Creates a new project (expects name, description, owner).
  - `updateProject()`: Updates an existing project by ID (partial update supported).
  - `deleteProject()`: Deletes a project by ID.
- **Type Safety**: All functions use the `Project` TypeScript interface, ensuring compile-time safety and clear API contracts.
- **Error Handling**: Errors are surfaced to the UI via React Query's mutation hooks and Ant Design's message/alert components.

#### Projects Page (CRUD UI)
- **Location**: `src/pages/projects/Projects.tsx`
- **Purpose**: Displays all projects in a table and allows users to create, edit, or delete projects.
- **Features**:
  - Uses Ant Design's `Table` for listing, and `Modal`/`Form` for create/edit dialogs.
  - Integrates with React Query for all data fetching and mutations, ensuring UI stays in sync with backend state.
  - Edit and delete actions are available per row; create is available via the "New Project" button.
  - All forms are type-safe and validated; errors are shown to the user.
- **Data Flow**:
  - Table data comes from `useQuery` using `fetchProjects`.
  - Create/edit/delete use `useMutation` hooks, which trigger `invalidateQueries` to refetch project data on success.
  - Modal forms are controlled by local state and reset after each operation.
- **UI/UX**: Consistent Ant Design look and feel, with loading and error states for all actions.

#### Project Details View
- **Location**: `src/pages/projects/ProjectDetails.tsx`
- **Purpose**: Displays detailed information about a specific project, including its tasks and metadata.
- **Features**:
  - Fetches and displays project details using React Query's `useQuery` with the `fetchProjectById` API function.
  - Shows project information in a clean, organized layout using Ant Design's `Descriptions` component.
  - Implements responsive design that works well on both desktop and mobile devices.
  - Includes loading states, error boundaries, and user-friendly error messages.
  - Displays related tasks with their status indicators.
- **Data Flow**:
  - On mount, triggers a query to fetch project data by ID from the URL parameters.
  - Uses React Query's caching to avoid unnecessary refetches.
  - Handles loading and error states gracefully with appropriate UI feedback.
- **UI/UX**:
  - Clean, card-based layout with clear section separation.
  - Back button for easy navigation to the projects list.
  - Relative timestamps using `dayjs` for better readability.
  - Responsive design that adapts to different screen sizes.
  - Consistent styling with the rest of the application using Ant Design components.

---

### Layout Components

#### AppLayout
- **Location**: `src/components/layout/AppLayout.tsx`
- **Purpose**: Main layout wrapper that structures the application with header, sidebar, and content areas.
- **Features**:
  - Responsive layout using Ant Design's Layout component
  - Consistent structure across all authenticated routes
  - Handles loading states and error boundaries
  - **Responsive Navigation:**
    - Uses Ant Design's `useBreakpoint` to detect mobile/desktop.
    - Controls sidebar Drawer state and passes `isMobile`/handlers to Sidebar and Header.
    - Adjusts content margin and width based on screen size, so content uses full width on mobile.

#### Dashboard
- **Location**: `src/pages/dashboard/Dashboard.tsx`
- **Purpose**: Main dashboard page, providing an overview of projects, tasks, and recent activity for authenticated users.
- **Features**:
  - Displays high-level summary cards, a task status summary chart, and a recent activity feed.
  - Fetches dashboard data via hooks (`useDashboardStats`, `useRecentActivities`) and displays loading/error states for each section.
  - Protected by `PrivateRoute` and always wrapped in `AppLayout` for consistent navigation and theming.

#### StatusSummaryChart
- **Location**: `src/components/dashboard/StatusSummaryChart.tsx`
- **Purpose**: Visualizes the breakdown of task statuses (e.g., Completed, Pending, etc.) in the dashboard.
- **Features**:
  - Receives an array of status objects and renders a progress bar for each status using Ant Design's `Progress` component.
  - Shows both count and percentage for each status, providing a quick visual summary.
  - Used within the dashboard, but can be reused elsewhere for task status breakdowns.

#### RecentActivityFeed
- **Location**: `src/components/dashboard/RecentActivityFeed.tsx`
- **Purpose**: Displays a feed of recent user actions (task/project creation, completion, comments, etc.) for at-a-glance project activity.
- **Features**:
  - Renders user avatars, action descriptions, targets, and timestamps in a list format using Ant Design's `List` and `Avatar` components.
  - Receives activity data as a prop and is integrated into the dashboard.
  - Designed for extensibility and can be reused in other parts of the app.

#### Dashboard Data Flow and Protection
- **Data Fetching**: Dashboard components use React Query hooks to fetch and cache server data, ensuring efficient updates and error handling.
  - The recent activity feed uses the `useRecentActivities` hook, which fetches activity data (mocked for development) from the API layer.
- **Route Protection**: The dashboard is only accessible to authenticated users, enforced via the `PrivateRoute` component. If a user is not authenticated, they are redirected to the login page.
- **Layout Integration**: The dashboard is always rendered inside `AppLayout`, ensuring consistent navigation (Sidebar, Header, Footer) and theming across the app.

#### Header
- **Location**: `src/components/layout/Header.tsx`
- **Purpose**: Top navigation bar with user menu and app title.
- **Features**:
  - Displays current user information
  - Dropdown menu for user actions (profile, settings, logout)
  - Responsive design that works on all screen sizes
  - **Mobile:** Shows a hamburger menu button to open the sidebar Drawer.

#### Sidebar
- **Location**: `src/components/layout/Sidebar.tsx`
- **Purpose**: Main navigation menu for the application.
- **Features**:
  - Collapsible menu items
  - Icons for better visual hierarchy
  - Active route highlighting
  - Responsive behavior
  - **Mobile:** Renders inside an Ant Design Drawer, toggled by Header menu button. Closes on menu selection or overlay click.
  - **Desktop:** Renders as a fixed Sider with 200px width.

#### Header
- **Location**: `src/components/layout/Header.tsx`
- **Purpose**: Top navigation bar with user menu and app title.
- **Features**:
  - Displays current user information
  - Dropdown menu for user actions (profile, settings, logout)
  - Responsive design that works on all screen sizes

#### Sidebar
- **Location**: `src/components/layout/Sidebar.tsx`
- **Purpose**: Main navigation menu for the application.
- **Features**:
  - Collapsible menu items
  - Icons for better visual hierarchy
  - Active route highlighting
  - Responsive behavior

#### Footer
- **Location**: `src/components/layout/Footer.tsx`
- **Purpose**: Application footer with copyright information.
- **Features**:
  - Simple, clean design
  - Copyright notice with dynamic year
  - Can be extended with additional links or information


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
