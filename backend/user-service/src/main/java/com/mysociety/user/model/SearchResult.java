package com.mysociety.user.model;

import java.io.Serializable;

/**
 * Search result model for search suggestions
 */
public class SearchResult implements Serializable {
    private String type; // amenity, user, announcement, payment, etc.
    private String id;
    private String title;
    private String description;
    private String icon;
    private String route; // Navigation route
    private double relevanceScore; // 0.0 to 1.0

    public SearchResult() {
    }

    public SearchResult(String type, String id, String title, String description, String icon, String route, double relevanceScore) {
        this.type = type;
        this.id = id;
        this.title = title;
        this.description = description;
        this.icon = icon;
        this.route = route;
        this.relevanceScore = relevanceScore;
    }

    public String getType() {
        return type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcon() {
        return icon;
    }

    public void setIcon(String icon) {
        this.icon = icon;
    }

    public String getRoute() {
        return route;
    }

    public void setRoute(String route) {
        this.route = route;
    }

    public double getRelevanceScore() {
        return relevanceScore;
    }

    public void setRelevanceScore(double relevanceScore) {
        this.relevanceScore = relevanceScore;
    }
}

