package com.smartpolice.controller;

import com.smartpolice.dto.ApiResponse;
import com.smartpolice.dto.CaseDiaryEntryRequest;
import com.smartpolice.dto.CaseDiaryResponse;
import com.smartpolice.dto.ChargesheetDto;
import com.smartpolice.dto.ComplaintResponse;
import com.smartpolice.entity.User;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.UserPrincipal;
import com.smartpolice.service.CaseDiaryService;
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
@RequestMapping("/api/investigation")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SUB_INSPECTOR', 'ROLE_ASI', 'ROLE_SHO', 'ROLE_DSP_ASP', 'ROLE_SP_SSP', 'ROLE_ADMIN')")
public class InvestigationController {

    private final CaseDiaryService caseDiaryService;
    private final ComplaintService complaintService;
    private final UserRepository userRepository;

    /**
     * Get all active cases assigned to the current Investigating Officer
     */
    @GetMapping("/my-cases")
    public ResponseEntity<ApiResponse<List<ComplaintResponse>>> getMyAssignedCases(
            @AuthenticationPrincipal UserPrincipal principal) {
        List<ComplaintResponse> cases = complaintService.getComplaintsForIo(principal.getId());
        return ResponseEntity.ok(ApiResponse.ok(cases));
    }

    /**
     * Get chronological Case Diary (CD) entries for a specific case
     */
    @GetMapping("/cases/{complaintId}/case-diaries")
    public ResponseEntity<ApiResponse<List<CaseDiaryResponse>>> getCaseDiaries(
            @PathVariable Long complaintId) {
        List<CaseDiaryResponse> entries = caseDiaryService.getCaseDiaries(complaintId);
        return ResponseEntity.ok(ApiResponse.ok(entries));
    }

    /**
     * Record a new daily Case Diary entry under BNSS 2023 / CCTNS standards
     */
    @PostMapping("/cases/{complaintId}/case-diaries")
    public ResponseEntity<ApiResponse<CaseDiaryResponse>> addCaseDiaryEntry(
            @PathVariable Long complaintId,
            @Valid @RequestBody CaseDiaryEntryRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {

        User ioUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Investigating officer account not found"));

        CaseDiaryResponse response = caseDiaryService.addCaseDiaryEntry(complaintId, request, ioUser);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.ok("Case Diary entry successfully recorded", response));
    }

    /**
     * Preview / Compile Draft Final Report / Chargesheet (Form 5 U/S 193 BNSS 2023)
     */
    @GetMapping("/cases/{complaintId}/chargesheet")
    public ResponseEntity<ApiResponse<ChargesheetDto>> getChargesheetDraft(
            @PathVariable Long complaintId) {
        ChargesheetDto chargesheet = caseDiaryService.generateChargesheet(complaintId);
        return ResponseEntity.ok(ApiResponse.ok(chargesheet));
    }

    /**
     * Formally submit Final Report / Chargesheet to Learned Judicial Magistrate
     */
    @PostMapping("/cases/{complaintId}/chargesheet/submit")
    public ResponseEntity<ApiResponse<ChargesheetDto>> submitChargesheet(
            @PathVariable Long complaintId,
            @AuthenticationPrincipal UserPrincipal principal) {

        User ioUser = userRepository.findById(principal.getId())
                .orElseThrow(() -> new IllegalArgumentException("Investigating officer account not found"));

        ChargesheetDto chargesheet = caseDiaryService.submitChargesheet(complaintId, ioUser);
        return ResponseEntity.ok(ApiResponse.ok("Chargesheet formally submitted to Magistrate Court", chargesheet));
    }
}
