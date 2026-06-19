import { http, HttpResponse } from "msw";
import { screen } from "@testing-library/react";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { DashboardPage } from "./DashboardPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("DashboardPage", () => {
  beforeEach(() => useAuthStore.setState({ token: "t", user: { name: "Ana", email: "a@test.com" } }));

  it("renders the user's interview history", async () => {
    server.use(http.get(`${BASE}/interviews`, () => HttpResponse.json([
      { id: 1, roleTitle: "Backend Dev", level: "JUNIOR", type: "MIXED", status: "FINISHED", overallScore: 82, startedAt: "2026-06-18T10:00:00Z" },
    ])));
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText("Backend Dev")).toBeInTheDocument();
    expect(screen.getAllByText(/82/).length).toBeGreaterThan(0);
  });

  it("shows an empty state with a CTA when there is no history", async () => {
    server.use(http.get(`${BASE}/interviews`, () => HttpResponse.json([])));
    renderWithProviders(<DashboardPage />);
    expect(await screen.findByText(/aún no tienes entrevistas/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /nueva entrevista/i })).toBeInTheDocument();
  });
});
