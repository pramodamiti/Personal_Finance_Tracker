package com.personalfinancetracker.app.controller;

import com.personalfinancetracker.app.service.ForecastService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/forecast")
public class ForecastController {
    private final ForecastService service;

    public ForecastController(ForecastService service) {
        this.service = service;
    }

    @GetMapping("/month")
    public Object month() {
        return service.monthForecast();
    }

    @GetMapping("/daily")
    public Object daily() {
        return service.dailyForecast();
    }
}
