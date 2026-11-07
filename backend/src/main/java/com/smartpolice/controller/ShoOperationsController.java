package com.smartpolice.controller;

import com.smartpolice.dto.*;
import com.smartpolice.entity.User;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.UserPrincipal;
import com.smartpolice.service.ComplaintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sho")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SHO', 'ROLE_DSP_ASP', 'ROLE_SP_SSP', 'ROLE_DIG_DGP', 'ROLE_ADMIN')")
public class ShoOperationsController {

    private final ComplaintService complaintService;
    private final UserRepository userRepository;

    /**
     * Station House Officer queue: all complaints for the officer's police station
     */
    @GetMapping("/station-complaints")
    public ResponseEntity<ApiResponse<List<ComplaintResponse>>> getStationComplaints(
            @RequestParam(required = false, defaultValue = "ALL") String status,
            @RequestParam(required = false) Long stationId,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long targetStationId = stationId != null ? stationId : principal.getStationId();
        if (targetStationId == null) {
            targetStationId = 1L; // Fallback to headquarters station for state admins
        }

        List<ComplaintResponse> list = complaintService.getComplaintsForStation(targetStationId, status);
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Get list of active Sub-Inspectors / ASIs available at this station for case assignment
     */
    @GetMapping("/available-ios")
    public ResponseEntity<ApiResponse<List<User>>> getAvailableIos(
            @RequestParam(required = false) Long stationId,
            @AuthenticationPrincipal UserPrincipal principal) {

        Long targetStationId = stationId != null ? stationId : principal.getStationId();
        if (targetStationId == null) {
            targetStationId = 1L;
        }

        List<User> ios = complaintService.getAvailableIosForStation(targetStationId);
        return ResponseEntity.ok(ApiResponse.ok(ios));
    }

    /**
     * Approve e-Complaint into formal FIR (assigns Crime Register Number)
     */
    @PostMapping("/complaints/{id}/approve")
    public ResponseEntity<ApiResponse<ComplaintResponse>> approveComplaint(
            @PathVariable Long id,
            @RequestBody(required = false) ShoApprovalRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        if (request == null) {
            request = new ShoApprovalRequest();
        }

        User shoUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("SHO officer account not found"));

        ComplaintResponse response = complaintService.approveToFir(id, request, shoUser);
        return ResponseEntity.ok(ApiResponse.ok("e-Complaint approved and formal FIR registered", response));
    }

    /**
     * Reject complaint with mandatory reasoned legal order under BNSS
     */
    @PostMapping("/complaints/{id}/reject")
    public ResponseEntity<ApiResponse<ComplaintResponse>> rejectComplaint(
            @PathVariable Long id,
            @Valid @RequestBody ShoRejectRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User shoUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("SHO officer account not found"));

        ComplaintResponse response = complaintService.rejectComplaint(id, request, shoUser);
        return ResponseEntity.ok(ApiResponse.ok("Complaint rejected with recorded legal justification", response));
    }

    /**
     * Assign an Investigating Officer (SI / ASI) to the FIR
     */
    @PostMapping("/complaints/{id}/assign-io")
    public ResponseEntity<ApiResponse<ComplaintResponse>> assignIo(
            @PathVariable Long id,
            @Valid @RequestBody AssignIoRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User shoUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Officer account not found"));

        ComplaintResponse response = complaintService.assignInvestigatingOfficer(id, request, shoUser);
        return ResponseEntity.ok(ApiResponse.ok("Investigating Officer assigned successfully", response));
    }

    /**
     * Inter-Thana Zero-FIR Transfer routing
     */
    @PostMapping("/complaints/{id}/transfer-zero-fir")
    public ResponseEntity<ApiResponse<ComplaintResponse>> transferZeroFir(
            @PathVariable Long id,
            @Valid @RequestBody ZeroFirTransferRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User officerUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Officer account not found"));

        ComplaintResponse response = complaintService.transferZeroFir(id, request, officerUser);
        return ResponseEntity.ok(ApiResponse.ok("Zero-FIR successfully transferred to jurisdictional Thana", response));
    }
}
