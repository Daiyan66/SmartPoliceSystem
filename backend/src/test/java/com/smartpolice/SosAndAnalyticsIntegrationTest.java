package com.smartpolice;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartpolice.dto.*;
import com.smartpolice.entity.Complaint;
import com.smartpolice.entity.PoliceStation;
import com.smartpolice.entity.User;
import com.smartpolice.repository.ComplaintRepository;
import com.smartpolice.repository.PoliceStationRepository;
import com.smartpolice.repository.SosAlertRepository;
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
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class SosAndAnalyticsIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PoliceStationRepository policeStationRepository;

    @Autowired
    private SosAlertRepository sosAlertRepository;

    @Autowired
    private ComplaintRepository complaintRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    private PoliceStation testStation;
    private User testOfficer;
    private String officerToken;

    @BeforeEach
    void setUp() {
        long seed = System.nanoTime();

        testStation = policeStationRepository.save(PoliceStation.builder()
                .stationCode("PS-DL-SOS-" + seed)
                .stationName("Connaught Place Emergency PS " + seed)
                .district("New Delhi")
                .state("Delhi")
                .latitude(28.6315)
                .longitude(77.2167)
                .contactNumber("+91-11-23340001")
                .inChargeName("Inspector Emergency SHO")
                .isActive(true)
                .build());

        testOfficer = userRepository.save(User.builder()
                .phoneNumber("98761" + (seed % 100000))
                .email("officer." + seed + "@police.gov.in")
                .badgeNumber("PCR-" + seed)
                .fullName("ASI Satish Chandra")
                .role(Role.ROLE_ASI)
                .rankDesignation("Assistant Sub-Inspector / PCR In-Charge")
                .station(testStation)
                .passwordHash(passwordEncoder.encode("Test@123"))
                .isActive(true)
                .build());

        officerToken = jwtUtils.generateAccessToken(UserPrincipal.build(testOfficer));
    }

    @Test
    @DisplayName("SOS Trigger -> Nearest Thana Auto-Resolution -> Officer Dispatch & Resolution")
    void testSosEmergencyLifecycle() throws Exception {
        // 1. Trigger SOS beacon near Connaught Place (approx 200m away)
        SosTriggerRequest triggerReq = SosTriggerRequest.builder()
                .latitude(28.6325)
                .longitude(77.2175)
                .phoneNumber("9811998877")
                .notes("Emergency: Followed by suspicious persons near metro exit.")
                .deviceFingerprint("device-fingerprint-test-xyz")
                .build();

        MvcResult triggerResult = mockMvc.perform(post("/api/sos/trigger")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(triggerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.alertToken").exists())
                .andExpect(jsonPath("$.data.assignedStationId").exists())
                .andExpect(jsonPath("$.data.status").value("ACTIVE"))
                .andReturn();

        SosAlertResponse alertResponse = objectMapper.readValue(
                objectMapper.readTree(triggerResult.getResponse().getContentAsString()).get("data").toString(),
                SosAlertResponse.class
        );

        Long alertId = alertResponse.getId();
        assertTrue(alertResponse.getAlertToken().startsWith("SOS-"));
        assertNotNull(alertResponse.getDistanceKm());

        // 2. Station Officer Acknowledges SOS Alert
        mockMvc.perform(post("/api/sos/" + alertId + "/acknowledge")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("ACKNOWLEDGED"));

        // 3. Officer Dispatches PCR Patrol Van
        mockMvc.perform(post("/api/sos/" + alertId + "/dispatch")
                        .param("patrolUnit", "PCR-Van-04 CP")
                        .header("Authorization", "Bearer " + officerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("PATROL_DISPATCHED"))
                .andExpect(jsonPath("$.data.dispatchedPatrolUnit").value("PCR-Van-04 CP"));

        // 4. Officer Resolves Emergency
        SosStatusUpdateRequest resolveReq = SosStatusUpdateRequest.builder()
                .status("RESOLVED")
                .dispatchedPatrolUnit("PCR-Van-04 CP")
                .notes("Patrol unit reached victim in 3 minutes. Suspects deterred. Victim safely escorted home.")
                .build();

        mockMvc.perform(post("/api/sos/" + alertId + "/resolve")
                        .header("Authorization", "Bearer " + officerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(resolveReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.status").value("RESOLVED"));
    }

    @Test
    @DisplayName("DBSCAN Spatial Hotspot Clustering & Temporal Trends Analytics")
    void testSpatialDBSCANClusteringAndTemporalTrends() throws Exception {
        long seed = System.nanoTime();

        // Seed 4 tightly clustered crime complaints within 100 meters of each other
        double baseLat = 28.6315;
        double baseLon = 77.2167;

        for (int i = 0; i < 4; i++) {
            complaintRepository.save(Complaint.builder()
                    .trackingToken("FIR-CLUSTER-" + seed + "-" + i)
                    .station(testStation)
                    .latitude(baseLat + (i * 0.0003)) // ~30m apart
                    .longitude(baseLon + (i * 0.0003))
                    .incidentLocation("CP Block C Inner Circle " + i)
                    .incidentTimestamp(LocalDateTime.now().minusHours(i * 2))
                    .description("Snatching incident reported in commercial market")
                    .bnsSections("BNS 304, BNS 303")
                    .aiPredictedCategory("SNATCHING")
                    .aiConfidenceScore(0.94)
                    .status("INVESTIGATION_IN_PROGRESS")
                    .build());
        }

        // 1. Query DBSCAN Hotspots (eps: 500m, minPoints: 3)
        MvcResult hotspotResult = mockMvc.perform(get("/api/analytics/hotspots")
                        .param("epsMeters", "500.0")
                        .param("minPoints", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").isArray())
                .andReturn();

        String content = hotspotResult.getResponse().getContentAsString();
        assertTrue(content.contains("centroidLatitude"));
        assertTrue(content.contains("incidentCount"));

        // 2. Query Temporal Trends Analytics
        mockMvc.perform(get("/api/analytics/temporal-trends"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.totalIncidents").isNumber())
                .andExpect(jsonPath("$.data.dayOfWeekDistribution").isMap())
                .andExpect(jsonPath("$.data.categoryDistribution").isMap());
    }
}
