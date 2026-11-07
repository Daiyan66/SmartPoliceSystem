package com.smartpolice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CaseDiaryEntryRequest {

    private LocalDateTime entryTimestamp;

    @NotBlank(message = "Investigation notes are mandatory for Case Diary (CD) entry")
    private String investigationNotes;

    @NotBlank(message = "Actions taken must be recorded in Case Diary")
    private String actionsTaken;

    private String witnessStatements;

    private String seizureDetails;
}
