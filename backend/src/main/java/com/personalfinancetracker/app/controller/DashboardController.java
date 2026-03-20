package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.service.DashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final DashboardService service;
    public DashboardController(DashboardService service) { this.service = service; }
    @GetMapping("/summary") public Object summary() { return service.summary(); }
    @GetMapping("/recent-transactions") public Object recent() { return service.recentTransactions(); }
    @GetMapping("/upcoming-bills") public Object upcoming() { return service.upcomingBills(); }
    @GetMapping("/budget-overview") public Object budgets() { return service.budgetOverview(); }
    @GetMapping("/goals-overview") public Object goals() { return service.goalsOverview(); }
    @GetMapping("/spending-by-category") public Object spendingByCategory() { return service.spendingByCategory(); }
    @GetMapping("/income-vs-expense-trend") public Object trend() { return service.incomeExpenseTrend(); }
}
