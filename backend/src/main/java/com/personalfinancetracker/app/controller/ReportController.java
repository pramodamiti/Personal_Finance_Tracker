package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.service.ReportService;
import java.time.LocalDate;
import org.springframework.core.io.InputStreamResource;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService service;
    public ReportController(ReportService service) { this.service = service; }
    @GetMapping("/category-spend") public Object category(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) { return service.categorySpend(from, to); }
    @GetMapping("/income-vs-expense") public Object incomeExpense(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) { return service.incomeVsExpense(from, to); }
    @GetMapping("/account-balance-trend") public Object balanceTrend(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) { return service.accountBalanceTrend(from, to); }
    @GetMapping("/savings-progress") public Object savingsProgress() { return service.savingsProgress(); }
    @GetMapping("/trends") public Object trends(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) { return service.trends(from, to); }
    @GetMapping("/net-worth") public Object netWorth() { return service.netWorth(); }
    @GetMapping("/export/csv") public ResponseEntity<InputStreamResource> export(@RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from, @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) { return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=transactions.csv").contentType(MediaType.parseMediaType("text/csv")).body(new InputStreamResource(service.exportCsv(from, to))); }
}
