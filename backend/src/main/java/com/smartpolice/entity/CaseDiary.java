package com.smartpolice.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "case_diaries")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class CaseDiary {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "complaint_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "citizen", "station", "assignedIo"})
    private Complaint complaint;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "io_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "station", "passwordHash"})
    private User io;

    @Column(name = "entry_number", nullable = false)
    private Integer entryNumber;

    @Column(name = "entry_timestamp", nullable = false)
    private LocalDateTime entryTimestamp;

    @Column(name = "investigation_notes", nullable = false, columnDefinition = "TEXT")
    private String investigationNotes;

    @Column(name = "actions_taken", nullable = false, columnDefinition = "TEXT")
    private String actionsTaken;

    @Column(name = "witness_statements", columnDefinition = "JSON")
    private String witnessStatements;

    @Column(name = "seizure_details", columnDefinition = "TEXT")
    private String seizureDetails;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.entryTimestamp == null) {
            this.entryTimestamp = LocalDateTime.now();
        }
    }
}
