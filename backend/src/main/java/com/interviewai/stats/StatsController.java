package com.interviewai.stats;

import com.interviewai.stats.dto.GamificationDto;
import com.interviewai.stats.dto.OverviewDto;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/stats")
@SecurityRequirement(name = "bearerAuth")
public class StatsController {
    private final StatsService stats;
    private final GamificationService gamification;

    public StatsController(StatsService stats, GamificationService gamification) {
        this.stats = stats;
        this.gamification = gamification;
    }

    @GetMapping("/overview")
    public OverviewDto overview() { return stats.overview(); }

    @GetMapping("/gamification")
    public GamificationDto gamification() { return gamification.gamification(); }
}
