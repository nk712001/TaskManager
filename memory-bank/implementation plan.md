# Implementation Plan: Task Manager Backend APIs (Spring Boot, Dockerized)

## 1. Project Initialization
**Step 1.1:** Initialize a new Spring Boot 3.x project with Java 17+ using Spring Initializr or your preferred method.
- **Test:** Verify the project builds and runs a basic Spring Boot application (e.g., "Hello World" on startup).

**Step 1.2:** Add required dependencies to your build file:
- spring-boot-starter-web
- spring-boot-starter-data-jpa
- spring-boot-starter-security
- postgresql (or your chosen DB driver)
- jjwt-api, jjwt-impl, jjwt-jackson
- lombok (optional)
- **Test:** Run `mvn clean install` and ensure all dependencies are resolved with no errors.

## 1a. Docker Setup
**Step 1a.1:** Create a `Dockerfile` to containerize the Spring Boot application.
- **Test:** Build the Docker image using `docker build .` and verify the image is created.

**Step 1a.2:** Create a `docker-compose.yml` to orchestrate the Spring Boot app and a PostgreSQL database.
- **Test:** Run `docker-compose up` and verify both containers start and the app connects to the DB.

## 2. Database & Application Configuration
**Step 2.1:** Configure `application.properties` (or `application.yml`) for DB connection, JPA, and JWT settings. Use environment variables in your configuration to allow Docker Compose to inject DB credentials and connection info (e.g., `spring.datasource.url=jdbc:postgresql://${DB_HOST:db}:${DB_PORT:5432}/${DB_NAME:task_manager_db}` etc.).
- **Test:** Start the app (locally or via Docker Compose) and confirm it connects to the database without errors.

**Step 2.2:** Set up the database schema (manually or using JPA auto-ddl).
- **Test:** Check that the required tables are created in the database after starting the app (in Docker Compose environment).

## 3. Entity & Repository Layer
**Step 3.1:** Create JPA entities: User, Role, Project, Task, with specified fields and relationships.
- **Test:** Use a JPA test or application runner to persist and retrieve a sample entity of each type.

**Step 3.2:** Create Spring Data JPA repositories for each entity.
- **Test:** Write a simple repository test for each to save and fetch an entity from the database.

## 4. DTOs & Mapping
**Step 4.1:** Define DTO classes for User, Project, Task (do not expose entities directly).
- **Test:** Write a unit test to map an entity to its DTO and verify field values.

## 5. Service Layer
**Step 5.1:** Implement service classes for User, Project, and Task with core CRUD logic.
- **Test:** Write a service-layer test for each CRUD operation, mocking repositories as needed.

## 6. Controller Layer
**Step 6.1:** Implement REST controllers for authentication, projects, and tasks, following RESTful conventions.
- **Test:** Use Postman or integration tests to verify each endpoint returns the expected HTTP response for valid and invalid requests.

## 7. Security Setup
**Step 7.1:** Configure Spring Security with JWT:
- Permit all to `/api/auth/**`
- Require authentication for `/api/v1/projects`
- Restrict POST/PUT/DELETE on `/api/v1/projects/**` to ADMIN role
- **Test:** Attempt requests to protected and unprotected endpoints with/without JWT and with different roles; verify access is correctly controlled.

**Step 7.2:** Implement JWT authentication filter and security context population.
- **Test:** Authenticate a user, obtain a JWT, and use it to access a protected endpoint.

## 8. Authentication Endpoints
**Step 8.1:** Implement `/api/auth/register` to register a new user.
- **Test:** Register a user and verify the user is created in the database.

**Step 8.2:** Implement `/api/auth/login` to authenticate a user and return a JWT.
- **Test:** Login with valid credentials and verify a JWT is returned; login with invalid credentials and verify an error is returned.

## 9. Project Endpoints
**Step 9.1:** Implement:
- `GET /api/v1/projects` (all authenticated users)
- `POST /api/v1/projects` (ADMIN only)
- `GET /api/v1/projects/{projectId}` (authenticated users)
- **Test:** Use integration tests or Postman to verify each endpoint’s access control and correct data retrieval/creation.

## 10. Task Endpoints
**Step 10.1:** Implement:
- `GET /api/v1/projects/{projectId}/tasks`
- `POST /api/v1/projects/{projectId}/tasks`
- `GET /api/v1/tasks/{taskId}`
- `PUT /api/v1/tasks/{taskId}`
- `DELETE /api/v1/tasks/{taskId}`
- **Test:** For each endpoint, validate correct data is returned/modified, and access control is enforced.

## 11. Exception Handling
**Step 11.1:** Implement global exception handling using `@ControllerAdvice` for consistent error responses.
- **Test:** Trigger known errors (e.g., resource not found, validation errors) and verify error responses are consistent and informative.

## 12. Documentation
**Step 12.1:** Document all endpoints, request/response formats, and authentication flow (use Swagger/OpenAPI if desired).

## 13. Docker & Deployment
**Step 13.1:** Document how to build and run the project using Docker and Docker Compose, including environment variable setup for DB credentials.
- **Test:** Follow the documentation to spin up the stack from scratch using Docker Compose and verify all services are healthy and the API is accessible.

- **Test:** Access the documentation and verify all endpoints and models are described.
