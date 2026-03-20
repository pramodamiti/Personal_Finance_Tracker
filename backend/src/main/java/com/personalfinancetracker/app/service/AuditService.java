package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.entity.AuditLog;
import com.personalfinancetracker.app.entity.User;
import com.personalfinancetracker.app.repository.AuditLogRepository;
import org.springframework.stereotype.Service;

@Service
public class AuditService {
    private final AuditLogRepository auditLogRepository;

    public AuditService(AuditLogRepository auditLogRepository) {
        this.auditLogRepository = auditLogRepository;
    }

    public void log(User user, String action, String entityName, Object entityId, String details) {
        AuditLog log = new AuditLog();
        log.setUser(user);
        log.setAction(action);
        log.setEntityName(entityName);
        log.setEntityId(entityId == null ? null : entityId.toString());
        log.setDetails(details);
        auditLogRepository.save(log);
    }
}
