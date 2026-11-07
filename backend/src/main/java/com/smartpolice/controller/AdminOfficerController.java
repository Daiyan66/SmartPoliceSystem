package com.smartpolice.controller;

import com.smartpolice.dto.ApiResponse;
import com.smartpolice.dto.OfficerProvisionRequest;
import com.smartpolice.entity.User;
import com.smartpolice.service.OfficerProvisioningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/officers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyAuthority('ROLE_SP_SSP', 'ROLE_DIG_DGP', 'ROLE_ADMIN')")
public class AdminOfficerController {

    private final OfficerProvisioningService officerProvisioningService;

    @PostMapping("/provision")
    public ResponseEntity<ApiResponse<User>> provisionOfficer(@Valid @RequestBody OfficerProvisionRequest request) {
        User officer = officerProvisioningService.provisionOfficer(request);
        return ResponseEntity.ok(ApiResponse.ok("Officer provisioned successfully with badge: " + officer.getBadgeNumber(), officer));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<User>>> listAllOfficers() {
        List<User> officers = officerProvisioningService.listAllOfficers();
        return ResponseEntity.ok(ApiResponse.ok(officers));
    }

    @GetMapping("/station/{stationId}")
    public ResponseEntity<ApiResponse<List<User>>> listOfficersByStation(@PathVariable Long stationId) {
        List<User> officers = officerProvisioningService.listOfficersByStation(stationId);
        return ResponseEntity.ok(ApiResponse.ok(officers));
    }
}
