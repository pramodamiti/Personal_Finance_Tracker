package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.dto.CommonDtos.TransactionRequest;
import com.personalfinancetracker.app.dto.CommonDtos.TransactionResponse;
import com.personalfinancetracker.app.service.TransactionService;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {
    private final TransactionService service;
    public TransactionController(TransactionService service) { this.service = service; }
    @GetMapping public Object list(@RequestParam(required = false) String search, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fromDate, @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate toDate, @RequestParam(required = false) UUID accountId, @RequestParam(required = false) UUID categoryId, @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) { return service.list(search, fromDate, toDate, accountId, categoryId, page, size); }
    @PostMapping public TransactionResponse create(@Valid @RequestBody TransactionRequest request) { return service.create(request); }
    @GetMapping("/{id}") public TransactionResponse get(@PathVariable UUID id) { return service.get(id); }
    @PutMapping("/{id}") public TransactionResponse update(@PathVariable UUID id, @Valid @RequestBody TransactionRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public Map<String, String> delete(@PathVariable UUID id) { service.delete(id); return Map.of("message", "Deleted"); }
}
