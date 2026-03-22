package com.personalfinancetracker.app.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "users")
public class User extends BaseEntity {
    @Column(nullable = false, unique = true)
    private String email;
    @Column(nullable = false)
    private String passwordHash;
    @Column(nullable = false)
    private String displayName;
    @Column(nullable = false)
    private boolean active = true;
    @Column(name = "google_sub", unique = true)
    private String googleSub;
    @Column(name = "google_linked_at")
    private OffsetDateTime googleLinkedAt;
    @Column(name = "last_login_at")
    private OffsetDateTime lastLoginAt;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getDisplayName() { return displayName; }
    public void setDisplayName(String displayName) { this.displayName = displayName; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public String getGoogleSub() { return googleSub; }
    public void setGoogleSub(String googleSub) { this.googleSub = googleSub; }
    public OffsetDateTime getGoogleLinkedAt() { return googleLinkedAt; }
    public void setGoogleLinkedAt(OffsetDateTime googleLinkedAt) { this.googleLinkedAt = googleLinkedAt; }
    public OffsetDateTime getLastLoginAt() { return lastLoginAt; }
    public void setLastLoginAt(OffsetDateTime lastLoginAt) { this.lastLoginAt = lastLoginAt; }
}
