package com.interviewai.profession;

import jakarta.persistence.*;

@Entity
@Table(name = "professions")
public class Profession {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String slug;
    private String name;
    private String description;

    public Long getId() { return id; }
    public String getSlug() { return slug; }
    public String getName() { return name; }
    public String getDescription() { return description; }
}
