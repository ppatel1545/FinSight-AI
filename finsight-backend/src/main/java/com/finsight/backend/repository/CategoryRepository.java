package com.finsight.backend.repository;

import com.finsight.backend.model.Category;
import com.finsight.backend.model.CategoryType;
import com.finsight.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByUserOrIsCustomFalse(User user);

    @Query("SELECT c FROM Category c WHERE c.id = :id AND (c.user = :user OR c.isCustom = false)")
    Optional<Category> findByIdAndUserOrIsCustomFalse(@Param("id") Long id, @Param("user") User user);

    @Query("SELECT COUNT(c) > 0 FROM Category c WHERE LOWER(c.name) = LOWER(:name) AND c.type = :type AND (c.user = :user OR c.isCustom = false)")
    boolean existsByNameAndTypeAndUserOrIsCustomFalse(@Param("name") String name, @Param("type") CategoryType type, @Param("user") User user);
}
