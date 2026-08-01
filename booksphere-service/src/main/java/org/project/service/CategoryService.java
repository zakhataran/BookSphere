package org.project.service;

import org.project.dto.CategoryReadDto;

import java.util.List;

public interface CategoryService {

    List<CategoryReadDto> getAllCategories();
}