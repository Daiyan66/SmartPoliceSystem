package com.smartpolice.service;

import com.smartpolice.entity.Complaint;
import com.smartpolice.entity.EvidenceAttachment;
import com.smartpolice.entity.EvidenceAuditTrail;
import com.smartpolice.entity.User;
import com.smartpolice.repository.ComplaintRepository;
import com.smartpolice.repository.EvidenceAttachmentRepository;
import com.smartpolice.repository.EvidenceAuditTrailRepository;
import com.smartpolice.repository.UserRepository;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.*;
import java.net.MalformedURLException;
import java.nio.file.*;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EvidenceStorageService {

    private static final Logger log = LoggerFactory.getLogger(EvidenceStorageService.class);

    @Value("${smartpolice.evidence.storage-dir:uploads/evidence}")
    private String storageDir;

    private final EvidenceAttachmentRepository evidenceAttachmentRepository;
    private final EvidenceAuditTrailRepository evidenceAuditTrailRepository;
    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;

    private Path rootStoragePath;

    @PostConstruct
    public void init() {
        try {
            rootStoragePath = Paths.get(storageDir).toAbsolutePath().normalize();
            Files.createDirectories(rootStoragePath);
            log.info("Digital Evidence Management Storage initialized at: {}", rootStoragePath);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize storage directory: " + e.getMessage(), e);
        }
    }

    /**
     * Ingest evidence via streaming to prevent JVM heap memory exhaustion.
     * Computes SHA-256 fingerprint on the fly and optionally scrubs EXIF metadata.
     */
    @Transactional
    public EvidenceAttachment storeEvidence(MultipartFile file, Long complaintId, Long uploaderUserId,
                                           boolean scrubExif, String clientIp, String userAgent) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Cannot store empty evidence file.");
        }

        Complaint complaint = complaintRepository.findById(complaintId)
                .orElseThrow(() -> new IllegalArgumentException("Complaint not found with ID: " + complaintId));

        User uploader = uploaderUserId != null ? userRepository.findById(uploaderUserId).orElse(null) : null;

        String originalFilename = Paths.get(file.getOriginalFilename() != null ? file.getOriginalFilename() : "evidence_file")
                .getFileName().toString();

        String fileExtension = getFileExtension(originalFilename);
        String uniqueStoredName = UUID.randomUUID().toString() + (fileExtension.isEmpty() ? "" : "." + fileExtension);
        Path targetPath = rootStoragePath.resolve(uniqueStoredName);

        String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        boolean isImage = mimeType.startsWith("image/");
        boolean exifStripped = false;
        String sha256Hash;
        long finalFileSize;

        try {
            if (scrubExif && isImage) {
                // Whistleblower Privacy Engine: Strip all EXIF / GPS tags by re-rendering raw raster image
                log.info("Applying EXIF metadata scrub for anonymous evidence file: {}", originalFilename);
                BufferedImage rawImage = ImageIO.read(file.getInputStream());
                if (rawImage != null) {
                    ByteArrayOutputStream cleanBaos = new ByteArrayOutputStream();
                    String format = fileExtension.isEmpty() ? "png" : fileExtension.toLowerCase();
                    if (!ImageIO.write(rawImage, format, cleanBaos)) {
                        // Fallback to png if format writer not found
                        ImageIO.write(rawImage, "png", cleanBaos);
                    }
                    byte[] cleanBytes = cleanBaos.toByteArray();

                    // Calculate hash and save scrubbed file
                    MessageDigest md = MessageDigest.getInstance("SHA-256");
                    byte[] digest = md.digest(cleanBytes);
                    sha256Hash = HexFormat.of().formatHex(digest);
                    Files.write(targetPath, cleanBytes);
                    finalFileSize = cleanBytes.length;
                    exifStripped = true;
                } else {
                    // Fallback to streaming if not a standard decodable raster
                    sha256Hash = streamToFileAndHash(file.getInputStream(), targetPath);
                    finalFileSize = Files.size(targetPath);
                }
            } else {
                // Streaming upload directly to storage with SHA-256 calculation (No RAM spike)
                sha256Hash = streamToFileAndHash(file.getInputStream(), targetPath);
                finalFileSize = Files.size(targetPath);
            }

            EvidenceAttachment evidence = EvidenceAttachment.builder()
                    .complaint(complaint)
                    .fileName(originalFilename)
                    .fileUrl(uniqueStoredName)
                    .fileSizeBytes(finalFileSize)
                    .mimeType(mimeType)
                    .sha256Hash(sha256Hash)
                    .isExifStripped(exifStripped)
                    .uploadedByUser(uploader)
                    .build();

            EvidenceAttachment savedEvidence = evidenceAttachmentRepository.save(evidence);

            // Log initial Ingestion audit trail
            logAudit(savedEvidence, uploader, "INGESTION_STORED", clientIp, userAgent);

            log.info("Digital Evidence #{} stored successfully. SHA-256: {}", savedEvidence.getId(), sha256Hash);
            return savedEvidence;

        } catch (IOException | NoSuchAlgorithmException e) {
            log.error("Evidence storage failed: {}", e.getMessage());
            throw new RuntimeException("Failed to store digital evidence: " + e.getMessage(), e);
        }
    }

    /**
     * Streams input stream to disk through a DigestInputStream.
     * Computes SHA-256 with 0 RAM spike.
     */
    private String streamToFileAndHash(InputStream inputStream, Path targetPath)
            throws IOException, NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        try (DigestInputStream dis = new DigestInputStream(inputStream, md);
             OutputStream os = Files.newOutputStream(targetPath, StandardOpenOption.CREATE, StandardOpenOption.WRITE)) {
            byte[] buffer = new byte[8192];
            int read;
            while ((read = dis.read(buffer)) != -1) {
                os.write(buffer, 0, read);
            }
        }
        return HexFormat.of().formatHex(md.digest());
    }

    @Transactional
    public Resource loadEvidenceAsResource(Long evidenceId, User user, String clientIp, String userAgent, String actionType) {
        EvidenceAttachment evidence = evidenceAttachmentRepository.findById(evidenceId)
                .orElseThrow(() -> new IllegalArgumentException("Evidence not found with ID: " + evidenceId));

        try {
            Path filePath = rootStoragePath.resolve(evidence.getFileUrl()).normalize();
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                // Log immutable chain of custody record
                logAudit(evidence, user, actionType != null ? actionType : "DOWNLOADED", clientIp, userAgent);
                return resource;
            } else {
                throw new IllegalStateException("Evidence file not found on disk: " + evidence.getFileUrl());
            }
        } catch (MalformedURLException e) {
            throw new RuntimeException("File path error: " + e.getMessage(), e);
        }
    }

    @Transactional
    public void logAudit(EvidenceAttachment evidence, User user, String actionType, String clientIp, String userAgent) {
        EvidenceAuditTrail audit = EvidenceAuditTrail.builder()
                .evidence(evidence)
                .accessedByUser(user)
                .actionType(actionType)
                .ipAddress(clientIp != null ? clientIp : "127.0.0.1")
                .userAgent(userAgent != null ? (userAgent.length() > 250 ? userAgent.substring(0, 250) : userAgent) : "Unknown")
                .build();
        evidenceAuditTrailRepository.save(audit);
    }

    private String getFileExtension(String filename) {
        int idx = filename.lastIndexOf('.');
        return idx > 0 ? filename.substring(idx + 1) : "";
    }
}
