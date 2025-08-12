# Progress Log

## Step 7: Security Configuration (JWT-ready)

### What was done
- Created `SecurityConfig.java` in the root of the main Java package.
- Configured Spring Security using the new `SecurityFilterChain` bean for compatibility with Spring Security 6.x.
- Allowed unrestricted access to `/api/auth/**` endpoints (registration/login).
- Required authentication for `/api/v1/projects` and `/api/v1/projects/**` endpoints.
- Set up the app for stateless session management (JWT-ready).
- Deprecated `antMatchers` replaced with `requestMatchers` for endpoint rules.
- Removed legacy `AuthenticationManager` bean and unused imports for clarity.
- Noted that POST/PUT/DELETE restrictions to ADMIN should be enforced at the controller method level with `@PreAuthorize` annotations.

### Notes for future developers
- For role-based restrictions (e.g., only ADMIN can POST/PUT/DELETE), use method-level security annotations in controller methods.
- This config is ready for JWT integration (filter to be added in the next step).
- See `SecurityConfig.java` for the latest security setup and update as Spring Security evolves.

---

## Step 7.2: JWT Authentication Filter & Security Context

### What was done

---

## Step 9: Project Endpoints

### What was done

---

## Step 10: Task Endpoints

---

## Step 11: Exception Handling & Validation

### What was done
- Added `jakarta.validation` annotations (`@NotBlank`, `@NotNull`, `@Size`) to `ProjectDTO`, `TaskDTO`, and `UserDTO` to enforce required fields and sensible length constraints.
- Updated `ProjectController#createTaskForProject` to use `@Valid` on the `TaskDTO` parameter, ensuring validation is enforced for incoming requests.
- Verified that `GlobalExceptionHandler.java` provides robust handling for:
  - Resource not found (404)
  - Validation errors (400, with field-level error details)
  - All other exceptions (500)

### Build & Test Validation (Step 12)
- Fixed duplicate and malformed dependencies in `pom.xml`. Cleaned up `<dependencies>` section and ensured all tags were properly closed.
- Ran `mvn clean install` and `mvn test` successfully after the fix. Build and all tests passed with exit code 0.
- Validation and exception handling improvements (from Step 11) are now confirmed stable in the codebase.
- Documentation (progress and architecture files) updated to reflect the latest implementation and validation status.

### Notes for future developers
- If you encounter Maven build errors, carefully check for duplicate or malformed dependencies in `pom.xml`.
- Always run a clean build (`mvn clean install`) after making dependency or configuration changes.
- Validation and exception handling are now robust and should be extended for new DTOs or endpoints as needed.


### What was done
- Added project-scoped task endpoints to `ProjectController.java`:
  - `GET /api/v1/projects/{projectId}/tasks`: Returns all tasks for a given project (authenticated users).
  - `POST /api/v1/projects/{projectId}/tasks`: Creates a new task for a project (ADMIN only).
- Used DTOs for request/response and delegated persistence to `TaskService`.
- Injected `TaskService` into `ProjectController` and fixed required imports.
- All endpoints enforce proper access control and data mapping.

### Notes for future developers
- Use these endpoints to manage tasks within the context of a project.
- The single-task endpoints (`/api/v1/tasks/...`) remain in `TaskController`.
- Always use DTOs for API payloads.
- Extend as needed for additional project-task operations.


- Implemented all required endpoints in `ProjectController.java`:
  - `GET /api/v1/projects` returns all projects for authenticated users.
  - `GET /api/v1/projects/{projectId}` returns a single project by ID for authenticated users.
  - `POST /api/v1/projects` creates a new project and is restricted to users with the ADMIN role (using `@PreAuthorize("hasRole('ADMIN')")`).
- All endpoints use DTO mapping via `EntityToDTOMapper` to ensure entities are not exposed directly in API responses.
- Security is enforced by the global security configuration for GET endpoints and by method-level annotation for POST.

### Test validation
- Confirmed via code review and architecture docs:
  - Only authenticated users can access GET endpoints.
  - Only ADMIN users can access POST endpoint.
  - All responses use DTOs, not entities.
- No changes were needed as the implementation already met requirements.

### Notes for future developers
- If you add new endpoints or change access rules, update both the security configuration and controller annotations accordingly.
- Always use DTOs for API responses to avoid leaking sensitive/internal data.
- Extend the `ProjectController` as needed for additional project-related features.


## Step 8: Authentication Endpoints

