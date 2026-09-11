# SatQuery AI — Geospatial Workstation

SatQuery AI is a lightweight, high-performance Core Java and OOP-centered software workstation that translates natural-language queries about satellite imagery into validated, routed, and evidence-backed spatial analysis.

The system utilizes a clean adapter layer to communicate with external AI/VLM models, ensuring that application logic remains fully testable, observable, and modular.

---

## 🛠️ Minimal Tech Stack

To ensure judge-facing auditability and clean execution, the application uses **no Spring Boot** and maps exactly **three external Maven dependencies**:

1. **Java HttpServer** (Built-in standard library) - Serves the REST API and web workstation client.
2. **Java HttpClient** (Built-in standard library) - Relays questions to adapted visual models.
3. **Jackson Databind** (Maven) - Serializes and parses JSON communication contracts.
4. **Xerial SQLite JDBC** (Maven) - Manages operational query histories, traces, and evidence.
5. **JUnit 5** (Maven) - Drives the automated unit and integration tests.

---

## 🚀 Execution & Setup Guide

Ensure that you have **Java 21** installed on your system.

### 1. Compile & Build the Backend
Navigate to the `backend` folder and run the Maven wrapper:
```powershell
cd backend
.\mvnw.cmd clean compile
```

### 2. Run Automated Test Suites
Execute the JUnit test cases verifying routing logic, metadata validation, tool parameter limits, and database operations:
```powershell
.\mvnw.cmd test
```

### 3. Launch the Server
Start the local HTTP server:
```powershell
.\mvnw.cmd exec:java
```
The console will indicate:
```text
SatQuery Java Backend starting on port 8080...
SatQuery Java Backend is online.
```

### 4. Access the Workstation Interface
Open your browser and navigate to:
```text
http://localhost:8080/
```

---

## 🗃️ Database Initialization & Schema
Operational histories are saved automatically to a local SQLite database file `satquery.db` in the `backend` directory.
- The schema layout is configured in `database/schema.sql`.
- Pre-populated test telemetry can be loaded at startup using `database/seed.sql`.
- Direct queries can be verified using the SQL definitions in `database/queries.sql`.
