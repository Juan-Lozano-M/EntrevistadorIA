package com.interviewai.question;

import com.interviewai.common.InterviewType;
import com.interviewai.common.Level;
import com.interviewai.profession.*;
import com.interviewai.support.PostgresIT;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.List;
import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class BankQuestionProviderIT extends PostgresIT {

    @Autowired QuestionProvider provider;
    @Autowired ProfessionRepository professions;

    @Test
    void selectsQuestionsForProfession() {
        Long pid = professions.findBySlug("software-development").orElseThrow().getId();
        List<Question> qs = provider.selectQuestions(pid, Level.JUNIOR, InterviewType.MIXED, "es", 5);
        assertThat(qs).isNotEmpty();
        assertThat(qs.size()).isLessThanOrEqualTo(5);
        assertThat(qs.get(0).getExpectedKeywords()).isNotNull();
    }

    @Test
    void mixedTypePullsAcrossTypes() {
        Long pid = professions.findBySlug("software-development").orElseThrow().getId();
        List<Question> qs = provider.selectQuestions(pid, Level.JUNIOR, InterviewType.MIXED, "es", 10);
        long distinctTypes = qs.stream().map(Question::getType).distinct().count();
        assertThat(distinctTypes).isGreaterThan(1);
    }
}
