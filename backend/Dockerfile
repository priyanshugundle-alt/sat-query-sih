# Build Stage: Java 21 Maven build
FROM maven:3.9.6-eclipse-temurin-21-alpine AS builder
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml ./
COPY src ./src
COPY database ./database

# Build the executable JAR
RUN mvn clean package -DskipTests

# Runtime Stage: Lightweight JRE 21 container
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy JAR and database schema
COPY --from=builder /app/target/*.jar app.jar
COPY --from=builder /app/database ./database

EXPOSE 8080
ENV PORT=8080

# Run Java backend
CMD ["java", "-jar", "app.jar"]
