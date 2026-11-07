package com.smartpolice.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "complaints")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Complaint {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tracking_token", unique = true, nullable = false, length = 60)
    private String trackingToken;

    @Column(name = "crime_register_number", unique = true, length = 60)
    private String crimeRegisterNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "citizen_id")
    private User citizen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_id")
    private PoliceStation station;

    @Column(name = "incident_timestamp", nullable = false)
    private LocalDateTime incidentTimestamp;

    @Column(name = "incident_location", nullable = false, length = 255)
    private String incidentLocation;

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "bns_sections", length = 255)
    private String bnsSections;

    @Column(name = "ai_predicted_category", length = 100)
    private String aiPredictedCategory;

    @Column(name = "ai_confidence_score")
    private Double aiConfidenceScore;

    @Column(nullable = false, length = 50)
    @Builder.Default
    private String status = "SUBMITTED";

    @Column(name = "rejection_reason", columnDefinition = "TEXT")
    private String rejectionReason;

    @Column(name = "is_zero_fir")
    @Builder.Default
    private Boolean isZeroFir = false;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_io_id")
    private User assignedIo;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }
}
