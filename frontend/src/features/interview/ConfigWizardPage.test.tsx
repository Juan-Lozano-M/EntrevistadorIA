import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { ConfigWizardPage } from "./ConfigWizardPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

function mockMeta() {
  server.use(
    http.get(`${BASE}/professions`, () => HttpResponse.json([
      { id: 1, slug: "software-development", name: "Desarrollo de Software", description: "" },
    ])),
    http.get(`${BASE}/professions/options`, () => HttpResponse.json({
      levels: ["JUNIOR", "SENIOR"], types: ["TECHNICAL", "MIXED"], dimensions: [],
    })),
  );
}

describe("ConfigWizardPage", () => {
  beforeEach(() => useAuthStore.setState({ token: "t", user: { name: "A", email: "a@test.com", plan: "FREE" } }));

  it("loads professions and options", async () => {
    mockMeta();
    renderWithProviders(<ConfigWizardPage />);
    expect(await screen.findByText("Desarrollo de Software")).toBeInTheDocument();
  });

  it("submits and creates an interview", async () => {
    mockMeta();
    let created: any = null;
    server.use(http.post(`${BASE}/interviews`, async ({ request }) => {
      created = await request.json();
      return HttpResponse.json({ id: 7, roleTitle: created.roleTitle, level: created.level, type: created.type, status: "IN_PROGRESS", overallScore: null, startedAt: "x" });
    }));
    renderWithProviders(<ConfigWizardPage />);
    await screen.findByText("Desarrollo de Software");

    // Step 1: pick the profession, then continue.
    await userEvent.click(screen.getByText("Desarrollo de Software"));
    await userEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Step 2: enter the role, then continue.
    await userEvent.type(screen.getByLabelText(/cargo/i), "Backend Dev");
    await userEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Step 3: keep defaults, continue.
    await userEvent.click(screen.getByRole("button", { name: /continuar/i }));

    // Step 4: start the interview.
    await userEvent.click(screen.getByRole("button", { name: /comenzar entrevista/i }));

    await waitFor(() => expect(created).toMatchObject({ professionSlug: "software-development", roleTitle: "Backend Dev" }));
  });
});
