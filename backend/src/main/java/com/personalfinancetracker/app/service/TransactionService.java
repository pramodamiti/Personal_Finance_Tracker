package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.dto.CommonDtos.TransactionRequest;
import com.personalfinancetracker.app.dto.CommonDtos.TransactionResponse;
import com.personalfinancetracker.app.entity.Transaction;
import com.personalfinancetracker.app.entity.TransactionType;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.mapper.AppMapper;
import com.personalfinancetracker.app.repository.TransactionRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TransactionService {
    private final TransactionRepository transactionRepository;
    private final AccountService accountService;
    private final CategoryService categoryService;
    private final RecurringService recurringService;
    private final AuthFacade authFacade;
    private final BalanceService balanceService;
    private final AppMapper mapper;
    private final AuditService auditService;

    public TransactionService(TransactionRepository transactionRepository, AccountService accountService, CategoryService categoryService,
                              RecurringService recurringService, AuthFacade authFacade, BalanceService balanceService,
                              AppMapper mapper, AuditService auditService) {
        this.transactionRepository = transactionRepository;
        this.accountService = accountService;
        this.categoryService = categoryService;
        this.recurringService = recurringService;
        this.authFacade = authFacade;
        this.balanceService = balanceService;
        this.mapper = mapper;
        this.auditService = auditService;
    }

    @Transactional(readOnly = true)
    public Object list(String search, java.time.LocalDate fromDate, java.time.LocalDate toDate, UUID accountId, UUID categoryId, int page, int size) {
        return transactionRepository.search(authFacade.currentUser().getId(), normalizeSearch(search), fromDate, toDate, accountId, categoryId, PageRequest.of(page, size)).map(mapper::toTransaction);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> recent() {
        return transactionRepository.findTop5ByUserIdOrderByTransactionDateDescCreatedAtDesc(authFacade.currentUser().getId()).stream().map(mapper::toTransaction).toList();
    }

    @Transactional(readOnly = true)
    public TransactionResponse get(UUID id) { return mapper.toTransaction(findEntity(id)); }

    @Transactional
    public TransactionResponse create(TransactionRequest request) {
        Transaction transaction = build(new Transaction(), request);
        transactionRepository.save(transaction);
        balanceService.apply(transaction);
        auditService.log(authFacade.currentUser(), "CREATE", "Transaction", transaction.getId(), transaction.getType().name());
        return mapper.toTransaction(transactionRepository.save(transaction));
    }

    @Transactional
    public TransactionResponse update(UUID id, TransactionRequest request) {
        Transaction transaction = findEntity(id);
        balanceService.reverse(transaction);
        build(transaction, request);
        balanceService.apply(transaction);
        auditService.log(authFacade.currentUser(), "UPDATE", "Transaction", transaction.getId(), transaction.getType().name());
        return mapper.toTransaction(transactionRepository.save(transaction));
    }

    @Transactional
    public void delete(UUID id) {
        Transaction transaction = findEntity(id);
        balanceService.reverse(transaction);
        auditService.log(authFacade.currentUser(), "DELETE", "Transaction", transaction.getId(), transaction.getType().name());
        transactionRepository.delete(transaction);
    }

    private Transaction build(Transaction transaction, TransactionRequest request) {
        if (request.type() != TransactionType.TRANSFER && request.accountId() == null) throw new ApiException("Account is required");
        if (request.type() == TransactionType.TRANSFER && (request.accountId() == null || request.destinationAccountId() == null)) throw new ApiException("Transfer requires source and destination accounts");
        if (request.type() != TransactionType.TRANSFER && request.categoryId() == null) throw new ApiException("Category is required");
        transaction.setUser(authFacade.currentUser());
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setTransactionDate(request.transactionDate());
        transaction.setAccount(request.accountId() == null ? null : accountService.findEntity(request.accountId()));
        transaction.setDestinationAccount(request.destinationAccountId() == null ? null : accountService.findEntity(request.destinationAccountId()));
        transaction.setCategory(request.categoryId() == null ? null : categoryService.findEntity(request.categoryId()));
        transaction.setMerchant(request.merchant());
        transaction.setNote(request.note());
        transaction.setPaymentMethod(request.paymentMethod());
        transaction.setTags(request.tags() == null ? null : request.tags().toArray(String[]::new));
        transaction.setRecurringTransaction(request.recurringTransactionId() == null ? null : recurringService.findEntity(request.recurringTransactionId()));
        return transaction;
    }

    @Transactional(readOnly = true)
    public Transaction findEntity(UUID id) {
        return transactionRepository.findByIdAndUserId(id, authFacade.currentUser().getId()).orElseThrow(() -> new ApiException("Transaction not found"));
    }

    private String normalizeSearch(String value) { return value == null ? "" : value.trim(); }
}
