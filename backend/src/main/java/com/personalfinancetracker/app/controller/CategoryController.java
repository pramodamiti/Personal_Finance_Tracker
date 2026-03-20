package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.dto.CommonDtos.*;
import com.personalfinancetracker.app.service.CategoryService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {
    private final CategoryService service;
    public CategoryController(CategoryService service) { this.service = service; }
    @GetMapping public List<CategoryResponse> list() { return service.list(); }
    @PostMapping public CategoryResponse create(@Valid @RequestBody CategoryRequest request) { return service.create(request); }
    @PutMapping("/{id}") public CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody CategoryRequest request) { return service.update(id, request); }
    @DeleteMapping("/{id}") public Map<String, String> delete(@PathVariable UUID id) { service.delete(id); return Map.of("message", "Archived"); }
}
