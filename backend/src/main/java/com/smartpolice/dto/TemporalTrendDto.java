package com.smartpolice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TemporalTrendDto {

    private long totalIncidents;
    private long morningCount;    // 06:00 - 12:00
    private long afternoonCount;  // 12:00 - 18:00
    private long eveningCount;    // 18:00 - 22:00
    private long lateNightCount;  // 22:00 - 06:00
    private Map<String, Long> dayOfWeekDistribution;
    private Map<String, Long> categoryDistribution;
    private Map<String, Long> stationDistribution;
}
