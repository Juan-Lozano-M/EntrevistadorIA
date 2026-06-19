import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Routes, Route } from "react-router-dom";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { InterviewPage } from "./InterviewPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("InterviewPage", () => {
  beforeEach(() => useAuthStore.setState({ token: "t", user: { name: "A", email: "a@test.com" } }));

  it("shows a question, submits an answer, then finishes and navigates to results", async () => {
    let answered = false;
    server.use(
      http.get(`${BASE}/interviews/7/next-question`, () =>
        answered
          ? HttpResponse.json({ question: null, finished: true })
          : HttpResponse.json({ question: { id: 11, text: "¿Qué es REST?", type: "TECHNICAL", index: 1, total: 1 }, finished: false })),
      http.post(`${BASE}/interviews/7/answers`, async () => { answered = true; return new HttpResponse(null, { status: 200 }); }),
      http.post(`${BASE}/interviews/7/finish`, () =>
        HttpResponse.json({ id: 7, roleTitle: "R", level: "JUNIOR", type: "MIXED", status: "FINISHED", overallScore: 70, startedAt: "x" })),
    );

    renderWithProviders(
      <Routes>
        <Route path="/interview/:id" element={<InterviewPage />} />
        <Route path="/results/:id" element={<div>RESULTS PAGE 7</div>} />
      </Routes>,
      { route: "/interview/7" },
    );

    expect(await screen.findByText("¿Qué es REST?")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox"), "Es un estilo de arquitectura HTTP stateless.");
    await userEvent.click(screen.getByRole("button", { name: /enviar/i }));

    expect(await screen.findByText("RESULTS PAGE 7")).toBeInTheDocument();
  });
});
