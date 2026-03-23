package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.dto.CommonDtos.RecurringRequest;
import com.personalfinancetracker.app.dto.CommonDtos.RecurringResponse;
import com.personalfinancetracker.app.dto.CommonDtos.TransactionRequest;
import com.personalfinancetracker.app.entity.RecurringFrequency;
import com.personalfinancetracker.app.entity.RecurringTransaction;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.mapper.AppMapper;
import com.personalfinancetracker.app.repository.RecurringTransactionRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RecurringService {
    private final RecurringTransactionRepository recurringRepository;
    private final AuthFacade authFacade;
    private final AccountService accountService;
    private final CategoryService categoryService;
    private final AppMapper mapper;
    private TransactionService transactionService;

    public RecurringService(RecurringTransactionRepository recurringRepository, AuthFacade authFacade, AccountService accountService, CategoryService categoryService, AppMapper mapper) {
        this.recurringRepository = recurringRepository;
        this.authFacade = authFacade;
        this.accountService = accountService;
        this.categoryService = categoryService;
        this.mapper = mapper;
    }

    @org.springframework.beans.factory.annotation.Autowired
    public void setTransactionService(@org.springframework.context.annotation.Lazy TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @Transactional(readOnly = true)
    public List<RecurringResponse> list() { return recurringRepository.findByUserIdOrderByNextRunDateAsc(authFacade.currentUser().getId()).stream().map(mapper::toRecurring).toList(); }
    @Transactional(readOnly = true)
    public RecurringResponse get(UUID id) { return mapper.toRecurring(findEntity(id)); }
    @Transactional(readOnly = true)
    public List<RecurringResponse> upcoming() { return recurringRepository.findTop5ByUserIdAndActiveTrueAndNextRunDateGreaterThanEqualOrderByNextRunDateAsc(authFacade.currentUser().getId(), LocalDate.now()).stream().map(mapper::toRecurring).toList(); }

    @Transactional
    public RecurringResponse create(RecurringRequest request) { RecurringTransaction recurring = new RecurringTransaction(); fill(recurring, request); return mapper.toRecurring(recurringRepository.save(recurring)); }
    @Transactional
    public RecurringResponse update(UUID id, RecurringRequest request) { RecurringTransaction recurring = findEntity(id); fill(recurring, request); return mapper.toRecurring(recurringRepository.save(recurring)); }
    @Transactional
    public void delete(UUID id) { recurringRepository.delete(findEntity(id)); }
    @Transactional
    public RecurringResponse pause(UUID id) { var recurring = findEntity(id); recurring.setActive(false); return mapper.toRecurring(recurringRepository.save(recurring)); }
    @Transactional
    public RecurringResponse resume(UUID id) { var recurring = findEntity(id); recurring.setActive(true); return mapper.toRecurring(recurringRepository.save(recurring)); }

    @Transactional
    public void runDueTransactions() {
        for (RecurringTransaction recurring : recurringRepository.findByActiveTrueAndNextRunDateLessThanEqual(LocalDate.now())) {
            if (recurring.getEndDate() != null && recurring.getEndDate().isBefore(LocalDate.now())) {
                recurring.setActive(false);
                continue;
            }
            if (recurring.isAutoCreateTransaction()) {
                transactionService.create(new TransactionRequest(recurring.getTransactionType(), recurring.getAmount(), recurring.getNextRunDate(), recurring.getAccount() == null ? null : recurring.getAccount().getId(), recurring.getDestinationAccount() == null ? null : recurring.getDestinationAccount().getId(), recurring.getCategory() == null ? null : recurring.getCategory().getId(), recurring.getMerchant(), recurring.getNote(), List.of("recurring"), null, recurring.getId()));
            }
            recurring.setNextRunDate(nextDate(recurring.getNextRunDate(), recurring.getFrequency()));
            recurringRepository.save(recurring);
        }
    }

    private LocalDate nextDate(LocalDate base, RecurringFrequency frequency) {
        return switch (frequency) { case DAILY -> base.plusDays(1); case WEEKLY -> base.plusWeeks(1); case MONTHLY -> base.plusMonths(1); case YEARLY -> base.plusYears(1); };
    }

    private void fill(RecurringTransaction recurring, RecurringRequest request) {
        recurring.setUser(authFacade.currentUser());
        recurring.setTitle(request.title());
        recurring.setTransactionType(request.transactionType());
        recurring.setFrequency(request.frequency());
        recurring.setAmount(request.amount());
        recurring.setStartDate(request.startDate());
        recurring.setEndDate(request.endDate());
        recurring.setNextRunDate(request.nextRunDate() == null ? request.startDate() : request.nextRunDate());
        recurring.setAccount(request.accountId() == null ? null : accountService.findEntity(request.accountId()));
        recurring.setDestinationAccount(request.destinationAccountId() == null ? null : accountService.findEntity(request.destinationAccountId()));
        recurring.setCategory(request.categoryId() == null ? null : categoryService.findEntity(request.categoryId()));
        recurring.setMerchant(request.merchant());
        recurring.setNote(request.note());
        recurring.setAutoCreateTransaction(request.autoCreateTransaction() == null ? true : request.autoCreateTransaction());
        recurring.setActive(request.active() == null ? true : request.active());
    }

    @Transactional(readOnly = true)
    public RecurringTransaction findEntity(UUID id) { return recurringRepository.findByIdAndUserId(id, authFacade.currentUser().getId()).orElseThrow(() -> new ApiException("Recurring transaction not found")); }
}
