package com.mysociety.user.model;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.io.Serializable;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;

@Entity
@Table(name = "maintenance_payments")
public class MaintenancePayment implements Serializable {
    
    @Id
    @Column(name = "id", nullable = false, unique = true, length = 50)
    private String id;
    
    @Column(name = "society_name", length = 255)
    private String societyName;
    
    @Column(name = "tower_number", nullable = false, length = 50)
    private String towerNumber;
    
    @Column(name = "flat_number", nullable = false, length = 50)
    private String flatNumber;
    
    @Column(name = "quarter_name", nullable = false, length = 100)
    private String quarterName;
    
    @Column(name = "quarter_period", length = 100)
    private String quarterPeriod;
    
    @Column(name = "amount", nullable = false)
    private Double amount;
    
    @Column(name = "due_date")
    private LocalDate dueDate;
    
    @Column(name = "status", nullable = false, length = 20)
    private String status; // "paid" or "pending"
    
    @Transient
    private String statusText;
    
    @Column(name = "payment_date")
    private LocalDate paymentDate;
    
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;
    
    @Column(name = "transaction_id", length = 100)
    private String transactionId;
    
    @Column(name = "created_at", nullable = false)
    private long createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private long updatedAt;
    
    public MaintenancePayment() {
    }
    
    public MaintenancePayment(String towerNumber, String flatNumber, String quarterName, 
                            String quarterPeriod, Double amount, LocalDate dueDate, String status) {
        this.towerNumber = towerNumber;
        this.flatNumber = flatNumber;
        this.quarterName = quarterName;
        this.quarterPeriod = quarterPeriod;
        this.amount = amount;
        this.dueDate = dueDate;
        this.status = status;
        this.statusText = "paid".equalsIgnoreCase(status) ? "Paid" : "Due";
    }
    
    // Getters and Setters
    public String getId() {
        return id;
    }
    
    public void setId(String id) {
        this.id = id;
    }
    
    public String getSocietyName() {
        return societyName;
    }
    
    public void setSocietyName(String societyName) {
        this.societyName = societyName;
    }
    
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
    
    public LocalDate getPaymentDate() {
        return paymentDate;
    }
    
    public void setPaymentDate(LocalDate paymentDate) {
        this.paymentDate = paymentDate;
    }
    
    public String getPaymentMethod() {
        return paymentMethod;
    }
    
    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }
    
    public String getTransactionId() {
        return transactionId;
    }
    
    public void setTransactionId(String transactionId) {
        this.transactionId = transactionId;
    }
    
    public long getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(long createdAt) {
        this.createdAt = createdAt;
    }
    
    public long getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(long updatedAt) {
        this.updatedAt = updatedAt;
    }
}

