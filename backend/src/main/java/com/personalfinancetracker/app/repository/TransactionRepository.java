package com.personalfinancetracker.app.repository;

import com.personalfinancetracker.app.entity.Transaction;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Optional<Transaction> findByIdAndUserId(UUID id, UUID userId);

    @Query("""
        select t from Transaction t
        where t.user.id = :userId
        and (:search is null or lower(coalesce(t.merchant,'')) like lower(concat('%', :search, '%')) or lower(coalesce(t.note,'')) like lower(concat('%', :search, '%')))
        and (:fromDate is null or t.transactionDate >= :fromDate)
        and (:toDate is null or t.transactionDate <= :toDate)
        and (:accountId is null or t.account.id = :accountId or t.destinationAccount.id = :accountId)
        and (:categoryId is null or t.category.id = :categoryId)
        order by t.transactionDate desc, t.createdAt desc
        """)
    Page<Transaction> search(UUID userId, String search, LocalDate fromDate, LocalDate toDate, UUID accountId, UUID categoryId, Pageable pageable);

    List<Transaction> findTop5ByUserIdOrderByTransactionDateDescCreatedAtDesc(UUID userId);
    List<Transaction> findByUserIdAndTransactionDateBetween(UUID userId, LocalDate start, LocalDate end);
}
