package com.smartpolice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrimeClusterDto {

    private Integer clusterId;
    private Double centroidLatitude;
    private Double centroidLongitude;
    private Double radiusMeters;
    private Integer incidentCount;
    private String riskLevel; // CRITICAL, HIGH, MEDIUM, LOW
    private String peakHours; // e.g. "21:00 - 02:00"
    private List<String> topBnsSections;
    private List<String> topCategories;
    private String primaryLocationLandmark;
    private List<CrimeIncidentPointDto> sampleIncidents;
}
