package com.interviewai.profession;

import com.interviewai.common.*;
import com.interviewai.profession.dto.*;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;

@RestController
@RequestMapping("/api/professions")
public class ProfessionController {
    private final ProfessionRepository professions;
    public ProfessionController(ProfessionRepository professions) { this.professions = professions; }

    @GetMapping
    public List<ProfessionDto> list() {
        return professions.findAll().stream().map(ProfessionDto::from).toList();
    }

    @GetMapping("/options")
    public OptionsDto options() {
        return new OptionsDto(
            Arrays.stream(Level.values()).map(Enum::name).toList(),
            Arrays.stream(InterviewType.values()).map(Enum::name).toList(),
            Arrays.stream(Dimension.values()).map(Enum::name).toList());
    }
}
