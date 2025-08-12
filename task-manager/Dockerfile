# Start from an OpenJDK 21 image with Maven installed
FROM maven:3.9.6-eclipse-temurin-21-alpine as builder

# Set working directory
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml .
COPY src ./src

# Package the application (skip tests for build speed)
RUN mvn clean package -DskipTests -e -X

# ---
# Run stage
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /app

# Copy the built jar from the builder stage
COPY --from=builder /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Run the Spring Boot app
ENTRYPOINT ["java","-jar","app.jar"]
