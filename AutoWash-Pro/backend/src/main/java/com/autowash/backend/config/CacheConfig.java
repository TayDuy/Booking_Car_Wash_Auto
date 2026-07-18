package com.autowash.backend.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.boot.cache.autoconfigure.CacheManagerCustomizer;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Cache in-memory (Caffeine) cho các dữ liệu đọc nhiều, ít thay đổi:
 * danh sách dịch vụ (ServicePackage) và chi nhánh (Branch).
 * TTL 10 phút, evict thủ công khi admin create/update/delete.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    public static final String SERVICES_CACHE = "services";
    public static final String BRANCHES_CACHE = "branches";

    @Bean
    public CacheManagerCustomizer<CaffeineCacheManager> caffeineCacheManagerCustomizer() {
        return cacheManager -> {
            cacheManager.setCacheNames(List.of(SERVICES_CACHE, BRANCHES_CACHE));
            cacheManager.setCaffeine(
                    Caffeine.newBuilder()
                            .expireAfterWrite(10, TimeUnit.MINUTES)
                            .maximumSize(500)
            );
        };
    }
}