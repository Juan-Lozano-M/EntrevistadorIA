import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { Routes, Route } from "react-router-dom";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { ResultsPage } from "./ResultsPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("ResultsPage", () => {
  beforeEach(() => useAuthStore.setState({ token: "t", user: { name: "A", email: "a@test.com" } }));

  it("renders overall score, feedback and model-answer comparison", async () => {
    server.use(http.get(`${BASE}/interviews/7/results`, () => HttpResponse.json({
      sessionId: 7, roleTitle: "Backend Dev", level: "JUNIOR", type: "MIXED", overallScore: 78,
      dimensionScores: { COMMUNICATION: 80, DOMAIN_KNOWLEDGE: 76 },
      feedback: { strengths: ["Comunicación: buen nivel"], weaknesses: [], recommendations: [], improvementPlan: [] },
      answers: [{ questionId: 11, questionText: "¿Qué es REST?", answerText: "Mi respuesta", modelAnswer: "Respuesta modelo", dimensionScores: { DOMAIN_KNOWLEDGE: 76 } }],
    })));

    renderWithProviders(
      <Routes><Route path="/results/:id" element={<ResultsPage />} /></Routes>,
      { route: "/results/7" },
    );

    expect(await screen.findByText("78")).toBeInTheDocument();
    expect(screen.getByText(/comunicación: buen nivel/i)).toBeInTheDocument();
    expect(screen.getByText("Respuesta modelo")).toBeInTheDocument();
  });
});
