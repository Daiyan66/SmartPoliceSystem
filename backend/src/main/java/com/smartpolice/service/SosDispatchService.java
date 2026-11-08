package com.smartpolice.service;

import com.smartpolice.dto.SosAlertResponse;
import com.smartpolice.dto.SosStatusUpdateRequest;
import com.smartpolice.dto.SosTriggerRequest;
import com.smartpolice.entity.PoliceStation;
import com.smartpolice.entity.SosAlert;
import com.smartpolice.entity.User;
import com.smartpolice.repository.PoliceStationRepository;
import com.smartpolice.repository.SosAlertRepository;
import com.smartpolice.repository.UserRepository;
import com.smartpolice.security.Role;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SosDispatchService {

    private static final Logger log = LoggerFactory.getLogger(SosDispatchService.class);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String ALPHANUM = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    private final SosAlertRepository sosAlertRepository;
    private final PoliceStationRepository policeStationRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    /**
     * Trigger high-priority emergency SOS distress beacon
     */
    @Transactional
    public SosAlertResponse triggerSos(SosTriggerRequest req, User senderOrNull) {
        log.warn("CRITICAL EMERGENCY: SOS beacon activated at coordinates ({}, {})", req.getLatitude(), req.getLongitude());

        // 1. Resolve nearest police station
        PoliceStation nearestStation = findNearestStation(req.getLatitude(), req.getLongitude());
        Double distanceKm = null;
        if (nearestStation != null && nearestStation.getLatitude() != null && nearestStation.getLongitude() != null) {
            distanceKm = haversineDistanceKm(req.getLatitude(), req.getLongitude(),
                    nearestStation.getLatitude(), nearestStation.getLongitude());
        }

        // 2. Query active duty officers in the beat zone / station
        List<User> activeOfficers = new ArrayList<>();
        List<String> officerRanks = new ArrayList<>();
        if (nearestStation != null) {
            List<Role> dispatchRoles = List.of(
                    Role.ROLE_CONSTABLE,
                    Role.ROLE_HEAD_CONSTABLE,
                    Role.ROLE_ASI,
                    Role.ROLE_SUB_INSPECTOR,
                    Role.ROLE_SHO
            );
            activeOfficers = userRepository.findByStationIdAndRoleIn(nearestStation.getId(), dispatchRoles);
            officerRanks = activeOfficers.stream().map(u -> u.getRole().name()).distinct().toList();
        }

        // 3. Generate secure tracking token: SOS-YYYY-XXXXXX
        String alertToken = generateAlertToken();

        String phone = req.getPhoneNumber();
        if ((phone == null || phone.isBlank()) && senderOrNull != null) {
            phone = senderOrNull.getPhoneNumber();
        }

        SosAlert alert = SosAlert.builder()
                .alertToken(alertToken)
                .sender(senderOrNull)
                .phoneNumber(phone)
                .latitude(req.getLatitude())
                .longitude(req.getLongitude())
                .assignedStation(nearestStation)
                .status("ACTIVE")
                .notes(req.getNotes() != null ? req.getNotes() : "Citizen Emergency Distress Beacon Activated")
                .build();

        SosAlert saved = sosAlertRepository.save(alert);
        log.info("SOS Alert saved: ID [{}], Token [{}], Nearest Station: [{}] ({} km)",
                saved.getId(), saved.getAlertToken(),
                nearestStation != null ? nearestStation.getStationName() : "None",
                distanceKm);

        SosAlertResponse response = SosAlertResponse.fromEntity(saved, distanceKm, activeOfficers.size(), officerRanks);

        // 4. Broadcast distress beacon via Spring STOMP WebSocket
        try {
            if (nearestStation != null) {
                // Station specific channel
                messagingTemplate.convertAndSend("/topic/sos/" + nearestStation.getId(), response);
            }
            // Broad state-wide emergency channel
            messagingTemplate.convertAndSend("/topic/sos/broadcast", response);
            log.info("Real-time WebSocket SOS broadcast dispatched for alert [{}]", alertToken);
        } catch (Exception e) {
            log.error("Failed to broadcast WebSocket SOS alert: {}", e.getMessage());
        }

        return response;
    }

    /**
     * Acknowledge SOS distress call by station officer
     */
    @Transactional
    public SosAlertResponse acknowledgeAlert(Long id, User officer) {
        SosAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOS alert not found with ID: " + id));

        alert.setStatus("ACKNOWLEDGED");
        String note = (alert.getNotes() != null ? alert.getNotes() + "\n" : "") +
                String.format("[%s] Acknowledged by %s (%s)", LocalDateTime.now(), officer.getFullName(), officer.getBadgeNumber());
        alert.setNotes(note);

        SosAlert saved = sosAlertRepository.save(alert);
        SosAlertResponse response = buildResponse(saved);

        broadcastUpdate(response);
        return response;
    }

    /**
     * Dispatch PCR Van / Patrol Unit to emergency location
     */
    @Transactional
    public SosAlertResponse dispatchPatrol(Long id, String patrolUnit, User officer) {
        SosAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOS alert not found with ID: " + id));

        alert.setStatus("PATROL_DISPATCHED");
        alert.setDispatchedPatrolUnit(patrolUnit);
        String note = (alert.getNotes() != null ? alert.getNotes() + "\n" : "") +
                String.format("[%s] Patrol Unit [%s] dispatched by %s", LocalDateTime.now(), patrolUnit, officer.getFullName());
        alert.setNotes(note);

        SosAlert saved = sosAlertRepository.save(alert);
        SosAlertResponse response = buildResponse(saved);

        broadcastUpdate(response);
        return response;
    }

    /**
     * Resolve SOS distress beacon
     */
    @Transactional
    public SosAlertResponse resolveAlert(Long id, SosStatusUpdateRequest req, User officer) {
        SosAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOS alert not found with ID: " + id));

        String newStatus = req.getStatus() != null ? req.getStatus() : "RESOLVED";
        alert.setStatus(newStatus);
        if (req.getDispatchedPatrolUnit() != null) {
            alert.setDispatchedPatrolUnit(req.getDispatchedPatrolUnit());
        }

        String note = (alert.getNotes() != null ? alert.getNotes() + "\n" : "") +
                String.format("[%s] Marked %s by %s. Resolution Notes: %s",
                        LocalDateTime.now(), newStatus, officer.getFullName(), req.getNotes() != null ? req.getNotes() : "Resolved successfully");
        alert.setNotes(note);

        SosAlert saved = sosAlertRepository.save(alert);
        SosAlertResponse response = buildResponse(saved);

        broadcastUpdate(response);
        return response;
    }

    public List<SosAlertResponse> getActiveAlerts() {
        return sosAlertRepository.findByStatus("ACTIVE").stream()
                .map(this::buildResponse)
                .toList();
    }

    public List<SosAlertResponse> getAlertsForStation(Long stationId) {
        return sosAlertRepository.findByAssignedStationId(stationId).stream()
                .map(this::buildResponse)
                .toList();
    }

    public SosAlertResponse getAlertById(Long id) {
        SosAlert alert = sosAlertRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("SOS alert not found with ID: " + id));
        return buildResponse(alert);
    }

    public SosAlertResponse getAlertByToken(String alertToken) {
        SosAlert alert = sosAlertRepository.findByAlertToken(alertToken)
                .orElseThrow(() -> new IllegalArgumentException("SOS alert not found with token: " + alertToken));
        return buildResponse(alert);
    }

    private void broadcastUpdate(SosAlertResponse response) {
        try {
            messagingTemplate.convertAndSend("/topic/sos/updates", response);
            if (response.getAssignedStationId() != null) {
                messagingTemplate.convertAndSend("/topic/sos/" + response.getAssignedStationId(), response);
            }
        } catch (Exception e) {
            log.error("Failed to broadcast SOS update over WebSocket: {}", e.getMessage());
        }
    }

    private SosAlertResponse buildResponse(SosAlert alert) {
        Double dist = null;
        if (alert.getAssignedStation() != null && alert.getLatitude() != null && alert.getLongitude() != null) {
            dist = haversineDistanceKm(alert.getLatitude(), alert.getLongitude(),
                    alert.getAssignedStation().getLatitude(), alert.getAssignedStation().getLongitude());
        }
        return SosAlertResponse.fromEntity(alert, dist, 0, List.of());
    }

    private PoliceStation findNearestStation(double lat, double lon) {
        List<PoliceStation> stations = policeStationRepository.findByIsActiveTrue();
        if (stations.isEmpty()) {
            stations = policeStationRepository.findAll();
        }
        if (stations.isEmpty()) return null;

        PoliceStation nearest = null;
        double minDistance = Double.MAX_VALUE;

        for (PoliceStation ps : stations) {
            if (ps.getLatitude() == null || ps.getLongitude() == null) continue;
            double dist = haversineDistanceKm(lat, lon, ps.getLatitude(), ps.getLongitude());
            if (dist < minDistance) {
                minDistance = dist;
                nearest = ps;
            }
        }
        return nearest;
    }

    private double haversineDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // Earth radius in km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private String generateAlertToken() {
        int year = Year.now().getValue();
        StringBuilder sb = new StringBuilder(6);
        for (int i = 0; i < 6; i++) {
            sb.append(ALPHANUM.charAt(RANDOM.nextInt(ALPHANUM.length())));
        }
        return String.format("SOS-%d-%s", year, sb);
    }
}
