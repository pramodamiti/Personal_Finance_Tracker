package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.dto.CommonDtos.RuleRequest;
import com.personalfinancetracker.app.dto.CommonDtos.RuleResponse;
import com.personalfinancetracker.app.service.RulesEngineService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rules")
public class RuleController {
    private final RulesEngineService service;

    public RuleController(RulesEngineService service) {
        this.service = service;
    }

    @GetMapping
    public Object list() {
        return service.list();
    }

    @PostMapping
    public RuleResponse create(@Valid @RequestBody RuleRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public RuleResponse update(@PathVariable UUID id, @Valid @RequestBody RuleRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    public Map<String, String> delete(@PathVariable UUID id) {
        service.delete(id);
        return Map.of("message", "Deleted");
    }
}
