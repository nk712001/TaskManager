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
