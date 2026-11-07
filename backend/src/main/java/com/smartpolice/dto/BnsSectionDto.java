package com.smartpolice.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BnsSectionDto {
    private String section;
    private String title;
    private String description;
    private String ipcEquivalent;
    private Boolean cognizable;
    private Boolean bailable;
    private Integer severity;
    private String category;
}
