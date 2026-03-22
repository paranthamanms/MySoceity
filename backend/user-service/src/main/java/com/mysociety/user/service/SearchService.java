package com.mysociety.user.service;

import com.mysociety.user.model.SearchResult;
import com.mysociety.user.model.UserProfile;
import com.mysociety.user.repository.UserProfileRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Search Service with Redis + Caffeine dual-layer caching
 * - Caffeine: Fast in-memory cache for recent/frequency searches
 * - Redis: Persistent cache across restarts
 */
@Service
public class SearchService {

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private UserProfileRepository userProfileRepository;

    private static final String REDIS_SEARCH_KEY_PREFIX = "search:";
    private static final long REDIS_CACHE_TTL = 3600; // 1 hour in seconds

    /**
     * Intelligent search with dual-layer caching
     * @param query Search query string
     * @param userRole User's role for permission-based filtering
     * @return List of search results ordered by relevance
     */
    @Cacheable(value = "searchSuggestions", key = "#query + '_' + #userRole")
    public List<SearchResult> search(String query, String userRole) {
        if (query == null || query.trim().isEmpty()) {
            return Collections.emptyList();
        }

        String normalizedQuery = query.toLowerCase().trim();
        
        // Try Redis cache first
        List<SearchResult> cachedResults = getFromRedisCache(normalizedQuery, userRole);
        if (cachedResults != null && !cachedResults.isEmpty()) {
            return cachedResults;
        }

        // Build search results from database
        List<SearchResult> results = new ArrayList<>();
        
        // Search in different categories
        results.addAll(searchAmenities(normalizedQuery));
        results.addAll(searchUsers(normalizedQuery));
        results.addAll(searchFeatures(normalizedQuery, userRole));
        results.addAll(searchActions(normalizedQuery));
        
        // Sort by relevance score (highest first)
        results.sort((a, b) -> Double.compare(b.getRelevanceScore(), a.getRelevanceScore()));
        
        // Store in Redis cache
        storeInRedisCache(normalizedQuery, userRole, results);
        
        return results.stream().limit(10).collect(Collectors.toList());
    }

    /**
     * Search amenities
     */
    private List<SearchResult> searchAmenities(String query) {
        List<SearchResult> results = new ArrayList<>();
        
        Map<String, String[]> amenities = Map.of(
            "swimming", new String[]{"ðŸŠ", "Swimming Pool", "Book the swimming pool"},
            "gym", new String[]{"ðŸ’ª", "Gym", "Book gym facility"},
            "club", new String[]{"ðŸŽ¾", "Clubhouse", "Book clubhouse for events"},
            "park", new String[]{"ðŸŒ³", "Park", "Visit community park"}, 
            "Tennis", new String[]{"ðŸŽ¾", "Tennis Court", "Book tennis court"},
            "badminton", new String[]{"ðŸ¸", "Badminton Court", "Book badminton court"},
            "party", new String[]{"ðŸŽ‰", "Party Hall", "Book party hall"}
        );

        for (Map.Entry<String, String[]> entry : amenities.entrySet()) {
            double score = calculateRelevance(query, entry.getKey());
            if (score > 0.3) {
                results.add(new SearchResult(
                    "amenity",
                    entry.getKey(),
                    entry.getValue()[1],
                    entry.getValue()[2],
                    entry.getValue()[0],
                    "/dashboard?action=bookAmenity&id=" + entry.getKey(),
                    score
                ));
            }
        }
        
        return results;
    }

    /**
     * Search users (residents)
     */
    private List<SearchResult> searchUsers(String query) {
        List<SearchResult> results = new ArrayList<>();
        
        // Search by username or email prefix
        List<UserProfile> users = userProfileRepository.findAll().stream()
            .filter(u -> u.getUsername() != null && 
                   (u.getUsername().toLowerCase().contains(query) ||
                    (u.getEmail() != null && u.getEmail().toLowerCase().contains(query))))
            .limit(5)
            .collect(Collectors.toList());
        
        for (UserProfile user : users) {
            double score = calculateRelevance(query, user.getUsername());
            results.add(new SearchResult(
                "user",
                user.getId().toString(),
                user.getUsername(),
                "Tower " + user.getTowerNumber() + ", Flat " + user.getFlatNumber(),
                "ðŸ‘¤",
                "/dashboard?action=viewUser&id=" + user.getId(),
                score
            ));
        }
        
        return results;
    }

