# Start from an OpenJDK 21 image
FROM eclipse-temurin:21-jdk-alpine as builder

# Set working directory
WORKDIR /app

# Copy Maven wrapper and pom.xml
COPY mvnw* pom.xml .
COPY .mvn .mvn

# Copy source code
COPY src src

# Package the application (skip tests for build speed)
RUN ./mvnw clean package -DskipTests

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
