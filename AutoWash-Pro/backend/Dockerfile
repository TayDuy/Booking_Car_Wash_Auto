FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY app.jar app.jar
EXPOSE 8080
HEALTHCHECK --interval=15s --timeout=3s --start-period=30s --retries=2 \
  CMD wget -qO- http://localhost:8080/actuator/health > /dev/null 2>&1 || exit 1
USER appuser
ENTRYPOINT ["java", "-jar", "app.jar"]