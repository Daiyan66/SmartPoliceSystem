package com.smartpolice.controller;

import com.smartpolice.dto.ApiResponse;
import com.smartpolice.dto.BsaCertificateDto;
import com.smartpolice.dto.EvidenceAuditTrailDto;
import com.smartpolice.dto.EvidenceUploadResponse;
import com.smartpolice.entity.EvidenceAttachment;
import com.smartpolice.entity.EvidenceAuditTrail;
import com.smartpolice.entity.User;
import com.smartpolice.repository.EvidenceAttachmentRepository;
import com.smartpolice.repository.EvidenceAuditTrailRepository;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.UserPrincipal;
import com.smartpolice.service.BsaCertificateService;
import com.smartpolice.service.EvidenceStorageService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/evidence")
@RequiredArgsConstructor
public class EvidenceController {

    private final EvidenceStorageService evidenceStorageService;
    private final BsaCertificateService bsaCertificateService;
    private final EvidenceAttachmentRepository evidenceAttachmentRepository;
    private final EvidenceAuditTrailRepository evidenceAuditTrailRepository;
    private final UserRepository userRepository;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<EvidenceUploadResponse>> uploadEvidence(
            @RequestParam("file") MultipartFile file,
            @RequestParam("complaintId") Long complaintId,
            @RequestParam(value = "scrubExif", defaultValue = "false") boolean scrubExif,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        String clientIp = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        Long uploaderId = principal != null ? principal.getId() : null;

        EvidenceAttachment saved = evidenceStorageService.storeEvidence(
                file, complaintId, uploaderId, scrubExif, clientIp, userAgent
        );

        EvidenceUploadResponse response = EvidenceUploadResponse.builder()
                .evidenceId(saved.getId())
                .complaintId(complaintId)
                .fileName(saved.getFileName())
                .fileUrl(saved.getFileUrl())
                .fileSizeBytes(saved.getFileSizeBytes())
                .mimeType(saved.getMimeType())
                .sha256Hash(saved.getSha256Hash())
                .isExifStripped(saved.getIsExifStripped())
                .uploadedBy(principal != null ? principal.getFullName() : "Anonymous Whistleblower")
                .createdAt(saved.getCreatedAt())
                .message("Digital evidence ingested with SHA-256 cryptographic fingerprint under BSA (2023).")
                .build();

        return ResponseEntity.ok(ApiResponse.ok(response));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<EvidenceAttachment>> getEvidenceDetails(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        EvidenceAttachment evidence = evidenceAttachmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found with ID: " + id));

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        evidenceStorageService.logAudit(evidence, user, "VIEWED", extractClientIp(request), request.getHeader("User-Agent"));

        return ResponseEntity.ok(ApiResponse.ok(evidence));
    }

    @GetMapping("/{id}/download")
    public ResponseEntity<Resource> downloadEvidence(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        String clientIp = extractClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        Resource resource = evidenceStorageService.loadEvidenceAsResource(id, user, clientIp, userAgent, "DOWNLOADED");
        EvidenceAttachment evidence = evidenceAttachmentRepository.findById(id).orElseThrow();

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(evidence.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + evidence.getFileName() + "\"")
                .body(resource);
    }

    @GetMapping("/{id}/audit-trail")
    public ResponseEntity<ApiResponse<List<EvidenceAuditTrailDto>>> getAuditTrail(@PathVariable Long id) {
        List<EvidenceAuditTrail> logs = evidenceAuditTrailRepository.findByEvidenceIdOrderByTimestampDesc(id);
        List<EvidenceAuditTrailDto> dtos = logs.stream().map(l ->
                EvidenceAuditTrailDto.builder()
                        .id(l.getId())
                        .actionType(l.getActionType())
                        .accessedBy(l.getAccessedByUser() != null ? l.getAccessedByUser().getFullName() : "Anonymous / System")
                        .badgeNumber(l.getAccessedByUser() != null ? l.getAccessedByUser().getBadgeNumber() : "N/A")
                        .ipAddress(l.getIpAddress())
                        .timestamp(l.getTimestamp())
                        .build()
        ).toList();

        return ResponseEntity.ok(ApiResponse.ok(dtos));
    }

    @GetMapping("/{id}/bsa-certificate")
    public ResponseEntity<ApiResponse<BsaCertificateDto>> getBsaCertificate(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest request) {

        User user = principal != null ? userRepository.findById(principal.getId()).orElse(null) : null;
        BsaCertificateDto cert = bsaCertificateService.generateCertificate(
                id, user, extractClientIp(request), request.getHeader("User-Agent")
        );

        return ResponseEntity.ok(ApiResponse.ok("BSA (2023) Section 63/65B Certificate generated", cert));
    }

    @GetMapping("/complaint/{complaintId}")
    public ResponseEntity<ApiResponse<List<EvidenceAttachment>>> getComplaintEvidence(@PathVariable Long complaintId) {
        List<EvidenceAttachment> attachments = evidenceAttachmentRepository.findByComplaintId(complaintId);
        return ResponseEntity.ok(ApiResponse.ok(attachments));
    }

    private String extractClientIp(HttpServletRequest request) {
        String xfHeader = request.getHeader("X-Forwarded-For");
        if (xfHeader == null || xfHeader.isEmpty() || "unknown".equalsIgnoreCase(xfHeader)) {
            return request.getRemoteAddr();
        }
        return xfHeader.split(",")[0].trim();
    }
}
