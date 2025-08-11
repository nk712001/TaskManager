# Progress Log

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
