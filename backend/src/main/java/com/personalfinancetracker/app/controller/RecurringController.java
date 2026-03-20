package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.dto.CommonDtos.RecurringRequest;
import com.personalfinancetracker.app.service.RecurringService;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/recurring")
public class RecurringController {
    private final RecurringService service;
    public RecurringController(RecurringService service) { this.service = service; }
    @GetMapping public Object list() { return service.list(); }
    @PostMapping public Object create(@Valid @RequestBody RecurringRequest request) { return service.create(request); }
    @GetMapping("/{id}") public Object get(@PathVariable UUID id) { return service.get(id); }
    @PutMapping("/{id}") public Object update(@PathVariable UUID id, @Valid @RequestBody RecurringRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public Map<String, String> delete(@PathVariable UUID id) { service.delete(id); return Map.of("message", "Deleted"); }
    @PostMapping("/{id}/pause") public Object pause(@PathVariable UUID id) { return service.pause(id); }
    @PostMapping("/{id}/resume") public Object resume(@PathVariable UUID id) { return service.resume(id); }
}
