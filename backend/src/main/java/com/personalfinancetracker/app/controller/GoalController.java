package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.dto.CommonDtos.GoalActionRequest;
import com.personalfinancetracker.app.dto.CommonDtos.GoalRequest;
import com.personalfinancetracker.app.service.GoalService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/goals")
public class GoalController {
    private final GoalService service;
    public GoalController(GoalService service) { this.service = service; }
    @GetMapping public Object list() { return service.list(); }
    @PostMapping public Object create(@Valid @RequestBody GoalRequest request) { return service.create(request); }
    @GetMapping("/{id}") public Object get(@PathVariable UUID id) { return service.get(id); }
    @PutMapping("/{id}") public Object update(@PathVariable UUID id, @Valid @RequestBody GoalRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public Map<String, String> delete(@PathVariable UUID id) { service.delete(id); return Map.of("message", "Deleted"); }
    @PostMapping("/{id}/contribute") public Object contribute(@PathVariable UUID id, @Valid @RequestBody GoalActionRequest request) { return service.contribute(id, request); }
    @PostMapping("/{id}/withdraw") public Object withdraw(@PathVariable UUID id, @Valid @RequestBody GoalActionRequest request) { return service.withdraw(id, request); }
    @PostMapping("/{id}/complete") public Object complete(@PathVariable UUID id) { return service.complete(id); }
}
