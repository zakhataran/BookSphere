package org.project.database.repository;

import org.project.database.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {

    @Query("SELECt c FROM Category c ORDER BY c.name ASC ")
    List<Category> findAllByOrderedByNameAsc();
}