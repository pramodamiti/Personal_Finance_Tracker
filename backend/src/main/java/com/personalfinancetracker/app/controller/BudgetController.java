package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.dto.CommonDtos.BudgetRequest;
import com.personalfinancetracker.app.service.BudgetService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/budgets")
public class BudgetController {
    private final BudgetService service;
    public BudgetController(BudgetService service) { this.service = service; }
    @GetMapping public Object list(@RequestParam int month, @RequestParam int year) { return service.list(month, year); }
    @PostMapping public Object create(@Valid @RequestBody BudgetRequest request) { return service.create(request); }
    @PutMapping("/{id}") public Object update(@PathVariable UUID id, @Valid @RequestBody BudgetRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public Map<String, String> delete(@PathVariable UUID id) { service.delete(id); return Map.of("message", "Deleted"); }
    @PostMapping("/duplicate-last-month") public Object duplicate(@RequestParam int month, @RequestParam int year) { return service.duplicateLastMonth(month, year); }
}
