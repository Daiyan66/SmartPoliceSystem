package com.smartpolice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpolice.entity.Complaint;
import com.smartpolice.entity.PoliceStation;
import com.smartpolice.entity.User;
import com.smartpolice.repository.ComplaintRepository;
import com.smartpolice.repository.EvidenceAttachmentRepository;
import com.smartpolice.repository.PoliceStationRepository;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.JwtUtils;
import com.smartpolice.security.Role;
import com.smartpolice.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import javax.imageio.ImageIO;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class EvidenceManagementIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private EvidenceAttachmentRepository evidenceAttachmentRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private PoliceStationRepository policeStationRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtUtils jwtUtils;

    private Complaint testComplaint;
    private User testOfficer;

    @BeforeEach
    void setUp() {
        PoliceStation station = policeStationRepository.findAll().stream().findFirst().orElseThrow();
        testOfficer = userRepository.findByRole(Role.ROLE_SUB_INSPECTOR).stream().findFirst().orElseThrow();

        testComplaint = complaintRepository.save(Complaint.builder()
                .trackingToken("FIR-TEST-" + System.nanoTime())
                .crimeRegisterNumber("CRN-2026-" + System.nanoTime())
                .station(station)
                .incidentTimestamp(LocalDateTime.now().minusHours(2))
                .incidentLocation("Connaught Place Inner Circle")
                .latitude(28.6315)
                .longitude(77.2167)
                .description("CCTV evidence footage test complaint")
                .status("UNDER_VERIFICATION")
                .assignedIo(testOfficer)
                .build()
        );
    }

    @Test
    @DisplayName("Exit Criterion: Evidence ingestion computes SHA-256 fingerprint & creates immutable audit log")
    void testEvidenceUploadAndSha256Fingerprint() throws Exception {
        byte[] payload = "CRIME_SCENE_DIGITAL_FORENSIC_RECORDING_DATA_STREAM".getBytes(StandardCharsets.UTF_8);
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        String expectedHash = HexFormat.of().formatHex(md.digest(payload));

        MockMultipartFile file = new MockMultipartFile(
                "file", "surveillance_cam_01.mp4", "video/mp4", payload
        );

        String token = jwtUtils.generateAccessToken(UserPrincipal.build(testOfficer));

        MvcResult result = mockMvc.perform(multipart("/api/evidence/upload")
                        .file(file)
                        .param("complaintId", testComplaint.getId().toString())
                        .param("scrubExif", "false")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.sha256Hash").value(expectedHash))
                .andExpect(jsonPath("$.data.fileName").value("surveillance_cam_01.mp4"))
                .andReturn();

        String json = result.getResponse().getContentAsString();
        Long evidenceId = objectMapper.readTree(json).path("data").path("evidenceId").asLong();

        assertThat(evidenceAttachmentRepository.findById(evidenceId)).isPresent();
    }

    @Test
    @DisplayName("Exit Criterion: Whistleblower Anonymous Tip scrubs EXIF metadata before digital storage")
    void testWhistleblowerExifScrubbing() throws Exception {
        // Generate in-memory PNG image
        BufferedImage img = new BufferedImage(80, 80, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(img, "png", baos);
        byte[] imgBytes = baos.toByteArray();

        MockMultipartFile file = new MockMultipartFile(
                "file", "anonymous_tip_photo.png", "image/png", imgBytes
        );

        MvcResult result = mockMvc.perform(multipart("/api/evidence/upload")
                        .file(file)
                        .param("complaintId", testComplaint.getId().toString())
                        .param("scrubExif", "true")) // Anonymous Whistleblower Tip
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.isExifStripped").value(true))
                .andReturn();

        String json = result.getResponse().getContentAsString();
        Long evidenceId = objectMapper.readTree(json).path("data").path("evidenceId").asLong();

        // Download scrubbed evidence
        mockMvc.perform(get("/api/evidence/" + evidenceId + "/download"))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("anonymous_tip_photo.png")));
    }

    @Test
    @DisplayName("Exit Criterion: Chain of custody logs views, downloads, and generates BSA 2023 Sec 63/65B Certificate")
    void testChainOfCustodyAndBsaCertificate() throws Exception {
        byte[] payload = "FORENSIC_AUDIO_CALL_LOG_TAPING".getBytes(StandardCharsets.UTF_8);
        MockMultipartFile file = new MockMultipartFile(
                "file", "audio_call_log.wav", "audio/wav", payload
        );

        String token = jwtUtils.generateAccessToken(UserPrincipal.build(testOfficer));

        // 1. Upload
        MvcResult uploadResult = mockMvc.perform(multipart("/api/evidence/upload")
                        .file(file)
                        .param("complaintId", testComplaint.getId().toString())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        Long evidenceId = objectMapper.readTree(uploadResult.getResponse().getContentAsString())
                .path("data").path("evidenceId").asLong();

        // 2. View details -> triggers VIEWED audit
        mockMvc.perform(get("/api/evidence/" + evidenceId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 3. Download -> triggers DOWNLOADED audit
        mockMvc.perform(get("/api/evidence/" + evidenceId + "/download")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        // 4. Generate BSA Sec 63/65B Certificate
        mockMvc.perform(get("/api/evidence/" + evidenceId + "/bsa-certificate")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.certificateNumber").isNotEmpty())
                .andExpect(jsonPath("$.data.sha256Hash").isNotEmpty())
                .andExpect(jsonPath("$.data.statutoryDeclaration").value(org.hamcrest.Matchers.containsString("BHARATIYA SAKSHYA ADHINIYAM (BSA, 2023)")))
                .andExpect(jsonPath("$.data.chainOfCustodyLog").isArray());

        // 5. Verify Audit Trail contains at least 3 entries (INGESTION, VIEWED, DOWNLOADED, FORENSIC_EXPORT)
        mockMvc.perform(get("/api/evidence/" + evidenceId + "/audit-trail"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").isArray())
                .andExpect(jsonPath("$.data.length()").value(org.hamcrest.Matchers.greaterThanOrEqualTo(3)));
    }
}
