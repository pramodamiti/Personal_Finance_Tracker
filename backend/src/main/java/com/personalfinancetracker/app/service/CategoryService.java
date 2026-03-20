package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.dto.CommonDtos.*;
import com.personalfinancetracker.app.entity.Category;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.mapper.AppMapper;
import com.personalfinancetracker.app.repository.CategoryRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {
    private final CategoryRepository categoryRepository;
    private final AppMapper mapper;
    private final AuthFacade authFacade;

    public CategoryService(CategoryRepository categoryRepository, AppMapper mapper, AuthFacade authFacade) {
        this.categoryRepository = categoryRepository;
        this.mapper = mapper;
        this.authFacade = authFacade;
    }

    public List<CategoryResponse> list() {
        return categoryRepository.findByUserIdOrSystemDefaultTrueOrderByNameAsc(authFacade.currentUser().getId()).stream().map(mapper::toCategory).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest request) {
        Category category = new Category();
        category.setUser(authFacade.currentUser());
        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        category.setColor(request.color());
        return mapper.toCategory(categoryRepository.save(category));
    }

    @Transactional
    public CategoryResponse update(UUID id, CategoryRequest request) {
        Category category = findEntity(id);
        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        category.setColor(request.color());
        return mapper.toCategory(categoryRepository.save(category));
    }

    @Transactional
    public void delete(UUID id) {
        Category category = findEntity(id);
        category.setArchived(true);
        categoryRepository.save(category);
    }

    public Category findEntity(UUID id) {
        Category category = categoryRepository.findByIdAndArchivedFalse(id).orElseThrow(() -> new ApiException("Category not found"));
        if (category.getUser() != null && !category.getUser().getId().equals(authFacade.currentUser().getId())) throw new ApiException("Category not found");
        return category;
    }
}
