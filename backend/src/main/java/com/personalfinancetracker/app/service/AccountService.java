package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.dto.CommonDtos.*;
import com.personalfinancetracker.app.entity.Account;
import com.personalfinancetracker.app.entity.Transaction;
import com.personalfinancetracker.app.entity.TransactionType;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.mapper.AppMapper;
import com.personalfinancetracker.app.repository.AccountRepository;
import java.util.List;
import java.util.UUID;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    private final AccountRepository accountRepository;
    private final AppMapper mapper;
    private final AuthFacade authFacade;
    private final TransactionService transactionService;

    public AccountService(AccountRepository accountRepository, AppMapper mapper, AuthFacade authFacade, @Lazy TransactionService transactionService) {
        this.accountRepository = accountRepository;
        this.mapper = mapper;
        this.authFacade = authFacade;
        this.transactionService = transactionService;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> list() {
        return accountRepository.findByUserIdAndArchivedFalseOrderByNameAsc(authFacade.currentUser().getId()).stream().map(mapper::toAccount).toList();
    }

    @Transactional(readOnly = true)
    public AccountResponse get(UUID id) {
        return mapper.toAccount(findEntity(id));
    }

    @Transactional
    public AccountResponse create(AccountRequest request) {
        Account account = new Account();
        account.setUser(authFacade.currentUser());
        account.setName(request.name());
        account.setType(request.type());
        account.setOpeningBalance(request.openingBalance() == null ? java.math.BigDecimal.ZERO : request.openingBalance());
        account.setCurrentBalance(account.getOpeningBalance());
        account.setInstitutionName(request.institutionName());
        return mapper.toAccount(accountRepository.save(account));
    }

    @Transactional
    public AccountResponse update(UUID id, AccountRequest request) {
        Account account = findEntity(id);
        account.setName(request.name());
        account.setType(request.type());
        account.setInstitutionName(request.institutionName());
        return mapper.toAccount(accountRepository.save(account));
    }

    @Transactional
    public void delete(UUID id) {
        Account account = findEntity(id);
        account.setArchived(true);
        accountRepository.save(account);
    }

    @Transactional
    public void transfer(TransferRequest request) {
        TransactionRequest tx = new TransactionRequest(TransactionType.TRANSFER, request.amount(), request.date(), request.sourceAccountId(), request.destinationAccountId(), null, null, request.note(), List.of("manual-transfer"), null, null);
        transactionService.create(tx);
    }

    @Transactional(readOnly = true)
    public Account findEntity(UUID id) {
        return accountRepository.findByIdAndUserId(id, authFacade.currentUser().getId()).orElseThrow(() -> new ApiException("Account not found"));
    }
}
