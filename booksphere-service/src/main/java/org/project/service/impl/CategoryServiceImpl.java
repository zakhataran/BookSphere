package org.project.service.impl;

import lombok.RequiredArgsConstructor;
import org.project.database.repository.CategoryRepository;
import org.project.dto.CategoryReadDto;
import org.project.mapper.CategoryMapper;
import org.project.service.CategoryService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;
    private final CategoryMapper categoryMapper;

    @Override
    public List<CategoryReadDto> getAllCategories() {
        return categoryRepository.findAllByOrderedByNameAsc().stream()
                .map(categoryMapper::toCategoryReadDto).toList();
    }
}
