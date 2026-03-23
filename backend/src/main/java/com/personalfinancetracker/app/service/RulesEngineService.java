package com.personalfinancetracker.app.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.personalfinancetracker.app.dto.CommonDtos.RuleRequest;
import com.personalfinancetracker.app.dto.CommonDtos.RuleResponse;
import com.personalfinancetracker.app.entity.Rule;
import com.personalfinancetracker.app.entity.Transaction;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.repository.RuleRepository;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RulesEngineService {
    private static final TypeReference<Map<String, Object>> MAP_TYPE = new TypeReference<>() {};

    private final RuleRepository ruleRepository;
    private final AuthFacade authFacade;
    private final ObjectMapper objectMapper;
    private final CategoryService categoryService;

    public RulesEngineService(RuleRepository ruleRepository, AuthFacade authFacade, ObjectMapper objectMapper, CategoryService categoryService) {
        this.ruleRepository = ruleRepository;
        this.authFacade = authFacade;
        this.objectMapper = objectMapper;
        this.categoryService = categoryService;
    }

    @Transactional(readOnly = true)
    public List<RuleResponse> list() {
        return ruleRepository.findByUserIdOrderByPriorityAscCreatedAtAsc(authFacade.currentUser().getId()).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RuleResponse create(RuleRequest request) {
        Rule rule = new Rule();
        fill(rule, request);
        return toResponse(ruleRepository.save(rule));
    }

    @Transactional
    public RuleResponse update(UUID id, RuleRequest request) {
        Rule rule = findEntity(id);
        fill(rule, request);
        return toResponse(ruleRepository.save(rule));
    }

    @Transactional
    public void delete(UUID id) {
        ruleRepository.delete(findEntity(id));
    }

    @Transactional(readOnly = true)
    public List<String> applyRules(Transaction transaction) {
        List<String> events = new ArrayList<>();
        for (Rule rule : ruleRepository.findByUserIdOrderByPriorityAscCreatedAtAsc(authFacade.currentUser().getId())) {
            if (!rule.isActive()) {
                continue;
            }
            Map<String, Object> condition = readMap(rule.getConditionJson());
            if (!matches(transaction, condition)) {
                continue;
            }
            applyAction(transaction, readMap(rule.getActionJson()), events, rule.getName());
        }
        return events;
    }

    private void fill(Rule rule, RuleRequest request) {
        rule.setUser(authFacade.currentUser());
        rule.setName(request.name());
        rule.setPriority(request.priority() == null ? 100 : request.priority());
        rule.setConditionJson(writeJson(request.condition()));
        rule.setActionJson(writeJson(request.action()));
        rule.setActive(request.isActive());
    }

    private Rule findEntity(UUID id) {
        return ruleRepository.findByIdAndUserId(id, authFacade.currentUser().getId())
                .orElseThrow(() -> new ApiException("Rule not found"));
    }

    private RuleResponse toResponse(Rule rule) {
        return new RuleResponse(
                rule.getId(),
                rule.getName(),
                rule.getPriority(),
                readMap(rule.getConditionJson()),
                readMap(rule.getActionJson()),
                rule.isActive(),
                rule.getCreatedAt() == null ? OffsetDateTime.now() : rule.getCreatedAt());
    }

    private boolean matches(Transaction transaction, Map<String, Object> condition) {
        String field = stringValue(condition.get("field"));
        String operator = stringValue(condition.get("operator"));
        String expected = stringValue(condition.get("value"));
        String actual = switch (field) {
            case "merchant" -> safe(transaction.getMerchant());
            case "note" -> safe(transaction.getNote());
            case "type" -> transaction.getType() == null ? "" : transaction.getType().name();
            case "category" -> transaction.getCategory() == null ? "" : transaction.getCategory().getName();
            case "categoryId" -> transaction.getCategory() == null ? "" : transaction.getCategory().getId().toString();
            case "amount" -> transaction.getAmount() == null ? "0" : transaction.getAmount().toPlainString();
            default -> "";
        };

        return switch (operator) {
            case "equals" -> actual.equalsIgnoreCase(expected);
            case "contains" -> actual.toLowerCase().contains(expected.toLowerCase());
            case "greater_than" -> decimal(actual).compareTo(decimal(expected)) > 0;
            case "less_than" -> decimal(actual).compareTo(decimal(expected)) < 0;
            default -> false;
        };
    }

    private void applyAction(Transaction transaction, Map<String, Object> action, List<String> events, String ruleName) {
        String type = stringValue(action.get("type"));
        String value = stringValue(action.get("value"));
        switch (type) {
            case "set_category" -> {
                if (value.isBlank()) {
                    return;
                }
                transaction.setCategory(categoryService.findEntity(UUID.fromString(value)));
                events.add(ruleName + ": category updated");
            }
            case "add_tag" -> {
                LinkedHashSet<String> tags = new LinkedHashSet<>();
                if (transaction.getTags() != null) {
                    for (String tag : transaction.getTags()) {
                        if (tag != null && !tag.isBlank()) {
                            tags.add(tag);
                        }
                    }
                }
                if (!value.isBlank()) {
                    tags.add(value);
                    transaction.setTags(tags.toArray(String[]::new));
                    events.add(ruleName + ": tag added");
                }
            }
            case "set_note" -> {
                transaction.setNote(value);
                events.add(ruleName + ": note updated");
            }
            case "trigger_alert" -> {
                String nextNote = safe(transaction.getNote());
                String alert = value.isBlank() ? "Rule alert triggered" : value;
                transaction.setNote(nextNote.isBlank() ? "[Alert] " + alert : nextNote + " | [Alert] " + alert);
                events.add(ruleName + ": alert triggered");
            }
            default -> {
            }
        }
    }

    private Map<String, Object> readMap(String value) {
        try {
            return objectMapper.readValue(value, MAP_TYPE);
        } catch (Exception exception) {
            throw new ApiException("Invalid rule configuration");
        }
    }

    private String writeJson(Map<String, Object> value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception exception) {
            throw new ApiException("Invalid rule payload");
        }
    }

    private BigDecimal decimal(String value) {
        try {
            return new BigDecimal(value == null || value.isBlank() ? "0" : value);
        } catch (NumberFormatException exception) {
            return BigDecimal.ZERO;
        }
    }

    private String stringValue(Object value) {
        return value == null ? "" : String.valueOf(value).trim();
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
