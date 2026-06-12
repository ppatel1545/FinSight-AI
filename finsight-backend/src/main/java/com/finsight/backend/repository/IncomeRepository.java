package com.finsight.backend.repository;

import com.finsight.backend.model.Income;
import com.finsight.backend.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface IncomeRepository extends JpaRepository<Income, Long> {
    List<Income> findByUser(User user);

    List<Income> findByUserAndDateBetween(User user, LocalDate startDate, LocalDate endDate);

    @Query("SELECT i FROM Income i WHERE i.user = :user " +
           "AND (:categoryId IS NULL OR i.category.id = :categoryId) " +
           "AND (:startDate IS NULL OR i.date >= :startDate) " +
           "AND (:endDate IS NULL OR i.date <= :endDate) " +
           "AND (:search IS NULL OR LOWER(i.description) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Income> findFilteredIncomes(
            @Param("user") User user,
            @Param("categoryId") Long categoryId,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("search") String search,
            Pageable pageable
    );
}
