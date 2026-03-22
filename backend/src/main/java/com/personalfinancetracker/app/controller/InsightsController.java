package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.service.InsightsService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/insights")
public class InsightsController {
    private final InsightsService service;

    public InsightsController(InsightsService service) {
        this.service = service;
    }

    @GetMapping
    public Object insights() {
        return service.insights();
    }

    @GetMapping("/health-score")
    public Object healthScore() {
        return service.healthScore();
    }
}
