# Stage 1: Build (Builder Stage)
FROM maven:3.9.9-eclipse-temurin-24 AS builder
WORKDIR /app

# Copy pom.xml trước để cache dependencies
COPY pom.xml .

# Dùng BuildKit cache mount để giữ .m2 giữa các lần build (tránh tải lại dependencies)
RUN --mount=type=cache,target=/root/.m2 \
    mvn dependency:go-offline -B

# Copy source & build
COPY src ./src
RUN --mount=type=cache,target=/root/.m2 \
    mvn clean package -DskipTests

# Stage 2: Run (Production Stage)
FROM eclipse-temurin:24-jre-alpine
WORKDIR /app

# Tạo non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy JAR từ builder stage (dùng tên cố định tránh wildcard mismatch)
COPY --from=builder /app/target/demo-loginn-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080

# Healthcheck — Spring boot actuator
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=2 \
  CMD wget -qO- http://localhost:8080/actuator/health > /dev/null 2>&1 || exit 1

# Chạy với non-root user
USER appuser

ENTRYPOINT ["java", "-jar", "app.jar"]
