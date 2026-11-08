package com.smartpolice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CrimeIncidentPointDto {
    private Long id;
    private String trackingToken;
    private Double latitude;
    private Double longitude;
    private String location;
    private String category;
    private String bnsSections;
    private LocalDateTime timestamp;
}
