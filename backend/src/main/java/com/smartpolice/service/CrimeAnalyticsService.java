package com.smartpolice.service;

import com.smartpolice.dto.CrimeClusterDto;
import com.smartpolice.dto.CrimeIncidentPointDto;
import com.smartpolice.dto.TemporalTrendDto;
import com.smartpolice.entity.Complaint;
import com.smartpolice.repository.ComplaintRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CrimeAnalyticsService {

    private static final Logger log = LoggerFactory.getLogger(CrimeAnalyticsService.class);
    private final ComplaintRepository complaintRepository;

    /**
     * Compute Density-Based Spatial Clustering of Applications with Noise (DBSCAN)
     * using native spherical Haversine distance without Euclidean distortion.
     *
     * @param epsMeters Radius parameter in meters (default 500m = 0.5km)
     * @param minPoints Minimum incidents to establish a dense cluster (default 3)
     */
    public List<CrimeClusterDto> computeSpatialHotspots(double epsMeters, int minPoints) {
        List<Complaint> complaints = complaintRepository.findAll().stream()
                .filter(c -> c.getLatitude() != null && c.getLongitude() != null)
                .toList();

        if (complaints.isEmpty()) {
            return Collections.emptyList();
        }

        log.info("Computing DBSCAN spatial clustering over {} incident records (eps: {}m, minPoints: {})",
                complaints.size(), epsMeters, minPoints);

        // Standard DBSCAN tracking structures
        Set<Long> visited = new HashSet<>();
        Map<Long, Integer> clusterAssignment = new HashMap<>(); // complaintId -> clusterId
        int clusterIdCounter = 1;

        for (Complaint p : complaints) {
            if (visited.contains(p.getId())) continue;
            visited.add(p.getId());

            List<Complaint> neighbors = getSpatialNeighbors(p, complaints, epsMeters);
            if (neighbors.size() < minPoints) {
                // Marked as noise for now (may be absorbed later by another core cluster)
                continue;
            }

            // Start new cluster
            int currentClusterId = clusterIdCounter++;
            clusterAssignment.put(p.getId(), currentClusterId);

            Queue<Complaint> queue = new LinkedList<>(neighbors);
            while (!queue.isEmpty()) {
                Complaint q = queue.poll();
                if (!visited.contains(q.getId())) {
                    visited.add(q.getId());
                    List<Complaint> qNeighbors = getSpatialNeighbors(q, complaints, epsMeters);
                    if (qNeighbors.size() >= minPoints) {
                        queue.addAll(qNeighbors);
                    }
                }
                if (!clusterAssignment.containsKey(q.getId())) {
                    clusterAssignment.put(q.getId(), currentClusterId);
                }
            }
        }

        // Group complaints by cluster ID
        Map<Integer, List<Complaint>> clusterGroups = new HashMap<>();
        for (Complaint c : complaints) {
            Integer cId = clusterAssignment.get(c.getId());
            if (cId != null) {
                clusterGroups.computeIfAbsent(cId, k -> new ArrayList<>()).add(c);
            }
        }

        List<CrimeClusterDto> clusters = new ArrayList<>();
        for (Map.Entry<Integer, List<Complaint>> entry : clusterGroups.entrySet()) {
            List<Complaint> members = entry.getValue();

            // Compute Centroid
            double sumLat = 0;
            double sumLon = 0;
            for (Complaint m : members) {
                sumLat += m.getLatitude();
                sumLon += m.getLongitude();
            }
            double centroidLat = sumLat / members.size();
            double centroidLon = sumLon / members.size();

            // Compute Radius (max distance from centroid)
            double maxDistMeters = 0;
            for (Complaint m : members) {
                double dist = haversineMeters(centroidLat, centroidLon, m.getLatitude(), m.getLongitude());
                if (dist > maxDistMeters) {
                    maxDistMeters = dist;
                }
            }

            // Determine Risk Level & Peak Hours
            String riskLevel = evaluateRiskLevel(members);
            String peakHours = calculatePeakHours(members);

            // Extract top BNS sections & categories
            Map<String, Long> bnsCounts = members.stream()
                    .map(Complaint::getBnsSections)
                    .filter(Objects::nonNull)
                    .flatMap(s -> Arrays.stream(s.split(",")))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

            List<String> topBns = bnsCounts.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(4)
                    .map(Map.Entry::getKey)
                    .toList();

            Map<String, Long> catCounts = members.stream()
                    .map(Complaint::getAiPredictedCategory)
                    .filter(Objects::nonNull)
                    .collect(Collectors.groupingBy(s -> s, Collectors.counting()));

            List<String> topCats = catCounts.entrySet().stream()
                    .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                    .limit(3)
                    .map(Map.Entry::getKey)
                    .toList();

            String primaryLandmark = members.get(0).getIncidentLocation();

            List<CrimeIncidentPointDto> samplePoints = members.stream()
                    .limit(10)
                    .map(m -> CrimeIncidentPointDto.builder()
                            .id(m.getId())
                            .trackingToken(m.getTrackingToken())
                            .latitude(m.getLatitude())
                            .longitude(m.getLongitude())
                            .location(m.getIncidentLocation())
                            .category(m.getAiPredictedCategory())
                            .bnsSections(m.getBnsSections())
                            .timestamp(m.getIncidentTimestamp())
                            .build())
                    .toList();

            clusters.add(CrimeClusterDto.builder()
                    .clusterId(entry.getKey())
                    .centroidLatitude(Math.round(centroidLat * 1000000.0) / 1000000.0)
                    .centroidLongitude(Math.round(centroidLon * 1000000.0) / 1000000.0)
                    .radiusMeters(Math.round(Math.max(maxDistMeters, 50.0) * 10.0) / 10.0)
                    .incidentCount(members.size())
                    .riskLevel(riskLevel)
                    .peakHours(peakHours)
                    .topBnsSections(topBns)
                    .topCategories(topCats)
                    .primaryLocationLandmark(primaryLandmark)
                    .sampleIncidents(samplePoints)
                    .build());
        }

        // Sort by incident count descending
        clusters.sort((a, b) -> Integer.compare(b.getIncidentCount(), a.getIncidentCount()));
        return clusters;
    }

    /**
     * Compute temporal patterns: Morning vs Afternoon vs Evening vs Night
     */
    public TemporalTrendDto computeTemporalTrends() {
        List<Complaint> all = complaintRepository.findAll();

        long morning = 0;
        long afternoon = 0;
        long evening = 0;
        long lateNight = 0;

        Map<String, Long> dayOfWeek = new LinkedHashMap<>();
        for (String day : List.of("MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY")) {
            dayOfWeek.put(day, 0L);
        }

        Map<String, Long> categoryMap = new HashMap<>();
        Map<String, Long> stationMap = new HashMap<>();

        for (Complaint c : all) {
            LocalDateTime ts = c.getIncidentTimestamp() != null ? c.getIncidentTimestamp() : c.getCreatedAt();
            if (ts != null) {
                int hour = ts.getHour();
                if (hour >= 6 && hour < 12) morning++;
                else if (hour >= 12 && hour < 18) afternoon++;
                else if (hour >= 18 && hour < 22) evening++;
                else lateNight++;

                String dow = ts.getDayOfWeek().name();
                dayOfWeek.put(dow, dayOfWeek.getOrDefault(dow, 0L) + 1);
            }

            String cat = c.getAiPredictedCategory() != null ? c.getAiPredictedCategory() : "GENERAL_OFFENCE";
            categoryMap.put(cat, categoryMap.getOrDefault(cat, 0L) + 1);

            String stName = c.getStation() != null ? c.getStation().getStationName() : "Unassigned";
            stationMap.put(stName, stationMap.getOrDefault(stName, 0L) + 1);
        }

        return TemporalTrendDto.builder()
                .totalIncidents(all.size())
                .morningCount(morning)
                .afternoonCount(afternoon)
                .eveningCount(evening)
                .lateNightCount(lateNight)
                .dayOfWeekDistribution(dayOfWeek)
                .categoryDistribution(categoryMap)
                .stationDistribution(stationMap)
                .build();
    }

    private List<Complaint> getSpatialNeighbors(Complaint target, List<Complaint> all, double epsMeters) {
        List<Complaint> neighbors = new ArrayList<>();
        for (Complaint other : all) {
            if (other.getLatitude() == null || other.getLongitude() == null) continue;
            double dist = haversineMeters(target.getLatitude(), target.getLongitude(),
                    other.getLatitude(), other.getLongitude());
            if (dist <= epsMeters) {
                neighbors.add(other);
            }
        }
        return neighbors;
    }

    private double haversineMeters(double lat1, double lon1, double lat2, double lon2) {
        final double R = 6371000.0; // Earth radius in meters
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    private String evaluateRiskLevel(List<Complaint> members) {
        boolean hasCritical = members.stream().anyMatch(c -> {
            String bns = c.getBnsSections() != null ? c.getBnsSections().toUpperCase() : "";
            String cat = c.getAiPredictedCategory() != null ? c.getAiPredictedCategory().toUpperCase() : "";
            return bns.contains("103") || bns.contains("63") || bns.contains("310") ||
                   cat.contains("HOMICIDE") || cat.contains("RAPE") || cat.contains("DACOITY");
        });
        if (hasCritical) return "CRITICAL";

        boolean hasHigh = members.stream().anyMatch(c -> {
            String bns = c.getBnsSections() != null ? c.getBnsSections().toUpperCase() : "";
            String cat = c.getAiPredictedCategory() != null ? c.getAiPredictedCategory().toUpperCase() : "";
            return bns.contains("304") || bns.contains("308") || bns.contains("115") ||
                   cat.contains("SNATCHING") || cat.contains("ROBBERY") || cat.contains("ASSAULT");
        });
        if (hasHigh || members.size() >= 5) return "HIGH";

        if (members.size() >= 3) return "MEDIUM";
        return "LOW";
    }

    private String calculatePeakHours(List<Complaint> members) {
        int[] hourCounts = new int[24];
        for (Complaint c : members) {
            LocalDateTime dt = c.getIncidentTimestamp() != null ? c.getIncidentTimestamp() : c.getCreatedAt();
            if (dt != null) {
                hourCounts[dt.getHour()]++;
            }
        }

        // Find 4-hour window with highest count
        int maxCount = -1;
        int peakStart = 20;
        for (int i = 0; i < 24; i++) {
            int window = hourCounts[i] + hourCounts[(i + 1) % 24] + hourCounts[(i + 2) % 24] + hourCounts[(i + 3) % 24];
            if (window > maxCount) {
                maxCount = window;
                peakStart = i;
            }
        }
        int peakEnd = (peakStart + 4) % 24;
        return String.format("%02d:00 - %02d:00", peakStart, peakEnd);
    }
}
