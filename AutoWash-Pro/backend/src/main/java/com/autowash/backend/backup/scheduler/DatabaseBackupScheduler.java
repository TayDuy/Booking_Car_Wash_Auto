package com.autowash.backend.backup.scheduler;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.FileWriter;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

/**
 * BR-36: Automated Daily Database Backup Scheduler.
 * Runs at 02:00 AM daily.
 * Attempts native pg_dump export first, and falls back to Java JSON Table Exporter if pg_dump is unavailable.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseBackupScheduler {

    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Value("${spring.datasource.url:jdbc:postgresql://localhost:5432/autowash_db}")
    private String dbUrl;

    @Value("${spring.datasource.username:postgres}")
    private String dbUser;

    @Value("${spring.datasource.password:123456}")
    private String dbPassword;

    /**
     * Runs at 02:00 AM every day
     */
    @Scheduled(cron = "0 0 2 * * ?")
    public void performDailyBackup() {
        log.info("Starting automated daily database backup (BR-36)...");
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        Path backupDir = Paths.get("backups", "db");

        try {
            if (!Files.exists(backupDir)) {
                Files.createDirectories(backupDir);
            }

            boolean nativeSuccess = tryPgDump(backupDir, timestamp);
            if (!nativeSuccess) {
                log.info("pg_dump not available or failed. Falling back to Java JSON Exporter...");
                performJavaJsonFallbackBackup(backupDir, timestamp);
            }

            cleanOldBackups(backupDir, 30);
            log.info("Daily database backup completed successfully.");
        } catch (Exception e) {
            log.error("Failed to perform daily database backup: {}", e.getMessage(), e);
        }
    }

    private boolean tryPgDump(Path backupDir, String timestamp) {
        try {
            File outputFile = backupDir.resolve("autowash_backup_" + timestamp + ".sql").toFile();

            ProcessBuilder pb = new ProcessBuilder(
                    "pg_dump",
                    "-U", dbUser,
                    "-f", outputFile.getAbsolutePath(),
                    "autowash_db"
            );
            pb.environment().put("PGPASSWORD", dbPassword);
            pb.redirectErrorStream(true);

            Process process = pb.start();
            int exitCode = process.waitFor();
            if (exitCode == 0 && outputFile.exists() && outputFile.length() > 0) {
                log.info("Native pg_dump backup created: {}", outputFile.getAbsolutePath());
                return true;
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.warn("pg_dump interrupted: {}", e.getMessage());
        } catch (Exception e) {
            log.warn("pg_dump execution failed: {}", e.getMessage());
        }
        return false;
    }

    private void performJavaJsonFallbackBackup(Path backupDir, String timestamp) {
        try {
            File jsonFile = backupDir.resolve("autowash_backup_" + timestamp + ".json").toFile();
            List<String> tables = List.of(
                    "customer", "booking", "booking_detail", "payment",
                    "vehicle", "wash_bay", "time_slot", "loyalty_tier",
                    "loyalty_transaction", "customer_reward", "promotion"
            );

            Map<String, Object> backupData = new java.util.HashMap<>();
            backupData.put("timestamp", timestamp);

            for (String table : tables) {
                try {
                    List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM " + table);
                    backupData.put(table, rows);
                } catch (Exception te) {
                    log.warn("Could not export table {}: {}", table, te.getMessage());
                }
            }

            try (FileWriter writer = new FileWriter(jsonFile)) {
                objectMapper.writerWithDefaultPrettyPrinter().writeValue(writer, backupData);
            }
            log.info("Java JSON fallback database backup created: {}", jsonFile.getAbsolutePath());
        } catch (Exception e) {
            log.error("Java JSON fallback database backup failed: {}", e.getMessage(), e);
        }
    }

    private void cleanOldBackups(Path backupDir, int retentionDays) {
        try {
            LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
            File[] files = backupDir.toFile().listFiles();
            if (files != null) {
                for (File file : files) {
                    if (file.isFile() && file.lastModified() < cutoff.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()) {
                        boolean deleted = file.delete();
                        if (deleted) {
                            log.info("Cleaned up old backup file: {}", file.getName());
                        } else {
                            log.warn("Failed to delete old backup file: {}", file.getName());
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("Failed to cleanup old backups: {}", e.getMessage());
        }
    }
}
