import { http, HttpResponse } from "msw";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/utils";
import { LoginPage } from "./LoginPage";
import { useAuthStore } from "@/stores/authStore";

const BASE = "http://localhost:8080/api";

describe("LoginPage", () => {
  beforeEach(() => useAuthStore.setState({ token: null, user: null }));

  it("logs in and stores the token", async () => {
    server.use(http.post(`${BASE}/auth/login`, () =>
      HttpResponse.json({ token: "tok", name: "Ana", email: "ana@test.com" })));
    renderWithProviders(<LoginPage />, { route: "/login" });

    await userEvent.type(screen.getByLabelText(/email/i), "ana@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "secret123");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    await waitFor(() => expect(useAuthStore.getState().token).toBe("tok"));
  });

  it("shows an error message on invalid credentials", async () => {
    server.use(http.post(`${BASE}/auth/login`, () =>
      HttpResponse.json({ message: "Credenciales inválidas" }, { status: 401 })));
    renderWithProviders(<LoginPage />, { route: "/login" });

    await userEvent.type(screen.getByLabelText(/email/i), "x@test.com");
    await userEvent.type(screen.getByLabelText(/contraseña/i), "bad");
    await userEvent.click(screen.getByRole("button", { name: /iniciar sesión/i }));

    expect(await screen.findByText(/credenciales inválidas/i)).toBeInTheDocument();
  });
});
