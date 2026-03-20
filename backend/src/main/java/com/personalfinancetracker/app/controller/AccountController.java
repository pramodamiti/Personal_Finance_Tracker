package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.dto.CommonDtos.*;
import com.personalfinancetracker.app.service.AccountService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {
    private final AccountService service;
    public AccountController(AccountService service) { this.service = service; }
    @GetMapping public List<AccountResponse> list() { return service.list(); }
    @PostMapping public AccountResponse create(@Valid @RequestBody AccountRequest request) { return service.create(request); }
    @GetMapping("/{id}") public AccountResponse get(@PathVariable UUID id) { return service.get(id); }
    @PutMapping("/{id}") public AccountResponse update(@PathVariable UUID id, @Valid @RequestBody AccountRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public Map<String, String> delete(@PathVariable UUID id) { service.delete(id); return Map.of("message", "Archived"); }
    @PostMapping("/transfer") public Map<String, String> transfer(@Valid @RequestBody TransferRequest request) { service.transfer(request); return Map.of("message", "Transfer completed"); }
}
