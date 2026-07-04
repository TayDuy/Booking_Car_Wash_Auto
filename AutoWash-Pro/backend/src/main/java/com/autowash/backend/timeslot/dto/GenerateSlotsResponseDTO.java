package com.autowash.backend.timeslot.dto;

import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GenerateSlotsResponseDTO {
    private Integer year;
    private Integer month;
    private Integer daysInMonth;
    private Integer totalCandidates;
    private Integer created;
    private Integer skipped;
    private List<String> skippedReasons;
}