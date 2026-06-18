package com.interviewai.migration;

import com.interviewai.support.PostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class MigrationIT extends PostgresIT {

    @Autowired JdbcTemplate jdbc;

    @Test
    void seedsSoftwareDevelopmentProfessionWithQuestions() {
        Integer professions = jdbc.queryForObject(
            "SELECT count(*) FROM professions WHERE slug = 'software-development'", Integer.class);
        assertThat(professions).isEqualTo(1);

        Integer questions = jdbc.queryForObject(
            "SELECT count(*) FROM questions q JOIN professions p ON q.profession_id = p.id " +
            "WHERE p.slug = 'software-development'", Integer.class);
        assertThat(questions).isGreaterThanOrEqualTo(6);
    }
}