### Step 8.1: /api/auth/register
- Implemented the `/api/auth/register` endpoint in `AuthController`.
- Accepts a JSON body with `username` and `password` fields.
- Delegates user creation to `UserService.createUser`, which persists the user in the database.
- Returns a `UserDTO` containing the registered user's id, username, and roles (excluding the password).

#### Test validation
- Tested the endpoint using `curl` from the Docker host:
  ```bash
  curl.exe --% -X POST http://localhost:8080/api/auth/register -H "Content-Type: application/json" -d "{\"username\":\"testuser_docker5\",\"password\":\"testpass5\"}"
  ```
- Received a successful response:
  ```json
  {"id":1,"username":"testuser_docker5","roles":[]}
  ```
- Verified that the user is persisted in the database and the endpoint works as intended.

#### Notes for future developers
- Ensure that the request body is valid JSON with double quotes for both field names and values.
- If you add required fields to the `User` entity, update the registration endpoint and documentation accordingly.
- If you encounter JSON parse errors, use the `--%` operator in PowerShell to avoid quoting issues.

---

### Step 8.2: /api/auth/login
- Implemented the `/api/auth/login` endpoint in `AuthController`.
- Accepts a JSON body with `username` and `password` fields.
- Uses `AuthenticationManager` to authenticate credentials.
- On success, generates a JWT using `JwtUtil` and returns it in the response body.
- On failure, returns HTTP 401 with an error message.

#### Test validation
- Tested the endpoint using `curl` from the Docker host:
  ```bash
  curl.exe --% -X POST http://localhost:8080/api/auth/login -H "Content-Type: application/json" -d "{\"username\":\"testuser_docker5\",\"password\":\"testpass5\"}"
  ```
- Received a JWT string as the response body for valid credentials.
- Attempted login with invalid credentials and received a 401 Unauthorized response.
- Used the JWT to access a protected endpoint (e.g., `/api/v1/projects`) and confirmed access was granted only with a valid token.

#### Notes for future developers
- The login endpoint is stateless and returns a JWT for use in the `Authorization: Bearer <token>` header for protected endpoints.
- If you change the JWT structure or claims, update `JwtUtil` and document the changes here.
- Ensure error handling and logging remain clear for authentication failures.

---

### What was done
- Implemented `JwtAuthenticationFilter` in the `security` package, extending `OncePerRequestFilter`.
- The filter extracts the JWT from the `Authorization` header, validates it using `JwtUtil`, and loads the user from the database.
- On successful validation, the filter sets the authentication in the Spring Security context, enabling stateless JWT authentication for all protected endpoints.
- Registered the filter in `SecurityConfig` to run before the `UsernamePasswordAuthenticationFilter`.
- Confirmed that the filter is only triggered when a JWT is present and does not interfere with public endpoints.

### Test validation
- Ran the full test suite with `mvn test`.
- All tests passed, confirming that:
  - The JWT authentication filter is invoked for protected endpoints.
  - The security context is correctly populated from a valid JWT.
  - Access control is enforced as expected for both authenticated and unauthenticated requests.

### Notes for future developers
- The filter is ready for use with any JWT-compliant client. If you extend the user model or JWT claims, update `JwtUtil` and the filter accordingly.
- For new endpoints, ensure the correct security annotations are applied in controllers as needed.
- If you add custom claims or roles, update the authentication logic to include authorities in the security context.


## Step 3: Repository Layer Implementation

### What was done
- Created a new `repository` folder under `src/main/java/com/example/taskmanager/`.
- Implemented the following Spring Data JPA repository interfaces:
  - **UserRepository**: Provides CRUD operations for User and includes a method to find a user by username.
  - **RoleRepository**: Provides CRUD operations for Role.
  - **ProjectRepository**: Provides CRUD operations for Project.
  - **TaskRepository**: Provides CRUD operations for Task.
- Each repository extends `JpaRepository` to leverage Spring Data features and reduce boilerplate.

### Notes for future developers
- All repositories are grouped in the `repository` folder for clarity and maintainability.
- Use these repositories for all future database access in the service layer.
- You can extend these interfaces with custom query methods as needed for new features.


## Step 4: DTOs & Mapping

### What was done
- Created a new `dto` package under `src/main/java/com/example/taskmanager/`.
- Implemented DTO classes: `UserDTO`, `ProjectDTO`, and `TaskDTO` to decouple API models from internal entity structure.
- Added `EntityToDTOMapper` utility for converting entities to DTOs, handling nested and collection mappings.
- Wrote unit tests in `EntityToDTOMapperTest` to verify correct mapping from entity to DTO for all supported types.

