# ── Stage 1: Build the Java backend ──────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY backend/pom.xml ./pom.xml
# Download dependencies first (layer cache)
RUN mvn dependency:go-offline -B
COPY backend/src ./src
RUN mvn package -DskipTests -B

# ── Stage 2: Runtime image (slim JRE) ────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the packaged fat-jar from builder stage
COPY --from=builder /app/target/moodwave-backend-*.jar app.jar

# Expose the port Tomcat listens on
EXPOSE 5000

# Environment variables (override via Render dashboard)
ENV PORT=5000
ENV DB_USER=postgres
ENV DB_PASSWORD=changeme
ENV DB_HOST=db.your-project.supabase.co
ENV DB_PORT=5432
ENV DB_NAME=postgres

# Run the server
ENTRYPOINT ["java", "-jar", "app.jar"]
