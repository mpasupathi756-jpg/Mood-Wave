# ── Stage 1: Build Java backend ──────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21 AS builder
WORKDIR /app
COPY pom.xml ./pom.xml
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn package -DskipTests -B

# ── Stage 2: Runtime image ──────────────────────────────────────────────
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=builder /app/target/moodwave-backend-*.jar app.jar

EXPOSE 5000
ENV PORT=5000

ENTRYPOINT ["java", "-jar", "app.jar"]

