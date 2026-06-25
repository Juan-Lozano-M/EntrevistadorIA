# ---- Build stage ----
FROM eclipse-temurin:21-jdk AS build
WORKDIR /app

# Maven wrapper + pom first so dependencies cache between builds.
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN chmod +x mvnw && ./mvnw -B dependency:go-offline -DskipTests

# App sources, then build the executable jar (tests skipped — run them in CI).
COPY src ./src
RUN ./mvnw -B clean package -DskipTests

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre
WORKDIR /app

# Run as an unprivileged user.
RUN useradd -r -u 1001 spring
USER spring

# Spring Boot fat jar (artifactId interviewai-backend → target/*.jar, excludes *.jar.original).
COPY --from=build /app/target/*.jar app.jar

# Render injects PORT; fall back to 8080 for local `docker run`.
EXPOSE 8080
ENTRYPOINT ["sh","-c","java ${JAVA_OPTS} -jar app.jar --server.port=${PORT:-8080}"]
