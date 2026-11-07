package com.smartpolice.controller;

import com.smartpolice.dto.ApiResponse;
import com.smartpolice.entity.PoliceStation;
import com.smartpolice.repository.PoliceStationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final PoliceStationRepository policeStationRepository;

    @GetMapping("/health")
    public ResponseEntity<ApiResponse<Map<String, Object>>> healthCheck() {
        Map<String, Object> status = new HashMap<>();
        status.put("service", "Smart Police System Backend");
        status.put("version", "1.0.0");
        status.put("legalFramework", "BNS (2023), BNSS (2023), BSA (2023), CCTNS Aligned");
        status.put("status", "OPERATIONAL");
        status.put("securityPolicy", "Zero-Trust Stateless JWT RBAC");

        return ResponseEntity.ok(ApiResponse.ok(status));
    }

    @GetMapping("/stations")
    public ResponseEntity<ApiResponse<List<PoliceStation>>> getPoliceStations() {
        List<PoliceStation> stations = policeStationRepository.findByIsActiveTrue();
        return ResponseEntity.ok(ApiResponse.ok(stations));
    }
}