    /**
     * Search features/pages
     */
    private List<SearchResult> searchFeatures(String query, String userRole) {
        List<SearchResult> results = new ArrayList<>();
        
        Map<String, String[]> features = new LinkedHashMap<>();
        
        // Common features for all users
        features.put("marketplace", new String[]{"ðŸª", "Marketplace", "Shop from community vendors"});
        features.put("payment", new String[]{"ðŸ’°", "Maintenance Payment", "Pay maintenance dues"});
        features.put("announcement", new String[]{"ðŸ“¢", "Announcements", "View society announcements"});
        features.put("complaint", new String[]{"ðŸ””", "Complaints", "Raise complaints or requests"});
        features.put("directory", new String[]{"ðŸ‘¥", "User Directory", "View resident directory"});
        features.put("realestate", new String[]{"ðŸ ", "Real Estate", "Buy or rent flats"});
        
        // Admin-only features
        if ("admin".equalsIgnoreCase(userRole) || "society_admin".equalsIgnoreCase(userRole)) {
            features.put("manage users", new String[]{"ðŸ‘¨â€ðŸ’¼", "Manage Users", "Add/edit users"});
            features.put("create announcement", new String[]{"ðŸ“", "Create Announcement", "Post announcements"});
            features.put("manage society", new String[]{"ðŸ¢", "Manage Society", "Society settings"});
        }

        for (Map.Entry<String, String[]> entry : features.entrySet()) {
            double score = calculateRelevance(query, entry.getKey());
            if (score > 0.3) {
                results.add(new SearchResult(
                    "feature",
                    entry.getKey().replace(" ", "_"),
                    entry.getValue()[1],
                    entry.getValue()[2],
                    entry.getValue()[0],
                    "/dashboard?feature=" + entry.getKey().replace(" ", "_"),
                    score
                ));
            }
        }
        
        return results;
    }

    /**
     * Search quick actions
     */
    private List<SearchResult> searchActions(String query) {
        List<SearchResult> results = new ArrayList<>();
        
        Map<String, String[]> actions = Map.of(
            "book", new String[]{"ðŸ“…", "Book Amenity", "Book facilities"},
            "pay", new String[]{"ðŸ’³", "Make Payment", "Pay maintenance"},
            "post", new String[]{"âœï¸", "Create Post", "Share with community"},
            "order", new String[]{"ðŸ›’", "My Orders", "View your orders"}
        );

        for (Map.Entry<String, String[]> entry : actions.entrySet()) {
            double score = calculateRelevance(query, entry.getKey());
            if (score > 0.3) {
                results.add(new SearchResult(
                    "action",
                    entry.getKey(),
                    entry.getValue()[1],
                    entry.getValue()[2],
                    entry.getValue()[0],
                    "/dashboard?action=" + entry.getKey(),
                    score
                ));
            }
        }
        
        return results;
    }

    /**
     * Calculate relevance score using fuzzy matching
     * Returns 0.0 to 1.0
     */
    private double calculateRelevance(String query, String target) {
        if (target == null) return 0.0;
        
        String targetLower = target.toLowerCase();
        String queryLower = query.toLowerCase();
        
        // Exact match
        if (targetLower.equals(queryLower)) {
            return 1.0;
        }
        
        // Starts with query
        if (targetLower.startsWith(queryLower)) {
            return 0.9;
        }
        
        // Contains query
        if (targetLower.contains(queryLower)) {
            return 0.7;
        }
        
        // Fuzzy match - check character overlap
        int matches = 0;
        for (char c : queryLower.toCharArray()) {
            if (targetLower.indexOf(c) >= 0) {
                matches++;
            }
        }
        
        double fuzzyScore = (double) matches / queryLower.length();
        if (fuzzyScore < 0.5) {
            return 0.0; // Too different
        }
        
        return fuzzyScore * 0.5; // Scale down fuzzy matches
    }

    /**
     * Get results from Redis cache
     */
    @SuppressWarnings("unchecked")
    private List<SearchResult> getFromRedisCache(String query, String userRole) {
        try {
            String key = REDIS_SEARCH_KEY_PREFIX + query + ":" + userRole;
            Object cached = redisTemplate.opsForValue().get(key);
            if (cached instanceof List) {
                return (List<SearchResult>) cached;
            }
        } catch (Exception e) {
            // Redis not available, continue without cache
            System.err.println("Redis cache retrieval error: " + e.getMessage());
        }
        return null;
    }

    /**
     * Store results in Redis cache
     */
    private void storeInRedisCache(String query, String userRole, List<SearchResult> results) {
        try {
            String key = REDIS_SEARCH_KEY_PREFIX + query + ":" + userRole;
            redisTemplate.opsForValue().set(key, results);
            redisTemplate.expire(key, REDIS_CACHE_TTL, java.util.concurrent.TimeUnit.SECONDS);
        } catch (Exception e) {
            // Redis not available, continue without caching
            System.err.println("Redis cache storage error: " + e.getMessage());
        }
    }

    /**
     * Clear all search caches (useful when data is updated)
     */
    public void clearSearchCache() {
        try {
            Set<String> keys = redisTemplate.keys(REDIS_SEARCH_KEY_PREFIX + "*");
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
            }
        } catch (Exception e) {
            System.err.println("Redis cache clear error: " + e.getMessage());
        }
    }
}

