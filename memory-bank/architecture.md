# Architecture Insights

## Project Structure (after Docker Integration)

```
task-manager/
├── .gitignore                  # Ignores build, IDE, and system files
├── pom.xml                     # Maven build file with all dependencies
├── Dockerfile                  # Containerizes the Spring Boot app
├── docker-compose.yml          # Orchestrates app + PostgreSQL containers
└── src/
    └── main/
        └── java/
            └── com/
                └── example/
                    └── taskmanager/
                        └── TaskManagerApplication.java  # Main Spring Boot application entry point
        └── resources/
            └── application.properties  # Uses env vars for Docker/local compatibility
```

### File/Folder Purpose
- **Dockerfile**: Multi-stage build for the Spring Boot app. Produces a runnable container image.
- **docker-compose.yml**: Defines and runs both the app and a PostgreSQL DB as containers, with healthchecks and environment variables for seamless integration.
- **application.properties**: Now supports environment variables for DB config, making the app portable between local and Docker environments.

**The backend can now be run locally or fully containerized with Docker Compose.**

### Entities Folder and Entity Class Overview
- **entities/**: Contains all JPA entity classes for the core business domain. Organizing entities here improves code maintainability and separation of concerns.
  - **User.java**: Represents application users. Contains authentication fields and relationships to roles and projects.
  - **Role.java**: Represents user roles (e.g., ADMIN, USER). Supports flexible authorization via many-to-many mapping with users.
  - **Project.java**: Represents a project owned by a user. Contains project details and a collection of associated tasks.
  - **Task.java**: Represents a task within a project. Contains task details and status, and links back to its parent project.

Each entity is annotated with JPA annotations for persistence and Lombok annotations for concise code. Relationships are mapped to support user authentication, authorization, project management, and task tracking.

### Repository Folder and Repository Interface Overview
- **repository/**: Contains all Spring Data JPA repository interfaces for accessing the database. Centralizing repositories here improves maintainability and enforces a clear separation between domain models and data access logic.
  - **UserRepository.java**: Provides CRUD operations for User entities and includes a method to find a user by username, supporting authentication workflows.
  - **RoleRepository.java**: Provides CRUD operations for Role entities.
  - **ProjectRepository.java**: Provides CRUD operations for Project entities.
  - **TaskRepository.java**: Provides CRUD operations for Task entities.

Each repository extends `JpaRepository`, leveraging Spring Data features for concise, type-safe database access. Custom query methods can be added as needed for advanced queries.


### DTO Package and Mapping Utility
- **dto/**: Contains Data Transfer Object classes for API request/response payloads, ensuring entities are not exposed directly and sensitive/internal fields are never leaked.
  - **UserDTO.java**: Represents a user for API communication. Includes only id, username, and roles.
  - **ProjectDTO.java**: Represents a project for API communication. Includes id, name, description, ownerId, and a set of associated TaskDTOs.
  - **TaskDTO.java**: Represents a task for API communication. Includes id, title, description, status, and projectId.
  - **EntityToDTOMapper.java**: Utility class for converting entities to DTOs, handling nested and collection mappings. Keeps mapping logic centralized and testable.

**Rationale**: Using DTOs decouples the internal data model from the API, making the application more secure and flexible for future changes. The mapping utility can be refactored to use a library like MapStruct if mapping logic becomes complex.


### Service Layer
- **service/**: Contains service classes that encapsulate business logic and act as the intermediary between controllers and repositories. This layer ensures that controllers remain thin and all business rules and transactional logic are centralized.
  - **UserService.java**: Provides CRUD operations and business logic for user management, delegating persistence to `UserRepository`.
  - **ProjectService.java**: Handles CRUD and business logic for projects, using `ProjectRepository`.
  - **TaskService.java**: Manages CRUD and business logic for tasks, interacting with `TaskRepository`.

**Rationale**: The service layer enforces separation of concerns, making the codebase easier to maintain and extend. All business rules should reside here, not in controllers or repositories. This approach also simplifies unit testing, as services can be tested in isolation with mocked repositories.


### Security Configuration
- **SecurityConfig.java**: Configures Spring Security for the application. Defines the security filter chain, sets up stateless (JWT-ready) session management, and configures endpoint access rules:
  - Allows all requests to `/api/auth/**` (for registration and login).
  - Requires authentication for `/api/v1/projects` and `/api/v1/projects/**`.
  - Uses `requestMatchers` for endpoint rules (Spring Security 6.x+ compatible).
  - Role-based restrictions for POST/PUT/DELETE on project endpoints are enforced using method-level annotations (e.g., `@PreAuthorize("hasRole('ADMIN')")`) in the controllers, not in the filter chain.
  - Registers the `JwtAuthenticationFilter` to enable JWT-based stateless authentication for protected endpoints.

#### JWT Authentication Filter & Utility
- **JwtAuthenticationFilter.java**: A custom filter that intercepts each HTTP request before it reaches protected endpoints. It:
  - Extracts the JWT from the `Authorization` header (if present).
  - Uses `JwtUtil` to validate the token and extract the username.
  - Loads the user from the database and, if valid, sets the authentication in the Spring Security context for the duration of the request.
  - Ensures stateless authentication, so no session is created or maintained on the server.
- **JwtUtil.java**: Utility for generating, parsing, and validating JWTs. Handles secret key management and token expiration logic. Used by both the authentication endpoints and the filter.

**How it works in the request lifecycle:**
- For each incoming request:
  - If the endpoint is public (e.g., `/api/auth/**`), the filter does nothing.
  - If the endpoint is protected and a valid JWT is present, the filter authenticates the user and sets the security context.
  - If no valid JWT is present, the request proceeds unauthenticated, and access is denied by endpoint rules.

**Rationale:**
- This approach enables scalable, stateless authentication suitable for microservices and modern web/mobile clients. It also decouples authentication logic from controllers and services, centralizing it in the filter and utility for maintainability.

### Controller Layer
- **controller/**: Contains REST controller classes that expose the application's API endpoints, handling HTTP requests and responses. Controllers delegate all business logic to the service layer and use DTOs for API payloads to ensure entities are never exposed directly.
  - **UserController.java**: Handles `/api/v1/users` endpoints for user CRUD operations. Delegates business logic to `UserService` and uses `EntityToDTOMapper` for response mapping.
  - **ProjectController.java**: Manages `/api/v1/projects` endpoints for project CRUD operations. Uses `ProjectService` for business logic and maps entities to DTOs for API responses.
  - **TaskController.java**: Provides `/api/v1/tasks` endpoints for task CRUD operations. Relies on `TaskService` and DTO mapping for clean API boundaries.
  - **AuthController.java**: Exposes `/api/auth/register` and `/api/auth/login` endpoints for user registration and authentication.
    - `/api/auth/register`: Accepts a JSON body with `username` and `password`, creates a new user via `UserService`, and returns a DTO without the password.
    - `/api/auth/login`: Accepts a JSON body with `username` and `password`, authenticates credentials using `AuthenticationManager`, and returns a JWT on success (generated via `JwtUtil`). The JWT is used for subsequent requests to protected endpoints.

**How AuthController interacts with other layers:**
- Delegates user creation and retrieval to `UserService`.
- Delegates authentication logic to `AuthenticationManager` and token generation to `JwtUtil`.

  - **JwtUtil.java**: Utility for generating, parsing, and validating JWTs. Handles secret key management and token expiration logic. Used by both the authentication endpoints and the filter. Generates tokens in `/api/auth/login` and validates tokens in security filters.

- Uses `JwtUtil` to generate and validate JWTs for authentication.
- Leverages Spring Security's `AuthenticationManager` to authenticate login requests.
- Ensures that sensitive fields (like passwords) are never exposed in API responses by using DTOs and mapping utilities.

**Rationale**: Controllers should remain thin, focusing only on HTTP request/response handling and delegating all business logic to the service layer. Using DTOs in controllers prevents leaking sensitive or internal fields and ensures a stable API contract. As the application grows, new endpoints and controllers can be added here to extend API functionality while keeping logic separated and maintainable.

**Status as of 2025-08-12**: All controller classes, including authentication endpoints, have been validated and tested for correct registration and login flows. The codebase is ready for further integration and feature expansion.
