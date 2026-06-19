package com.interviewai.profession.dto;
import com.interviewai.profession.Profession;
public record ProfessionDto(Long id, String slug, String name, String description) {
    public static ProfessionDto from(Profession p) {
        return new ProfessionDto(p.getId(), p.getSlug(), p.getName(), p.getDescription());
    }
}
