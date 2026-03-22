package com.NammaSociety.auth.model;

public class RegisterRequest {
    private String username;
    private String email;
    private String password;
    private String confirmPassword;
    private String userType;
    private String ownerType;
    private String towerNumber;
    private String flatNumber;

    public RegisterRequest() {}

    public RegisterRequest(String username, String email, String password, String confirmPassword,
                          String userType, String ownerType, String towerNumber, String flatNumber) {
        this.username = username;
        this.email = email;
        this.password = password;
        this.confirmPassword = confirmPassword;
        this.userType = userType;
        this.ownerType = ownerType;
        this.towerNumber = towerNumber;
        this.flatNumber = flatNumber;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getConfirmPassword() {
        return confirmPassword;
    }

    public void setConfirmPassword(String confirmPassword) {
        this.confirmPassword = confirmPassword;
    }

    public String getUserType() {
        return userType;
    }

    public void setUserType(String userType) {
        this.userType = userType;
    }

    public String getOwnerType() {
        return ownerType;
    }

    public void setOwnerType(String ownerType) {
        this.ownerType = ownerType;
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
}


