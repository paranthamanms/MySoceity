package com.mysociety.user.controller;

import com.mysociety.user.model.SearchResult;
import com.mysociety.user.service.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Search Controller for intelligent search with auto-suggestions
 */
@RestController
@RequestMapping("/api/search")
@CrossOrigin(origins = "*")
public class SearchController {

    @Autowired
    private SearchService searchService;

    /**
     * Search endpoint with auto-complete suggestions
     * GET /api/search?q=query&role=user
     */
    @GetMapping
    public ResponseEntity<List<SearchResult>> search(
            @RequestParam("q") String query,
            @RequestParam(value = "role", required = false, defaultValue = "user") String userRole) {
        
        if (query == null || query.trim().length() < 1) {
            return ResponseEntity.ok(List.of());
        }
        
        List<SearchResult> results = searchService.search(query, userRole);
        return ResponseEntity.ok(results);
    }

    /**
     * Clear search cache (admin only)
     * POST /api/search/clear-cache
     */
    @PostMapping("/clear-cache")
    public ResponseEntity<String> clearCache() {
        searchService.clearSearchCache();
        return ResponseEntity.ok("Search cache cleared successfully");
    }
}

