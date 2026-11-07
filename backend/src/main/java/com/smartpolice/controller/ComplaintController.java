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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/complaints")
@RequiredArgsConstructor
public class ComplaintController {

    private final ComplaintService complaintService;
    private final UserRepository userRepository;

    /**
     * File a new e-Complaint / e-FIR / Zero-FIR (Authenticated Citizen or Public Guest)
     */
    @PostMapping
    public ResponseEntity<ApiResponse<ComplaintResponse>> fileComplaint(
            @Valid @RequestBody ComplaintCreateRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User citizen = null;
        if (principal != null) {
            citizen = userRepository.findById(principal.getId()).orElse(null);
        } else if (request.getCitizenPhone() != null && !request.getCitizenPhone().isBlank()) {
            citizen = userRepository.findByPhoneNumber(request.getCitizenPhone().trim()).orElse(null);
        }

        ComplaintResponse response = complaintService.createComplaint(request, citizen);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("e-Complaint filed successfully", response));
    }

    /**
     * Get complaints filed by the currently authenticated citizen
     */
    @GetMapping("/my-complaints")
    public ResponseEntity<ApiResponse<List<ComplaintResponse>>> getMyComplaints(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(ApiResponse.error("Authentication required to view citizen complaints"));
        }
        List<ComplaintResponse> list = complaintService.getComplaintsForCitizen(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(list));
    }

    /**
     * Get complaint details by ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ComplaintResponse>> getComplaintById(@PathVariable Long id) {
        ComplaintResponse response = complaintService.getComplaintById(id);
        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    /**
     * Request 6-digit OTP for IDOR-protected public tracking
     */
    @PostMapping("/track/request-otp")
    public ResponseEntity<ApiResponse<Map<String, Object>>> requestTrackingOtp(
            @Valid @RequestBody GuestTrackOtpRequest request) {
        Map<String, Object> result = complaintService.requestTrackingOtp(request);
        return ResponseEntity.ok(ApiResponse.ok("Verification code dispatched", result));
    }

    /**
     * Verify 6-digit OTP and retrieve verified complaint timeline & status
     */
    @PostMapping("/track/verify-otp")
    public ResponseEntity<ApiResponse<ComplaintResponse>> verifyTrackingOtp(
            @Valid @RequestBody GuestTrackVerifyRequest request) {
        ComplaintResponse response = complaintService.verifyTrackingOtp(request);
        return ResponseEntity.ok(ApiResponse.ok("Tracking identity verified successfully", response));
    }
}
