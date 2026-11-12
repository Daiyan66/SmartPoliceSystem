package com.smartpolice.controller;

import com.smartpolice.dto.ApiResponse;
import com.smartpolice.dto.IcjsDocketResponse;
import com.smartpolice.service.IcjsIntegrationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/icjs")
@RequiredArgsConstructor
public class IcjsController {

    private final IcjsIntegrationService icjsIntegrationService;

    /**
     * Get the 5-Pillar ICJS & CCTNS Interoperability Docket for a specific FIR/Complaint
     */
    @GetMapping("/dockets/{complaintId}")
    public ResponseEntity<ApiResponse<IcjsDocketResponse>> getDocket(@PathVariable Long complaintId) {
        IcjsDocketResponse docket = icjsIntegrationService.getDocketForComplaint(complaintId);
        return ResponseEntity.ok(ApiResponse.ok("ICJS interoperability docket retrieved successfully", docket));
    }

    /**
     * Trigger live CCTNS & ICJS State-National synchronization for a case
     */
    @PostMapping("/sync/{complaintId}")
    public ResponseEntity<ApiResponse<IcjsDocketResponse>> syncCaseWithCctns(@PathVariable Long complaintId) {
        IcjsDocketResponse docket = icjsIntegrationService.syncComplaintWithCctns(complaintId);
        return ResponseEntity.ok(ApiResponse.ok("Case synchronized with CCTNS Core & ICJS network", docket));
    }

    /**
     * Get national & state ICJS interoperability statistics and health status
     */
    @GetMapping("/statistics")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getNationalStatistics() {
        Map<String, Object> stats = icjsIntegrationService.getNationalStatistics();
        return ResponseEntity.ok(ApiResponse.ok("ICJS national pipeline statistics", stats));
    }
}
