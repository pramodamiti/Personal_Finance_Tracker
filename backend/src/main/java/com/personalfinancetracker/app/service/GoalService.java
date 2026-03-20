package com.personalfinancetracker.app.service;

import com.personalfinancetracker.app.dto.CommonDtos.GoalActionRequest;
import com.personalfinancetracker.app.dto.CommonDtos.GoalRequest;
import com.personalfinancetracker.app.dto.CommonDtos.GoalResponse;
import com.personalfinancetracker.app.entity.Goal;
import com.personalfinancetracker.app.entity.GoalStatus;
import com.personalfinancetracker.app.exception.ApiException;
import com.personalfinancetracker.app.mapper.AppMapper;
import com.personalfinancetracker.app.repository.GoalRepository;
import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GoalService {
    private final GoalRepository goalRepository;
    private final AuthFacade authFacade;
    private final AccountService accountService;
    private final BalanceService balanceService;
    private final AppMapper mapper;

    public GoalService(GoalRepository goalRepository, AuthFacade authFacade, AccountService accountService, BalanceService balanceService, AppMapper mapper) {
        this.goalRepository = goalRepository;
        this.authFacade = authFacade;
        this.accountService = accountService;
        this.balanceService = balanceService;
        this.mapper = mapper;
    }

    public List<GoalResponse> list() { return goalRepository.findByUserIdOrderByCreatedAtDesc(authFacade.currentUser().getId()).stream().map(mapper::toGoal).toList(); }
    public GoalResponse get(UUID id) { return mapper.toGoal(findEntity(id)); }

    @Transactional
    public GoalResponse create(GoalRequest request) {
        Goal goal = new Goal();
        fill(goal, request);
        return mapper.toGoal(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse update(UUID id, GoalRequest request) {
        Goal goal = findEntity(id);
        fill(goal, request);
        return mapper.toGoal(goalRepository.save(goal));
    }

    @Transactional
    public void delete(UUID id) { goalRepository.delete(findEntity(id)); }

    @Transactional
    public GoalResponse contribute(UUID id, GoalActionRequest request) {
        Goal goal = findEntity(id);
        goal.setCurrentAmount(goal.getCurrentAmount().add(request.amount()));
        if (goal.getLinkedAccount() != null) balanceService.adjust(goal.getLinkedAccount(), request.amount().negate());
        if (goal.getCurrentAmount().compareTo(goal.getTargetAmount()) >= 0) goal.setStatus(GoalStatus.COMPLETED);
        return mapper.toGoal(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse withdraw(UUID id, GoalActionRequest request) {
        Goal goal = findEntity(id);
        if (goal.getCurrentAmount().compareTo(request.amount()) < 0) throw new ApiException("Insufficient goal balance");
        goal.setCurrentAmount(goal.getCurrentAmount().subtract(request.amount()));
        if (goal.getLinkedAccount() != null) balanceService.adjust(goal.getLinkedAccount(), request.amount());
        return mapper.toGoal(goalRepository.save(goal));
    }

    @Transactional
    public GoalResponse complete(UUID id) {
        Goal goal = findEntity(id);
        goal.setStatus(GoalStatus.COMPLETED);
        return mapper.toGoal(goalRepository.save(goal));
    }

    private void fill(Goal goal, GoalRequest request) {
        goal.setUser(authFacade.currentUser());
        goal.setName(request.name());
        goal.setTargetAmount(request.targetAmount());
        goal.setCurrentAmount(request.currentAmount() == null ? BigDecimal.ZERO : request.currentAmount());
        goal.setTargetDate(request.targetDate());
        goal.setLinkedAccount(request.linkedAccountId() == null ? null : accountService.findEntity(request.linkedAccountId()));
        goal.setIcon(request.icon());
        goal.setColor(request.color());
        goal.setStatus(request.status() == null ? GoalStatus.ACTIVE : request.status());
    }

    private Goal findEntity(UUID id) { return goalRepository.findByIdAndUserId(id, authFacade.currentUser().getId()).orElseThrow(() -> new ApiException("Goal not found")); }
}