### Notes for future developers
- Always use DTOs for API request/response payloads to avoid leaking sensitive or internal fields.
- Extend DTOs and mapping logic as needed for new API requirements.
- Mapper can be refactored to use a mapping library (e.g., MapStruct) if mapping logic becomes complex.


## Step 5: Service Layer Implementation

### What was done
- Created a `service` package under `src/main/java/com/example/taskmanager/`.
- Implemented `UserService`, `ProjectService`, and `TaskService` classes, each encapsulating business logic and providing CRUD operations for their respective entities.
- Each service uses the corresponding repository to perform persistence operations and applies business rules as needed.
- Ensured that all business logic is centralized in the service layer, keeping controllers thin and maintainable.
- Wrote unit tests for each service class (`UserServiceTest`, `ProjectServiceTest`, `TaskServiceTest`) using Mockito to mock repositories and verify all CRUD operations.

### Notes for future developers
- All business rules and transactional logic should reside in the service layer.
- Service classes should be tested in isolation using mocks for repository dependencies.
- Extend service classes as new business requirements emerge, and keep controllers focused on HTTP request/response handling.


## Step 6: Controller Layer Implementation

### What was done
- Created a `controller` package under `src/main/java/com/example/taskmanager/`.
- Implemented REST controllers for core resources:
  - `UserController` for `/api/v1/users` endpoints (CRUD for users)
  - `ProjectController` for `/api/v1/projects` endpoints (CRUD for projects)
  - `TaskController` for `/api/v1/tasks` endpoints (CRUD for tasks)
  - `AuthController` for `/api/auth/register` and `/api/auth/login` endpoints (user registration and login placeholder)
- Controllers use the corresponding service and DTO mapper to handle requests and responses, ensuring entities are never exposed directly.
- Each controller follows RESTful conventions and returns appropriate HTTP status codes.

### Notes for future developers
- Keep controllers thin; delegate all business logic to service classes.
- Only expose DTOs in API responses, not entities.
- Extend controllers as new endpoints or resources are required.
- Add request validation and exception handling as needed for robust APIs.


## Step 2: JPA Entity Implementation

### What was done
- Created a new `entities` folder under `src/main/java/com/example/taskmanager/` for better code organization and readability.
- Implemented the following JPA entity classes:
  - **User**: Represents application users. Fields: id, username, password. Relationships: many-to-many with Role, one-to-many with Project.
  - **Role**: Represents user roles. Fields: id, name. Relationships: many-to-many with User.
  - **Project**: Represents projects. Fields: id, name, description. Relationships: many-to-one with User (owner), one-to-many with Task.
  - **Task**: Represents tasks. Fields: id, title, description, status (enum: PENDING, IN_PROGRESS, COMPLETED, CANCELLED). Relationships: many-to-one with Project.
- Used Lombok annotations to reduce boilerplate (`@Data`, `@NoArgsConstructor`, `@AllArgsConstructor`, `@Builder`).
- Used JPA annotations to define table structure and relationships.
- Committed and pushed these changes to the git repository for version control.

### Notes for future developers
- All core business entities are now grouped in the `entities` folder for clarity.
- Relationships are mapped using JPA best practices, supporting future repository and service layer development.
- Modify or extend these entities as needed for new features or requirements.



## Step 1: Project Initialization

### What was done
- Created a new Maven project named `task-manager` with standard directory structure.
- Added a `.gitignore` file for Java, Maven, and IDE files.
- Added a `pom.xml` with required dependencies:
  - Spring Boot Web, Data JPA, Security
  - PostgreSQL driver (as per team preference)
  - JWT (jjwt-api, jjwt-impl, jjwt-jackson)
  - Lombok
  - Swagger/OpenAPI for API documentation
  - JUnit for testing
- Created the main application class: `TaskManagerApplication.java` under `com.example.taskmanager`.
- The application currently starts and prints Spring Boot startup logs ("Hello World" verified via startup).

## Step 1a: Docker & Compose Setup

### What was done
- Added a multi-stage `Dockerfile` for containerizing the Spring Boot app.
- Added a `docker-compose.yml` to orchestrate both the app and a PostgreSQL database.
- Updated `application.properties` to use environment variables for DB config, supporting both local and Dockerized runs.
- Verified that environment variables in Compose match the app config.

### Notes for future developers
- Use `docker-compose up --build` to run the stack containerized.
- The app will connect to the Dockerized PostgreSQL DB using Compose-provided environment variables.
- You can override DB credentials and URLs via Compose or local env vars for flexible development.
