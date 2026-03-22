package com.mysociety.user.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import java.util.concurrent.TimeUnit;

/**
 * Caffeine Cache Configuration for in-memory caching
 * Caffeine provides fast, temporary cache with automatic eviction
 */
@Configuration
public class CaffeineConfig {

    /**
     * Primary cache manager using Caffeine for in-memory caching
     * Cache expires after 10 minutes of write, max 10000 entries
     */
    @Bean
    @Primary
    public CacheManager caffeineCacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager(
            "searchSuggestions",
            "userProfiles",
            "societies", 
            "amenities",
            "announcements"
        );
        
        cacheManager.setCaffeine(Caffeine.newBuilder()
            .maximumSize(10000) // Max cache entries
            .expireAfterWrite(10, TimeUnit.MINUTES) // Expire after 10 minutes
            .recordStats()); // Enable statistics
        
        return cacheManager;
    }
}

