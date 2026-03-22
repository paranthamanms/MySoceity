package com.NammaSociety.user.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

public class MaintenancePayment {
    private String towerNumber;
    private String flatNumber;
    private String quarterName;
    private String quarterPeriod;
    private Double amount;
    private LocalDate dueDate;
    private String status; // "paid" or "pending"
    private String statusText;
    
    @JsonProperty("additionalFields")
    @JsonInclude(JsonInclude.Include.ALWAYS)
    private Map<String, String> additionalFields = new HashMap<>();
    
    public MaintenancePayment() {
    }
    
    public MaintenancePayment(String towerNumber, String flatNumber, String quarterName, 
                            String quarterPeriod, Double amount, LocalDate dueDate, String status) {
        this(towerNumber, flatNumber, quarterName, quarterPeriod, amount, dueDate, status, new HashMap<>());
    }

    public MaintenancePayment(String towerNumber, String flatNumber, String quarterName,
                            String quarterPeriod, Double amount, LocalDate dueDate, String status,
                            Map<String, String> additionalFields) {
        this.towerNumber = towerNumber;
        this.flatNumber = flatNumber;
        this.quarterName = quarterName;
        this.quarterPeriod = quarterPeriod;
        this.amount = amount;
        this.dueDate = dueDate;
        this.status = status;
        this.statusText = "paid".equalsIgnoreCase(status) ? "Paid" : "Due";
        if (additionalFields != null) {
            this.additionalFields = additionalFields;
        }
    }
    
    // Getters and Setters
    public String getTowerNumber() {
        return towerNumber;
    }
    
    public void setTowerNumber(String towerNumber) {
        this.towerNumber = towerNumber;
    }
    
    public String getFlatNumber() {
        return flatNumber;
    }
    
    public void setFlatNumber(String flatNumber) {
        this.flatNumber = flatNumber;
    }
    
    public String getQuarterName() {
        return quarterName;
    }
    
    public void setQuarterName(String quarterName) {
        this.quarterName = quarterName;
    }
    
    public String getQuarterPeriod() {
        return quarterPeriod;
    }
    
    public void setQuarterPeriod(String quarterPeriod) {
        this.quarterPeriod = quarterPeriod;
    }
    
    public Double getAmount() {
        return amount;
    }
    
    public void setAmount(Double amount) {
        this.amount = amount;
    }
    
    public LocalDate getDueDate() {
        return dueDate;
    }
    
    public void setDueDate(LocalDate dueDate) {
        this.dueDate = dueDate;
    }
    
    public String getStatus() {
        return status;
    }
    
    public void setStatus(String status) {
        this.status = status;
        this.statusText = "paid".equalsIgnoreCase(status) ? "Paid" : "Due";
    }
    
    public String getStatusText() {
        return statusText;
    }
    
    public void setStatusText(String statusText) {
        this.statusText = statusText;
    }

    public Map<String, String> getAdditionalFields() {
        return additionalFields;
    }

    public void setAdditionalFields(Map<String, String> additionalFields) {
        this.additionalFields = additionalFields != null ? additionalFields : new HashMap<>();
    }
}

