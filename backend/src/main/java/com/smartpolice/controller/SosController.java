package com.smartpolice.controller;

import com.smartpolice.dto.ApiResponse;
import com.smartpolice.dto.SosAlertResponse;
import com.smartpolice.dto.SosStatusUpdateRequest;
import com.smartpolice.dto.SosTriggerRequest;
import com.smartpolice.entity.User;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.UserPrincipal;
import com.smartpolice.service.SosDispatchService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sos")
@RequiredArgsConstructor
public class SosController {

    private final SosDispatchService sosDispatchService;
    private final UserRepository userRepository;

    /**
     * Trigger high-priority emergency SOS distress beacon (Public / Authenticated)
     */
    @PostMapping("/trigger")
    public ResponseEntity<ApiResponse<SosAlertResponse>> triggerSos(
            @Valid @RequestBody SosTriggerRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User sender = null;
        if (principal != null) {
            sender = userRepository.findById(principal.getId()).orElse(null);
        }

        SosAlertResponse response = sosDispatchService.triggerSos(request, sender);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("EMERGENCY DISTRESS BEACON ACTIVATED. Dispatching nearest patrol unit.", response));
    }

    /**
     * Get all currently active emergency SOS distress alerts
     */
    @GetMapping("/active")
    public ResponseEntity<ApiResponse<List<SosAlertResponse>>> getActiveAlerts() {
        List<SosAlertResponse> list = sosDispatchService.getActiveAlerts();
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Get alerts for a specific police station
     */
    @GetMapping("/station/{stationId}")
    public ResponseEntity<ApiResponse<List<SosAlertResponse>>> getStationAlerts(@PathVariable Long stationId) {
        List<SosAlertResponse> list = sosDispatchService.getAlertsForStation(stationId);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Get SOS alert details by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SosAlertResponse>> getAlertById(@PathVariable Long id) {
        SosAlertResponse response = sosDispatchService.getAlertById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Track distress status by alert token (e.g. SOS-2026-X89J2K)
     */
    @GetMapping("/token/{alertToken}")
    public ResponseEntity<ApiResponse<SosAlertResponse>> getAlertByToken(@PathVariable String alertToken) {
        SosAlertResponse response = sosDispatchService.getAlertByToken(alertToken);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Station Officer acknowledges SOS beacon
     */
    @PostMapping("/{id}/acknowledge")
    public ResponseEntity<ApiResponse<SosAlertResponse>> acknowledgeAlert(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {

        User officer = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Officer account not found"));

        SosAlertResponse response = sosDispatchService.acknowledgeAlert(id, officer);
        return ResponseEntity.ok(ApiResponse.ok("SOS alert acknowledged by duty officer", response));
    }

    /**
     * Dispatch PCR Patrol Van / Unit to the victim location
     */
    @PostMapping("/{id}/dispatch")
    public ResponseEntity<ApiResponse<SosAlertResponse>> dispatchPatrol(
            @PathVariable Long id,
            @RequestParam(defaultValue = "PCR-Van-01") String patrolUnit,
            @AuthenticationPrincipal UserPrincipal principal) {

        User officer = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Officer account not found"));

        SosAlertResponse response = sosDispatchService.dispatchPatrol(id, patrolUnit, officer);
        return ResponseEntity.ok(ApiResponse.ok("Patrol unit dispatched to emergency location", response));
    }

    /**
     * Resolve SOS distress emergency
     */
    @PostMapping("/{id}/resolve")
    public ResponseEntity<ApiResponse<SosAlertResponse>> resolveAlert(
            @PathVariable Long id,
            @RequestBody(required = false) SosStatusUpdateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User officer = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Officer account not found"));

        if (request == null) {
            request = new SosStatusUpdateRequest("RESOLVED", null, "Emergency situation stabilized and resolved.");
        }

        SosAlertResponse response = sosDispatchService.resolveAlert(id, request, officer);
        return ResponseEntity.ok(ApiResponse.ok("Emergency event marked resolved", response));
    }
}
