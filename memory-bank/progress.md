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

### Notes for future developers
- PostgreSQL is the chosen database; update `application.properties` accordingly in later steps.
- All dependencies are managed via Maven. Use `mvn clean install` to verify builds.
- Lombok is used to reduce boilerplate—ensure your IDE has Lombok plugin enabled.
- Swagger UI will be available after API endpoints are implemented.
