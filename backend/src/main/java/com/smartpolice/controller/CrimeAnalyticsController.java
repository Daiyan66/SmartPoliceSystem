package com.smartpolice.controller;

import com.smartpolice.dto.ApiResponse;
import com.smartpolice.dto.CrimeClusterDto;
import com.smartpolice.dto.TemporalTrendDto;
import com.smartpolice.service.CrimeAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
public class CrimeAnalyticsController {

    private final CrimeAnalyticsService crimeAnalyticsService;

    /**
     * Get DBSCAN spatial crime hotspots & clusters with risk ratings
     */
    @GetMapping("/hotspots")
    public ResponseEntity<ApiResponse<List<CrimeClusterDto>>> getHotspots(
            @RequestParam(defaultValue = "500.0") Double epsMeters,
            @RequestParam(defaultValue = "3") Integer minPoints) {

        List<CrimeClusterDto> clusters = crimeAnalyticsService.computeSpatialHotspots(epsMeters, minPoints);
        return ResponseEntity.ok(ApiResponse.ok("Spatial DBSCAN hotspots computed successfully", clusters));
    }

    /**
     * Get temporal incident distribution (Morning vs Afternoon vs Evening vs Night)
     */
    @GetMapping("/temporal-trends")
    public ResponseEntity<ApiResponse<TemporalTrendDto>> getTemporalTrends() {
        TemporalTrendDto trends = crimeAnalyticsService.computeTemporalTrends();
        return ResponseEntity.ok(ApiResponse.ok("Temporal crime analytics retrieved successfully", trends));
    }
}
