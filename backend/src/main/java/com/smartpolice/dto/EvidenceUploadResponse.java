package com.smartpolice.dto;

import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EvidenceUploadResponse {
    private Long evidenceId;
    private Long complaintId;
    private String fileName;
    private String fileUrl;
    private Long fileSizeBytes;
    private String mimeType;
    private String sha256Hash;
    private Boolean isExifStripped;
    private String uploadedBy;
    private LocalDateTime createdAt;
    private String message;
}
