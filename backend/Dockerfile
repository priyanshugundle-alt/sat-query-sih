# Build Stage: Java 21 Maven build
FROM maven:3.9.6-eclipse-temurin-21 AS builder
WORKDIR /app

# Copy pom.xml and source code
COPY pom.xml ./
COPY src ./src

# Build the executable JAR
RUN mvn clean package -DskipTests

# Runtime Stage: JRE 21 container (Debian glibc)
FROM eclipse-temurin:21-jre
WORKDIR /app

# Copy Fat JAR from builder
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENV PORT=8080

# Run Java backend
CMD ["java", "-jar", "app.jar"]

