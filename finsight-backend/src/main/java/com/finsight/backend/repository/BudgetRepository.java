package com.finsight.backend.repository;

import com.finsight.backend.model.Budget;
import com.finsight.backend.model.Category;
import com.finsight.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BudgetRepository extends JpaRepository<Budget, Long> {
    List<Budget> findByUser(User user);

    List<Budget> findByUserAndMonthYear(User user, String monthYear);

    Optional<Budget> findByUserAndCategoryAndMonthYear(User user, Category category, String monthYear);
}
